<?php
declare(strict_types=1);

function profileApi(string $action,array $b): array {
    // Powtórzenie po utracie odpowiedzi jest bezpieczne. Nie rotujemy sesji PHP:
    // zachowujemy CSRF i odrębne uprawnienia administratora także przy ponowieniu.
    if($action==='profile.logout') {
        atomic(function()use($b){
            $p=profile();
            if($p && isset($b['expected_profile_id']) && $b['expected_profile_id']!==$p['id'])invalid('Gracz zmienił się w innej karcie. Odśwież stronę.');
            if($p && isset($b['attempt_id'])) {
                $s=ownedAttempt(textField($b,'attempt_id',32,32),$p['id']);
                if($s['mode']==='test' && $s['status']==='active') {
                    $s=tick($s,time());$s['paused']=1;$s['status']='paused';$s['revision']++;persistAttempt($s);
                }
            }
            if(is_string($_COOKIE['mathmatch_device']??null))query("DELETE FROM profile_tokens WHERE hash=? AND kind='device'",[hash('sha256',$_COOKIE['mathmatch_device'])]);
        });
        unset($_SESSION['profile_id'],$_SESSION['profile_version'],$_SESSION['profile_expires']);
        tokenCookie('',time()-3600);return [];
    }
    if(in_array($action,['profile.register','profile.login','profile.pair-use'],true)) {
        if((empty($_SERVER['HTTPS'])||$_SERVER['HTTPS']==='off')&&!in_array($_SERVER['REMOTE_ADDR']??'', ['127.0.0.1','::1'],true))invalid('Logowanie wymaga HTTPS.');
        if(!rateAllowed('profile-auth',20,900))invalid('Za dużo prób. Spróbuj za 15 minut.');
        if(($b['remember']??false) && (empty($_SERVER['HTTPS'])||$_SERVER['HTTPS']==='off'))invalid('Zapamiętanie wymaga HTTPS.');
        if($action==='profile.register') {
            if(!rateAllowed('profile-register',5,3600))invalid('Limit tworzenia profili.');
            $name=textField($b,'nickname',1,40);$avatar=avatarField($b);$pin=pinField($b);$consent=boolField($b,'consent');
            if(($b['pin_repeat']??null)!==$pin)invalid('PIN-y muszą być identyczne.');
            $code=strtoupper(bin2hex(random_bytes(6)));
            query('INSERT INTO profiles(code,nickname,avatar,pin_hash,consent,created_at,last_active) VALUES(?,?,?,?,?,?,?)',[$code,$name,$avatar,password_hash($pin,PASSWORD_DEFAULT),$consent,time(),time()]);
            $p=query('SELECT * FROM profiles WHERE code=?',[$code])->fetch();
        } elseif($action==='profile.login') {
            $rawCode=$b['code']??null;
            if(!is_string($rawCode)||!preg_match('/^[A-Fa-f0-9]{12}$/D',trim($rawCode))) {
                invalid('Wpisz 12-znakowy kod gracza otrzymany przy tworzeniu profilu, a nie imię lub ksywkę. Jeśli go nie masz, poproś administratora o odnalezienie profilu.');
            }
            $code=strtoupper(trim($rawCode));$pin=pinField($b);throttle('code:'.$code,8,900);
            $p=query('SELECT * FROM profiles WHERE code=?',[$code])->fetch();
            // Koszt weryfikacji także dla nieistniejącego kodu.
            $hash=$p['pin_hash']??'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
            if(!password_verify($pin,$hash)||!$p)invalid('Niepoprawny kod lub PIN.');
        } else {
            $code=strtoupper(textField($b,'code',20,20));
            $p=atomic(function()use($code){
                $t=query("SELECT * FROM profile_tokens WHERE hash=? AND kind='pair' AND expires>?",[hash('sha256',$code),time()])->fetch();
                if(!$t)invalid('Kod wygasł lub został użyty.');
                query('DELETE FROM profile_tokens WHERE hash=?',[$t['hash']]);
                return query('SELECT * FROM profiles WHERE id=?',[$t['profile_id']])->fetch();
            });
        }
        if(isset($_COOKIE['mathmatch_device']))query('DELETE FROM profile_tokens WHERE hash=?',[hash('sha256',$_COOKIE['mathmatch_device'])]);
        tokenCookie('',time()-3600);signIn($p);
        if(($b['remember']??false)===true)rememberProfile($p['id']);
        return ['profile'=>publicProfile($p)];
    }
    if(str_starts_with($action,'admin.')) {
        if(!isAdmin())invalid('Wymagana autoryzacja administratora.');
        if($action==='admin.list') {
            $search=textField(['search'=>$b['search']??''],'search',0,40);$offset=max(0,min(100000,(int)($b['offset']??0)));
            $sort=($b['sort']??'activity')==='name'?'p.nickname,p.id':'p.last_active DESC,p.id';
            return ['profiles'=>query("SELECT p.id,p.code,p.nickname,p.avatar,p.consent,p.created_at,p.last_active,
                (SELECT COUNT(*) FROM sessions s WHERE s.profile_id=p.id AND s.mode='test' AND s.status='finished') tests,
                (SELECT COUNT(*) FROM progress g WHERE g.profile_id=p.id AND g.status='mastered') mastered,
                (SELECT AVG(100.0*s.score/json_array_length(v.pairs_json)) FROM sessions s JOIN quiz_versions v ON v.id=s.version_id WHERE s.profile_id=p.id AND s.mode='test' AND s.status='finished') average
                FROM profiles p WHERE p.nickname LIKE ? OR p.code LIKE ? ORDER BY $sort LIMIT 50 OFFSET ?",['%'.$search.'%','%'.$search.'%',$offset])->fetchAll()];
        }
        $id=recordId($b);
        if($action==='admin.stats')return stats($id);
        return atomic(function()use($action,$b,$id){
            if(!query('SELECT 1 FROM profiles WHERE id=?',[$id])->fetch())invalid('Brak profilu.');
            if($action==='admin.delete') {if(($b['confirm']??false)!==true)invalid('Potwierdź usunięcie.');query('DELETE FROM profiles WHERE id=?',[$id]);}
            elseif($action==='admin.revoke')revokeProfile($id);
            elseif($action==='admin.pin'){query('UPDATE profiles SET pin_hash=? WHERE id=?',[password_hash(pinField($b),PASSWORD_DEFAULT),$id]);revokeProfile($id);}
            elseif($action==='admin.update')query('UPDATE profiles SET nickname=?,avatar=?,consent=? WHERE id=?',[textField($b,'nickname',1,40),avatarField($b),boolField($b,'consent'),$id]);
            else invalid('Nieznana operacja.');
            return [];
        });
    }
    $p=requireProfile();$pid=$p['id'];
    if(isset($b['expected_profile_id']) && $b['expected_profile_id']!==$pid)invalid('Gracz zmienił się w innej karcie. Odśwież stronę.');
    if($p['last_active']<time()-60)query('UPDATE profiles SET last_active=? WHERE id=?',[time(),$pid]);
    if($action==='profile.preferences') {query('UPDATE profiles SET sound=? WHERE id=?',[boolField($b,'sound'),$pid]);return [];}
    if($action==='profile.update') {query('UPDATE profiles SET nickname=?,avatar=?,consent=? WHERE id=?',[textField($b,'nickname',1,40),avatarField($b),boolField($b,'consent'),$pid]);return [];}
    if($action==='profile.revoke') {atomic(fn()=>revokeProfile($pid));unset($_SESSION['profile_id'],$_SESSION['profile_version']);tokenCookie('',time()-3600);return [];}
    if($action==='profile.pair') {
        if(!rateAllowed('pair',5,600))invalid('Limit kodów parowania.');
        $raw=strtoupper(bin2hex(random_bytes(10)));
        query('DELETE FROM profile_tokens WHERE expires<=?',[time()]);
        query('INSERT INTO profile_tokens VALUES(?,?,?,?)',[hash('sha256',$raw),$pid,time()+600,'pair']);return ['code'=>$raw];
    }
    if($action==='stats')return stats($pid);
    if($action==='leaderboard') {
        $id=recordId($b);
        return ['ranking'=>query("WITH ranked AS (SELECT p.nickname,p.avatar,s.score,s.active_seconds,s.finished,s.id,
            json_array_length(v.pairs_json) total,ROW_NUMBER() OVER(PARTITION BY p.id ORDER BY s.score DESC,s.active_seconds,s.finished,s.id) choice
            FROM sessions s JOIN profiles p ON p.id=s.profile_id JOIN quiz_versions v ON v.id=s.version_id JOIN quizzes q ON q.id=v.quiz_id
            WHERE q.id=? AND q.archived_at IS NULL AND v.version=(SELECT MAX(version) FROM quiz_versions WHERE quiz_id=q.id)
            AND p.consent=1 AND s.mode='test' AND s.status='finished' AND s.paused=0)
            SELECT nickname,avatar,score,active_seconds,total FROM ranked WHERE choice=1 ORDER BY score DESC,active_seconds,finished,id LIMIT 100",[$id])->fetchAll()];
    }
    if($action==='attempt.list')return ['attempts'=>query("SELECT s.id,s.mode,s.status,s.started,q.title FROM sessions s JOIN quiz_versions v ON v.id=s.version_id JOIN quizzes q ON q.id=v.quiz_id WHERE profile_id=? AND status!='finished' ORDER BY started DESC LIMIT 20",[$pid])->fetchAll()];
    if($action==='attempt.start') {
        if(!rateAllowed('attempt-start',120,3600))invalid('Limit nowych sesji.');
        $quiz=recordId($b);$mode=$b['mode']??'';if(!in_array($mode,['test','learn'],true))invalid('Niepoprawny tryb.');
        $key=textField($b,'request_key',16,100);
        return atomic(function()use($pid,$quiz,$mode,$key){
            $old=query('SELECT * FROM sessions WHERE profile_id=? AND request_key=?',[$pid,$key])->fetch();
            if($old)return ['attempt'=>attemptView($old)];
            $v=query('SELECT v.* FROM quiz_versions v JOIN quizzes q ON q.id=v.quiz_id WHERE q.id=? AND q.archived_at IS NULL ORDER BY v.version DESC LIMIT 1',[$quiz])->fetch();
            if(!$v)invalid('Brak zestawu.');
            $id=bin2hex(random_bytes(16));query('INSERT INTO sessions(id,profile_id,version_id,mode,request_key,started,last_seen) VALUES(?,?,?,?,?,?,?)',[$id,$pid,$v['id'],$mode,$key,time(),time()]);
            return ['attempt'=>attemptView(ownedAttempt($id,$pid))];
        });
    }
    if($action==='attempt.answer' && !rateAllowed('learning-answer',300,60))invalid('Za dużo odpowiedzi. Spróbuj za minutę.');
    if(str_starts_with($action,'attempt.'))return atomic(function()use($action,$b,$pid){
        $current=requireProfile();if($current['id']!==$pid)invalid('Sesja wygasła.');
        $s=ownedAttempt(textField($b,'attempt_id',32,32),$pid);
        if($action==='attempt.answer') {if($s['mode']!=='learn')invalid('To nie sesja nauki.');return learningAnswer($s,$b);}
        if($action==='attempt.get') {
            if($s['mode']==='test' && $s['status']!=='finished'){$s=tick($s,time());$s['paused']=1;$s['status']='paused';$s['revision']++;persistAttempt($s);}
            return ['attempt'=>attemptView($s)];
        }
        if($s['mode']!=='test')invalid('To nie test.');
        $s=advanceTest($s,substr($action,strlen('attempt.')),$b,attemptView($s)['pairs'],time());
        persistAttempt($s);return ['attempt'=>attemptView($s)];
    });
    invalid('Nieznana operacja.');
}
function stats(int $pid): array {
    return [
        'best'=>query("WITH r AS (SELECT v.quiz_id,s.score,json_array_length(v.pairs_json) total,s.active_seconds,ROW_NUMBER() OVER(PARTITION BY v.quiz_id ORDER BY 1.0*s.score/json_array_length(v.pairs_json) DESC,s.active_seconds,s.finished) choice FROM sessions s JOIN quiz_versions v ON v.id=s.version_id WHERE s.profile_id=? AND s.mode='test' AND s.status='finished') SELECT quiz_id,score,total,active_seconds FROM r WHERE choice=1",[$pid])->fetchAll(),
        'events'=>query('SELECT e.pair_id,e.correct,e.first_try,e.created,v.pairs_json,q.title FROM learning_events e JOIN sessions s ON s.id=e.session_id JOIN quiz_versions v ON v.id=s.version_id JOIN quizzes q ON q.id=v.quiz_id WHERE s.profile_id=? ORDER BY e.id DESC LIMIT 100',[$pid])->fetchAll(),
        'progress'=>query('SELECT g.*,q.title,v.quiz_id FROM progress g JOIN quiz_versions v ON EXISTS(SELECT 1 FROM json_each(v.pairs_json) j WHERE json_extract(j.value,\'$.id\')=g.pair_id) JOIN quizzes q ON q.id=v.quiz_id WHERE g.profile_id=? AND q.archived_at IS NULL AND v.version=(SELECT MAX(version) FROM quiz_versions WHERE quiz_id=q.id)',[$pid])->fetchAll(),
        'history'=>query("SELECT s.id,s.mode,s.status,s.started,s.finished,s.score,s.active_seconds,s.paused,v.version,v.quiz_id,q.title,json_array_length(v.pairs_json) total FROM sessions s JOIN quiz_versions v ON v.id=s.version_id JOIN quizzes q ON q.id=v.quiz_id WHERE s.profile_id=? ORDER BY s.started DESC,s.id LIMIT 100",[$pid])->fetchAll(),
        'summary'=>query("SELECT COUNT(*) sessions,SUM(mode='learn') learning_sessions,SUM(mode='test' AND status='finished') tests,AVG(CASE WHEN mode='test' AND status='finished' THEN 100.0*score/json_array_length(v.pairs_json) END) average FROM sessions s JOIN quiz_versions v ON v.id=s.version_id WHERE profile_id=?",[$pid])->fetch()
    ];
}
