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
            if(is_string($_COOKIE['mathmatch_account_device']??null))query("DELETE FROM profile_tokens WHERE hash=? AND kind='device'",[hash('sha256',$_COOKIE['mathmatch_account_device'])]);
        });
        unset($_SESSION['profile_id'],$_SESSION['profile_version'],$_SESSION['profile_expires'],$_SESSION['profile_installation']);
        tokenCookie('',time()-3600);return [];
    }
    if(in_array($action,['profile.register','profile.login','profile.recover'],true)) return accountAuthentication($action,$b);
    if(str_starts_with($action,'admin.')) {
        if(!isAdmin())invalid('Wymagana autoryzacja administratora.');
        if($action==='admin.list') {
            $search=textField(['search'=>$b['search']??''],'search',0,40);$offset=max(0,min(100000,(int)($b['offset']??0)));
            $sort=($b['sort']??'activity')==='name'?'p.nickname,p.id':'p.last_active DESC,p.id';
            return ['profiles'=>query("SELECT p.id,p.nickname,p.display_name,p.avatar,p.consent,p.created_at,p.last_active,
                (SELECT COUNT(*) FROM sessions s WHERE s.profile_id=p.id AND s.mode='test' AND s.status='finished') tests,
                (SELECT COUNT(*) FROM progress g WHERE g.profile_id=p.id AND g.status='mastered') mastered,
                (SELECT AVG(100.0*s.score/json_array_length(v.pairs_json)) FROM sessions s JOIN quiz_versions v ON v.id=s.version_id WHERE s.profile_id=p.id AND s.mode='test' AND s.status='finished') average
                FROM profiles p WHERE p.nickname LIKE ? OR p.display_name LIKE ? ORDER BY $sort LIMIT 50 OFFSET ?",['%'.$search.'%','%'.$search.'%',$offset])->fetchAll()];
        }
        $id=recordId($b);
        if($action==='admin.stats')return stats($id);
        return atomic(function()use($action,$b,$id){
            if(!query('SELECT 1 FROM profiles WHERE id=?',[$id])->fetch())invalid('Brak profilu.');
            if($action==='admin.delete') {if(($b['confirm']??false)!==true)invalid('Potwierdź usunięcie.');query('DELETE FROM profiles WHERE id=?',[$id]);}
            elseif($action==='admin.revoke')revokeProfile($id);
            elseif($action==='admin.recovery') {
                authTransport(); revokeProfile($id);$raw=bin2hex(random_bytes(32));
                query('INSERT INTO profile_tokens VALUES(?,?,?,?)',[hash('sha256',$raw),$id,time()+600,'recovery']);
                return ['secret'=>$raw,'expires_in'=>600];
            }
            elseif($action==='admin.update')saveAccount($b,$id);
            else invalid('Nieznana operacja.');
            return [];
        });
    }
    $p=requireProfile();$pid=$p['id'];
    if(isset($b['expected_profile_id']) && $b['expected_profile_id']!==$pid)invalid('Gracz zmienił się w innej karcie. Odśwież stronę.');
    if($p['last_active']<time()-60)query('UPDATE profiles SET last_active=? WHERE id=?',[time(),$pid]);
    if($action==='profile.preferences') {query('UPDATE profiles SET sound=? WHERE id=?',[boolField($b,'sound'),$pid]);return [];}
    if($action==='profile.update') {
        throttle('settings:'.$pid,8,900);
        return atomic(function()use($b,$pid){
            $p=requireProfile();if($p['id']!==$pid)invalid('Sesja wygasła.');
            $new=$b['password']??'';
            if(loginName($b['nickname']??null)!==$p['nickname'] || $new!=='') {
                if(!is_string($b['current_password']??null)||!verifyAccountPassword($b['current_password'],$p['password_hash']))invalid('Sprawdź aktualne hasło.');
            }
            saveAccount($b,$pid);
            if(isset($b['sound']))query('UPDATE profiles SET sound=? WHERE id=?',[boolField($b,'sound'),$pid]);
            if($new!=='') {
                $new=accountPassword($b);if(($b['password_repeat']??null)!==$new)invalid('Hasła muszą być identyczne.');
                query('UPDATE profiles SET password_hash=? WHERE id=?',[hashAccountPassword($new),$pid]);revokeProfile($pid);
                signIn(query('SELECT * FROM profiles WHERE id=?',[$pid])->fetch());
            }
            return [];
        });
    }
    if($action==='profile.revoke') {atomic(fn()=>revokeProfile($pid));unset($_SESSION['profile_id'],$_SESSION['profile_version']);tokenCookie('',time()-3600);return [];}
    if($action==='stats')return stats($pid);
    if($action==='leaderboard') {
        $id=recordId($b);
        return ['ranking'=>query("WITH ranked AS (SELECT p.display_name AS nickname,p.avatar,s.score,s.active_seconds,s.finished,s.id,
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
