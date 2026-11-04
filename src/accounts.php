<?php
declare(strict_types=1);

/** NFC + Unicode case folding + NFC; identyczne reguły dla wszystkich zapisów i odczytów. */
function loginName(mixed $value): string {
    if (!is_string($value) || !preg_match('//u', $value)) invalid('Podaj ksywkę do logowania (1–40 znaków).');
    $name=Normalizer::normalize(preg_replace('/^\s+|\s+$/u', '', $value), Normalizer::FORM_C);
    if ($name===false || $name==='' || stringLength($name)>40 || preg_match('/[\p{C}]/u',$name)) invalid('Podaj ksywkę do logowania (1–40 znaków).');
    return $name;
}
function loginKey(string $name): string {
    return Normalizer::normalize(mb_convert_case(loginName($name), MB_CASE_FOLD, 'UTF-8'), Normalizer::FORM_C);
}
function accountPassword(array $b, string $key='password'): string {
    $v=$b[$key]??null;
    if (!is_string($v) || !preg_match('//u',$v) || str_contains($v,"\0") || stringLength($v)<8 || stringLength($v)>128) invalid('Hasło musi mieć od 8 do 128 znaków.');
    // Lista lokalna, bez wysyłania danych do usług zewnętrznych. Nie modyfikuje hasła.
    $blocked=['password','password123','12345678','123456789','1234567890','qwerty123','qwertyuiop','admin123','haslo123','hasło123','haslo1234','hasło1234','abcdefgh','11111111','00000000','iloveyou','zaq12wsx','asdfghjk','letmein123'];
    if (in_array(mb_strtolower($v,'UTF-8'),$blocked,true) || preg_match('/^(.)\1+$/us',$v)) invalid('To hasło jest zbyt popularne. Wybierz inne, np. kilka słów.');
    return $v;
}
function hashAccountPassword(string $password): string {
    if (defined('PASSWORD_ARGON2ID')) return password_hash($password,PASSWORD_ARGON2ID);
    // SHA-384 w base64 ma 64 bajty: bcrypt otrzymuje całe wejście, także dla 128 znaków Unicode.
    return 'bcrypt-sha384$'.password_hash(base64_encode(hash('sha384',$password,true)),PASSWORD_BCRYPT);
}
function verifyAccountPassword(string $password,string $hash): bool {
    if (strlen($password)>512) return false;
    if (str_starts_with($hash,'bcrypt-sha384$')) return password_verify(base64_encode(hash('sha384',$password,true)),substr($hash,14));
    return password_verify($password,$hash);
}
function accountNeedsRehash(string $hash): bool {
    if (defined('PASSWORD_ARGON2ID')) return password_needs_rehash($hash,PASSWORD_ARGON2ID);
    return !str_starts_with($hash,'bcrypt-sha384$') || password_needs_rehash(substr($hash,14),PASSWORD_BCRYPT);
}
function accountFields(array $b): array {
    $name=loginName($b['nickname']??null);
    $display=$b['display_name']??'';
    if(!is_string($display)||!preg_match('//u',$display)||stringLength(trim($display))>40)invalid('Imię wyświetlane może mieć najwyżej 40 znaków.');
    $display=trim($display);
    return [$name,loginKey($name),$display===''?$name:$display,avatarField($b),boolField($b,'consent')];
}
function saveAccount(array $b,int $id): void {
    try {query('UPDATE profiles SET nickname=?,nickname_key=?,display_name=?,avatar=?,consent=? WHERE id=?',[...accountFields($b),$id]);}
    catch(PDOException $e){if($e->getCode()==='23000')invalid('Ta ksywka jest już zajęta. Wybierz inną, np. Jacek7.');throw $e;}
}
function authTransport(): void {
    if ((empty($_SERVER['HTTPS'])||$_SERVER['HTTPS']==='off') && !in_array($_SERVER['REMOTE_ADDR']??'', ['127.0.0.1','::1'],true)) invalid('Logowanie wymaga HTTPS.');
}
function accountAuthentication(string $action,array $b): array {
    authTransport();
    if(($b['remember']??false)===true && (empty($_SERVER['HTTPS'])||$_SERVER['HTTPS']==='off'))invalid('Zapamiętanie dostępu wymaga HTTPS.');
    if(!rateAllowed('profile-auth',20,900))invalid('Za dużo prób. Spróbuj za 15 minut.');
    if($action==='profile.register') {
        if(!rateAllowed('profile-register',5,3600))invalid('Limit tworzenia profili.');
        $fields=accountFields($b);$password=accountPassword($b);
        if(($b['password_repeat']??null)!==$password)invalid('Hasła muszą być identyczne.');
        $hash=hashAccountPassword($password);
        $p=atomic(function()use($fields,$hash){
            try{query('INSERT INTO profiles(nickname,nickname_key,display_name,avatar,consent,password_hash,created_at,last_active) VALUES(?,?,?,?,?,?,?,?)',[...$fields,$hash,time(),time()]);}
            catch(PDOException $e){if($e->getCode()==='23000')invalid('Ta ksywka jest już zajęta. Wybierz inną, np. Jacek7.');throw $e;}
            return query('SELECT * FROM profiles WHERE id=?',[(int)database()->lastInsertId()])->fetch();
        });
    } elseif($action==='profile.login') {
        $error='Nie udało się zalogować. Sprawdź ksywkę i hasło.';
        try{$key=loginKey(loginName($b['nickname']??null));}catch(InvalidArgumentException $e){invalid($error);}
        throttle('login:'.$key,8,900);
        $p=query('SELECT * FROM profiles WHERE nickname_key=?',[$key])->fetch();
        $password=$b['password']??null;
        // Hash zastępczy z tej samej konfiguracji co nowe konta, przechowywany bez sekretu w settings.
        $dummy=readSetting('dummy_password_hash');
        if(!$dummy){$dummy=hashAccountPassword(bin2hex(random_bytes(32)));writeSetting('dummy_password_hash',$dummy);}
        if(!is_string($password)||!verifyAccountPassword($password,$p['password_hash']??$dummy)||!$p || (isset($b['remembered_id']) && $b['remembered_id']!==$p['id']))invalid($error);
        $p=atomic(function()use($p,$password,$error){
            $fresh=query('SELECT * FROM profiles WHERE id=?',[$p['id']])->fetch();
            if(!$fresh || $fresh['password_hash']!==$p['password_hash'] || $fresh['auth_version']!==$p['auth_version'])invalid($error);
            if(accountNeedsRehash($fresh['password_hash']))query('UPDATE profiles SET password_hash=? WHERE id=?',[hashAccountPassword($password),$p['id']]);
            return $fresh;
        });
    } else {
        throttle('recovery:'.hash('sha256',is_string($b['secret']??null)?$b['secret']:''),8,900);
        $password=accountPassword($b);
        if(($b['password_repeat']??null)!==$password)invalid('Hasła muszą być identyczne.');
        $secret=$b['secret']??null;
        if(!is_string($secret)||!preg_match('/^[a-f0-9]{64}$/D',$secret))invalid('Nie udało się odzyskać profilu. Poproś administratora o pomoc.');
        $hash=hashAccountPassword($password);
        $p=atomic(function()use($secret,$hash){
            $t=query("SELECT * FROM profile_tokens WHERE hash=? AND kind='recovery' AND expires>?",[hash('sha256',$secret),time()])->fetch();
            if(!$t)invalid('Nie udało się odzyskać profilu. Poproś administratora o pomoc.');
            query('UPDATE profiles SET password_hash=? WHERE id=?',[$hash,$t['profile_id']]);revokeProfile($t['profile_id']);
            return query('SELECT * FROM profiles WHERE id=?',[$t['profile_id']])->fetch();
        });
    }
    if(is_string($_COOKIE['mathmatch_account_device']??null))query("DELETE FROM profile_tokens WHERE hash=? AND kind='device'",[hash('sha256',$_COOKIE['mathmatch_account_device'])]);
    tokenCookie('',time()-3600);signIn($p);
    if(($b['remember']??false)===true)rememberProfile($p['id']);
    return ['profile'=>publicProfile($p)];
}
