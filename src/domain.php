<?php
declare(strict_types=1);
require_once __DIR__.'/accounts.php';

function query(string $sql, array $args = []): PDOStatement {
    $s=database()->prepare($sql); $s->execute($args); return $s;
}
function atomic(callable $fn): mixed {
    $db=database(); $db->exec('BEGIN IMMEDIATE');
    try { $result=$fn(); $db->commit(); return $result; }
    catch(Throwable $e) { $db->rollBack(); throw $e; }
}
function invalid(string $message): never { throw new InvalidArgumentException($message); }
function textField(array $b,string $key,int $min,int $max): string {
    $v=$b[$key]??null;
    if (!is_string($v)||!preg_match('//u',$v)||stringLength(trim($v))<$min||stringLength(trim($v))>$max) invalid('Niepoprawne pole: '.$key);
    return trim($v);
}
function avatarField(array $b): string {
    $a=$b['avatar']??'';
    if(!in_array($a,['🦄','🦊','🐼','🐸','🦁','🐱','🚀','⭐'],true)) invalid('Wybierz avatar.');
    return $a;
}
function boolField(array $b,string $key): int {
    if(!is_bool($b[$key]??null)) invalid('Niepoprawne pole: '.$key);
    return $b[$key]?1:0;
}
function publicProfile(array $p): array {
    return array_intersect_key($p,array_flip(['id','nickname','display_name','avatar','consent','sound','created_at','last_active']));
}
function profile(): ?array {
    if (($_SESSION['profile_installation']??null)!==readSetting('installation_id')) return null;
    $id=$_SESSION['profile_id']??0;
    $p=query('SELECT * FROM profiles WHERE id=?',[$id])->fetch();
    if(($_SESSION['profile_expires']??0)<time()) return null;
    if(!$p || $p['auth_version']!==($_SESSION['profile_version']??null)) return null;
    return $p;
}
function requireProfile(): array { return profile() ?? invalid('Zaloguj się do profilu.'); }
function signIn(array $p): void {
    unset($_SESSION['guest_mode'], $_SESSION['guest_test']);
    if(session_status()===PHP_SESSION_ACTIVE) session_regenerate_id(true);
    $_SESSION['profile_installation']=readSetting('installation_id');
    $_SESSION['profile_expires']=time()+12*3600;
    $_SESSION['profile_id']=$p['id']; $_SESSION['profile_version']=$p['auth_version'];
    query('UPDATE profiles SET last_active=? WHERE id=?',[time(),$p['id']]);
}
function tokenCookie(string $token,int $expires): void {
    setcookie('mathmatch_account_device',$token,['expires'=>$expires,'path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
}
/** Opcjonalne zapamiętanie bieżącego uwierzytelnienia, wyłącznie przez cookie HttpOnly. */
function rememberProfile(int $id): void {
    $raw=bin2hex(random_bytes(32));$expires=time()+30*86400;
    query('DELETE FROM profile_tokens WHERE expires<=?',[time()]);
    query('INSERT INTO profile_tokens VALUES(?,?,?,?)',[hash('sha256',$raw),$id,$expires,'device']);
    tokenCookie($raw,$expires);
}
function restoreProfile(): void {
    if(profile() || !is_string($_COOKIE['mathmatch_account_device']??null))return;
    if(empty($_SERVER['HTTPS'])||$_SERVER['HTTPS']==='off')return;
    $hash=hash('sha256',$_COOKIE['mathmatch_account_device']);
    atomic(function()use($hash){
        $t=query("SELECT * FROM profile_tokens WHERE hash=? AND kind='device' AND expires>?",[$hash,time()])->fetch();
        if(!$t)return;
        $p=query('SELECT * FROM profiles WHERE id=?',[$t['profile_id']])->fetch();
        if(!$p)return;
        query('DELETE FROM profile_tokens WHERE hash=?',[$hash]);
        rememberProfile($p['id']);signIn($p);
    });
}
function revokeProfile(int $id): void {
    query('UPDATE profiles SET auth_version=auth_version+1 WHERE id=?',[$id]);
    query('DELETE FROM profile_tokens WHERE profile_id=?',[$id]);
}
function throttle(string $key,int $max,int $period): void {
    // Wspólny licznik konta nie zależy od IP ani sesji.
    $allowed=atomic(function()use($key,$max,$period){
        $key=hash('sha256',$key); $now=time();
        $r=query('SELECT * FROM rate_limits WHERE key=?',[$key])->fetch();
        if($r && $now-$r['started_at']<$period && $r['attempts'] >= $max)return false;
        query('INSERT INTO rate_limits VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN started_at<=? THEN 1 ELSE attempts+1 END, started_at=CASE WHEN started_at<=? THEN excluded.started_at ELSE started_at END',[$key,$now,$now-$period,$now-$period]); return true;
    });
    if(!$allowed)invalid('Za dużo prób. Spróbuj później.');
}
function saveQuiz(array $b,?int $id=null): int {
    $v=validatedQuiz($b);
    return atomic(function()use($b,$v,$id){
        $old=$id?query('SELECT * FROM quizzes WHERE id=? AND archived_at IS NULL',[$id])->fetch():null;
        if($id && !$old)invalid('Brak zestawu.');
        if($old && ($b['revision']??null)!==$old['revision'])invalid('Zestaw zmieniono. Odśwież Quizy.');
        $prior=$old?json_decode($old['pairs_json'],true):[]; $pairs=[];
        foreach($v['pairs'] as $p){
            $same=array_values(array_filter($prior,fn($o)=>$o['term']===$p['term']&&$o['description']===$p['description']));
            $p['id']=$same[0]['id']??bin2hex(random_bytes(16)); $pairs[]=$p;
        }
        $json=json_encode($pairs,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
        if(!$id){query('INSERT INTO quizzes(title,pairs_json) VALUES(?,?)',[$v['title'],$json]);$id=(int)database()->lastInsertId();}
        else query("UPDATE quizzes SET title=?,pairs_json=?,revision=revision+1,updated_at=datetime('now') WHERE id=?",[$v['title'],$json,$id]);
        $a=array_column($prior,'id');$c=array_column($pairs,'id');sort($a);sort($c);
        if($a!==$c)query('INSERT INTO quiz_versions(quiz_id,version,pairs_json) SELECT ?,COALESCE(MAX(version),0)+1,? FROM quiz_versions WHERE quiz_id=?',[$id,$json,$id]);
        return $id;
    });
}
function attemptView(array $s): array {
    $v=query('SELECT v.*,q.title FROM quiz_versions v JOIN quizzes q ON q.id=v.quiz_id WHERE v.id=?',[$s['version_id']])->fetch();
    $s['pairs']=json_decode($v['pairs_json'],true);$s['title']=$v['title'];$s['quiz_id']=$v['quiz_id'];$s['answers']=json_decode($s['answers'],true);$s['server_now']=time();
    $s['matched']=array_column(query('SELECT DISTINCT pair_id FROM learning_events WHERE session_id=? AND correct=1',[$s['id']])->fetchAll(),'pair_id');
    return $s;
}
function ownedAttempt(string $id,int $pid): array {
    return query('SELECT * FROM sessions WHERE id=? AND profile_id=?',[$id,$pid])->fetch() ?: invalid('Nie znaleziono próby.');
}
function tick(array $s,int $now): array {
    if($s['mode']==='test' && $s['status']==='active') {
        $gap=max(0,$now-$s['last_seen']);
        if($gap>45){$s['status']='paused';$s['paused']=1; $gap=0;}
        $s['active_seconds']+=$gap; $s['last_seen']=$now;
    }
    return $s;
}
function persistAttempt(array $s): void {
    query('UPDATE sessions SET status=?,last_seen=?,active_seconds=?,paused=?,revision=?,answers=?,finished=?,score=? WHERE id=?',
        [$s['status'],$s['last_seen'],$s['active_seconds'],$s['paused'],$s['revision'],$s['answers'],$s['finished'],$s['score'],$s['id']]);
}
function answerMap(mixed $answers,array $pairs,bool $complete): array {
    if(!is_array($answers))invalid('Niepoprawne odpowiedzi.');
    $ids=array_column($pairs,'id');$used=[];
    foreach($answers as $term=>$def){if(!in_array($term,$ids,true)||!is_string($def)||!in_array($def,$ids,true)||isset($used[$def]))invalid('Niepoprawne lub powielone przypisanie.');$used[$def]=true;}
    if($complete && count($answers)!==count($ids))invalid('Połącz wszystkie pary.');return $answers;
}
function learningAnswer(array $s,array $b): array {
    $key=textField($b,'event_key',16,100);
    $old=query('SELECT * FROM learning_events WHERE session_id=? AND event_key=?',[$s['id'],$key])->fetch();
    if($old){if(($b['term']??null)!==$old['pair_id']||($b['definition']??null)!==$old['definition_id'])invalid('Klucz odpowiedzi został już użyty.');return ['correct'=>(bool)$old['correct']];}
    if($s['status']!=='active')invalid('Sesja jest zakończona.');
    $pairs=attemptView($s)['pairs'];$term=textField($b,'term',32,32);$def=textField($b,'definition',32,32);
    answerMap([$term=>$def],$pairs,false);
    if(query('SELECT 1 FROM learning_events WHERE session_id=? AND pair_id=? AND correct=1',[$s['id'],$term])->fetch())invalid('Para już dopasowana.');
    $first=!query('SELECT 1 FROM learning_events WHERE session_id=? AND pair_id=?',[$s['id'],$term])->fetch();$ok=$term===$def;$now=time();
    query('INSERT INTO learning_events(session_id,event_key,pair_id,definition_id,correct,first_try,created) VALUES(?,?,?,?,?,?,?)',[$s['id'],$key,$term,$def,(int)$ok,(int)$first,$now]);
    query("INSERT OR IGNORE INTO progress(profile_id,pair_id,last_seen) VALUES(?,?,?)",[$s['profile_id'],$term,$now]);
    $p=query('SELECT * FROM progress WHERE profile_id=? AND pair_id=?',[$s['profile_id'],$term])->fetch();
    if($first){$p['contacts']++;if($ok)$p['successes']++;elseif($p['status']==='mastered'){$p['successes']=0;$p['status']='review';}}
    if($ok)$p['correct']++;else $p['errors']++;
    if($p['successes']>=2){$p['status']='mastered';$p['mastered_before']=1;}elseif($p['status']==='new')$p['status']='learning';
    query('UPDATE progress SET contacts=?,correct=?,errors=?,successes=?,mastered_before=?,status=?,last_seen=? WHERE profile_id=? AND pair_id=?',[$p['contacts'],$p['correct'],$p['errors'],$p['successes'],$p['mastered_before'],$p['status'],$now,$s['profile_id'],$term]);
    if(count(attemptView($s)['matched'])===count($pairs))query("UPDATE sessions SET status='finished',finished=? WHERE id=?",[$now,$s['id']]);
    return ['correct'=>$ok];
}

/** Wspólna ocena bez efektów ubocznych: nie zapisuje historii ani rankingu. */
function gradeTest(mixed $submitted, array $pairs): array
{
    $answers = answerMap($submitted, $pairs, true);
    return [
        'answers' => $answers,
        'score' => count(array_filter($answers, static fn($definition, $term) => $term === $definition, ARRAY_FILTER_USE_BOTH)),
    ];
}

/** Przejście stanu testu; wybór miejsca zapisu należy do wywołującego. */
function advanceTest(array $s, string $operation, array $body, array $pairs, int $now): array
{
    if (!in_array($operation, ['save', 'finish', 'pause', 'resume', 'heartbeat'], true)) invalid('Nieznana operacja testu.');
    if ($s['status'] === 'finished') return $s;
    if (($body['revision'] ?? null) !== $s['revision']) invalid('Próbę zmieniono. Wznów ją przed kolejną zmianą.');
    $s = tick($s, $now);
    if ($operation === 'resume') {
        $s['status'] = 'active';
        $s['paused'] = 1;
        $s['last_seen'] = $now;
    } elseif ($operation === 'pause') {
        $s['status'] = 'paused';
        $s['paused'] = 1;
    } elseif ($operation === 'save' || $operation === 'finish') {
        if ($s['status'] !== 'active') return $s;
        if ($operation === 'finish') {
            $graded = gradeTest($body['answers'] ?? null, $pairs);
            $answers = $graded['answers'];
            $s['score'] = $graded['score'];
            $s['finished'] = $now;
            $s['status'] = 'finished';
        } else {
            $answers = answerMap($body['answers'] ?? null, $pairs, false);
        }
        $s['answers'] = json_encode((object)$answers, JSON_THROW_ON_ERROR);
    }
    $s['revision']++;
    return $s;
}
