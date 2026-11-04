<?php
declare(strict_types=1);
if(!getenv('MATH_MATCH_STORAGE'))exit(1);
require dirname(__DIR__).'/src/lib.php';
require dirname(__DIR__).'/src/domain.php';
require dirname(__DIR__).'/src/profile-api.php';
function recordId(array $b):int{return (int)$b['id'];}
function check(bool $v,string $m):void{if(!$v)throw new RuntimeException($m);}
function reject(callable $f):void{try{$f();}catch(InvalidArgumentException $e){return;}throw new RuntimeException('Oczekiwano odrzucenia.');}
$_SESSION=[];$_SERVER['REMOTE_ADDR']='127.0.0.1';
check(loginKey("  ŻÓŁĆ  ")===loginKey('żółć'),'Polskie litery');
check(loginKey("O\u{0301}la")===loginKey('ÓLA'),'Postać Unicode');
check(loginKey("\u{00A0}Straße\u{00A0}")===loginKey('STRASSE'),'Case folding i spacje Unicode');
foreach(['abcdefghijk','same małe słowa','zażółć gęślą jaźń',' abc def ',str_repeat('ąb',64)] as $password){
    check(accountPassword(['password'=>$password])===$password,'Bez modyfikacji hasła');
    $hash=hashAccountPassword($password);check(verifyAccountPassword($password,$hash),'Weryfikacja');
    check(!verifyAccountPassword($password.'x',$hash),'Bez obcinania hasła');
    $fallback='bcrypt-sha384$'.password_hash(base64_encode(hash('sha384',$password,true)),PASSWORD_BCRYPT);
    check(verifyAccountPassword($password,$fallback),'Fallback dla Unicode');
    check(!verifyAccountPassword($password.'x',$fallback),'Fallback bez obcinania');
}
foreach(['1234567','password','password123','12345678','qwerty123','admin123','haslo123',str_repeat('x',129),[],"abc\0defghi"] as $password)reject(fn()=>accountPassword(['password'=>$password]));
$data=['nickname'=>' Żółć ','display_name'=>'Ola','avatar'=>'🦄','password'=>'moje zielone drzewo','password_repeat'=>'moje zielone drzewo','consent'=>false];
$p=profileApi('profile.register',$data)['profile'];check(profile()['id']===$p['id'],'Automatyczne logowanie');
check($p['display_name']==='Ola'&&!isset($p['password_hash']),'Publiczne dane');
$data['nickname']='ŻÓŁĆ';reject(fn()=>profileApi('profile.register',$data));
check((int)query('SELECT COUNT(*) FROM profiles')->fetchColumn()===1,'Podwójne wysłanie bez duplikatu');
try{query('INSERT INTO profiles(nickname,nickname_key,display_name,avatar,password_hash,created_at,last_active) SELECT nickname,nickname_key,display_name,avatar,password_hash,created_at,last_active FROM profiles');throw new RuntimeException('UNIQUE nie działa');}catch(PDOException $e){check($e->getCode()==='23000','Ograniczenie SQLite');}
$data['nickname']='Druga';$p2=profileApi('profile.register',$data)['profile'];check($p2['display_name']==='Ola','Imiona mogą się powtarzać');
$update=['nickname'=>'Nowa','display_name'=>'Ala','avatar'=>'🐼','consent'=>true,'password'=>'nowe dobre słowa','password_repeat'=>'nowe dobre słowa'];
reject(fn()=>profileApi('profile.update',$update));
check(profile()['nickname']==='Druga','Odrzucona zmiana atomowa');
$otherSession=$_SESSION;
$update['current_password']='moje zielone drzewo';profileApi('profile.update',$update);$newSession=$_SESSION;
$_SESSION=$otherSession;check(profile()===null,'Zmiana hasła odwołuje inne sesje');$_SESSION=$newSession;
check(profile()['nickname']==='Nowa','Aktualna sesja po zmianie');
profileApi('profile.logout',[]);
reject(fn()=>profileApi('profile.login',['nickname'=>'Nowa','password'=>'moje zielone drzewo']));
profileApi('profile.login',['nickname'=>' NOWA ','password'=>'nowe dobre słowa']);
check(profile()['id']===$p2['id'],'Nowe hasło działa');
reject(fn()=>profileApi('profile.login',['nickname'=>'Nowa','password'=>'nowe dobre słowa','remembered_id'=>$p['id']]));
$installation=readSetting('installation_id');writeSetting('installation_id','different-installation');
check(profile()===null,'Nowa instalacja odrzuca starą sesję');writeSetting('installation_id',$installation);
reject(fn()=>saveAccount(['nickname'=>'ŻÓŁĆ','avatar'=>'🐼','consent'=>false],$p2['id']));
check(profile()['nickname']==='Nowa','Kolizja edycji nie zmienia ksywki');
query('UPDATE profiles SET password_hash=? WHERE id=?',['bcrypt-sha384$'.password_hash(base64_encode(hash('sha384','nowe dobre słowa',true)),PASSWORD_BCRYPT),$p2['id']]);
profileApi('profile.login',['nickname'=>'Nowa','password'=>'nowe dobre słowa']);
if(defined('PASSWORD_ARGON2ID'))check(str_starts_with(profile()['password_hash'],'$argon2id$'),'Aktualizacja algorytmu po logowaniu');

query('DELETE FROM rate_limits');
for($i=0;$i<8;$i++)reject(fn()=>profileApi('profile.login',['nickname'=>'Nowa','password'=>'błędne hasło']));
$_SERVER['REMOTE_ADDR']='127.0.0.2';$_SERVER['HTTPS']='on';
reject(fn()=>profileApi('profile.login',['nickname'=>'Nowa','password'=>'nowe dobre słowa']));
query('DELETE FROM rate_limits');
for($i=0;$i<20;$i++)reject(fn()=>profileApi('profile.login',['nickname'=>'Brak'.$i,'password'=>'błędne hasło']));
reject(fn()=>profileApi('profile.login',['nickname'=>'Nowa','password'=>'nowe dobre słowa']));
query('DELETE FROM rate_limits');
writeSetting('admin_hash','synthetic');$_SESSION['math_match_admin']=true;$_SESSION['math_match_admin_version']=hash('sha256','synthetic');
$r=profileApi('admin.recovery',['id'=>$p['id']]);
check(!query('SELECT 1 FROM profile_tokens WHERE hash=?',[$r['secret']])->fetch(),'W bazie tylko hash sekretu');
query('UPDATE profile_tokens SET expires=?',[time()-1]);reject(fn()=>profileApi('profile.recover',['secret'=>$r['secret'],'password'=>'nowe dobre słowa','password_repeat'=>'nowe dobre słowa']));
// Zapamiętane uwierzytelnienie nie przechowuje sekretu w SQLite i jest jednorazowo rotowane.
$raw=bin2hex(random_bytes(32));
query('INSERT INTO profile_tokens VALUES(?,?,?,?)',[hash('sha256',$raw),$p2['id'],time()+600,'device']);
$_COOKIE['mathmatch_account_device']=$raw;$_SESSION=[];restoreProfile();
check(profile()['id']===$p2['id'],'Odtworzenie zapamiętanego urządzenia');
check(!query('SELECT 1 FROM profile_tokens WHERE hash=?',[hash('sha256',$raw)])->fetch(),'Rotacja tokenu');
check((int)query("SELECT COUNT(*) FROM profile_tokens WHERE kind='device'")->fetchColumn()===1,'Nowy token po rotacji');
$_SESSION=[];restoreProfile();check(profile()===null,'Zużyty token nie daje dostępu');
$expired=bin2hex(random_bytes(32));query('INSERT INTO profile_tokens VALUES(?,?,?,?)',[hash('sha256',$expired),$p2['id'],time()-1,'device']);
$_COOKIE['mathmatch_account_device']=$expired;restoreProfile();check(profile()===null,'Wygasłe urządzenie');
$raw=bin2hex(random_bytes(32));query('INSERT INTO profile_tokens VALUES(?,?,?,?)',[hash('sha256',$raw),$p2['id'],time()+600,'device']);
$_COOKIE['mathmatch_account_device']=$raw;signIn(query('SELECT * FROM profiles WHERE id=?',[$p2['id']])->fetch());
profileApi('profile.logout',[]);restoreProfile();check(profile()===null,'Wylogowanie nie pozwala odtworzyć dostępu');
check(!query('PRAGMA foreign_key_check')->fetch(),'Klucze obce');
echo "OK: normalizacja, UNIQUE, polityka haseł, fallback, logowanie, zmiany, limity, odzyskiwanie\n";
