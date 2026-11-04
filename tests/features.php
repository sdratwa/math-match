<?php
declare(strict_types=1);
if(!getenv('MATH_MATCH_STORAGE'))exit(1);
define('MATH_MATCH_MIGRATING',true);
require dirname(__DIR__).'/src/lib.php';
require dirname(__DIR__).'/src/migrations.php';
require dirname(__DIR__).'/src/domain.php';
require dirname(__DIR__).'/src/profile-api.php';
function recordId(array $b):int {return (int)$b['id'];}
function check(bool $v,string $m):void {if(!$v)throw new RuntimeException($m);}
function rejects(callable $f,string $m):void {try{$f();}catch(InvalidArgumentException $e){return;}throw new RuntimeException($m);}
$db=database();
$db->exec("CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);CREATE TABLE quizzes(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,pairs_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT 'old',updated_at TEXT NOT NULL DEFAULT 'old');CREATE TABLE rate_limits(key TEXT PRIMARY KEY,started_at INTEGER NOT NULL,attempts INTEGER NOT NULL)");
$original=[['term'=>'Alpha','description'=>'First'],['term'=>'Beta','description'=>'Second']];
query('INSERT INTO quizzes(title,pairs_json) VALUES(?,?)',['Synthetic',json_encode($original)]);
query('INSERT INTO settings VALUES(?,?)',['admin_hash','synthetic-marker']);
// Niepowodzenie po DDL musi wycofać całą migrację.
query('INSERT INTO quizzes(title,pairs_json) VALUES(?,?)',['Broken','{']);
try{migrateDatabase($db);throw new RuntimeException('Powinna nie przejść');}catch(JsonException $e){}
check((int)$db->query('PRAGMA user_version')->fetchColumn()===0,'Rollback wersji');
check(!query("SELECT 1 FROM sqlite_master WHERE name='profiles'")->fetch(),'Rollback tabel');
query('DELETE FROM quizzes WHERE title=?',['Broken']);migrateDatabase($db);migrateDatabase($db);
check(readSetting('admin_hash')==='synthetic-marker','Zachowanie ustawień');
$q=fetchQuizzes()[0];check(count($q['pairs'])===2,'Zachowanie par');
foreach($original as $i=>$p)check($q['pairs'][$i]['term']===$p['term']&&$q['pairs'][$i]['description']===$p['description'],'Treść bez zmian');
$id=$q['id'];$a=$q['pairs'][0]['id'];$b=$q['pairs'][1]['id'];
saveQuiz(['title'=>'Renamed','pairs'=>array_reverse($original),'revision'=>1],$id);
check((int)query('SELECT COUNT(*) FROM quiz_versions')->fetchColumn()===1,'Nazwa i kolejność bez nowej wersji');
$_SESSION=[];$_SERVER['REMOTE_ADDR']='127.0.0.1';
$register=['nickname'=>'Jacek','avatar'=>'🦊','pin'=>'123456','pin_repeat'=>'123456','consent'=>true];
$p1=profileApi('profile.register',$register)['profile'];$p2=profileApi('profile.register',$register)['profile'];
check($p1['code']!==$p2['code'],'Unikalne kody przy tej samej ksywce');
rejects(fn()=>profileApi('profile.login',['code'=>$p1['code'],'pin'=>'999999']),'Błędny PIN');
profileApi('profile.login',['code'=>$p1['code'],'pin'=>'123456']);
function start(string $mode):array {global $id;return profileApi('attempt.start',['id'=>$id,'mode'=>$mode,'request_key'=>bin2hex(random_bytes(16))])['attempt'];}
function answer(array $s,string $a,string $b,?string $key=null):array {return profileApi('attempt.answer',['attempt_id'=>$s['id'],'term'=>$a,'definition'=>$b,'event_key'=>$key??bin2hex(random_bytes(16))]);}
$s=start('learn');$key=bin2hex(random_bytes(16));answer($s,$a,$a,$key);answer($s,$a,$a,$key);
check((int)query('SELECT correct FROM progress WHERE profile_id=? AND pair_id=?',[$p1['id'],$a])->fetchColumn()===1,'Idempotencja odpowiedzi');
answer(start('learn'),$a,$a);
check(query('SELECT status FROM progress WHERE profile_id=? AND pair_id=?',[$p1['id'],$a])->fetchColumn()==='mastered','Dwie sesje opanowania');
$s=start('learn');answer($s,$a,$b);answer($s,$a,$a);
check(query('SELECT status FROM progress WHERE profile_id=? AND pair_id=?',[$p1['id'],$a])->fetchColumn()==='review','Do powtórki');
answer(start('learn'),$a,$a);answer(start('learn'),$a,$a);
check(query('SELECT status FROM progress WHERE profile_id=? AND pair_id=?',[$p1['id'],$a])->fetchColumn()==='mastered','Ponowne opanowanie');
$s=start('test');
function command(array $s,string $op,array $extra=[]):array{return profileApi('attempt.'.$op,['attempt_id'=>$s['id'],'revision'=>$s['revision']]+$extra)['attempt'];}
rejects(fn()=>command($s,'finish',['answers'=>[$a=>$a]]),'Niepełny test');
rejects(fn()=>command($s,'finish',['answers'=>[$a=>$a,$b=>$a]]),'Powielone definicje');
$saved=command($s,'save',['answers'=>[$a=>$b]]);
rejects(fn()=>command($s,'save',['answers'=>[]]),'Konflikt urządzeń');
$s=command($saved,'finish',['answers'=>[$a=>$a,$b=>$b]]);
check($s['score']===2,'Ocena serwerowa');
check(command($s,'finish',['answers'=>[$a=>$b,$b=>$a]])['score']===2,'Idempotentny wynik');
check(count(profileApi('leaderboard',['id'=>$id])['ranking'])===1,'Ranking');
check(count(profileApi('stats',[])['progress'])>0,'Statystyki zapisanych postępów');
// Ranking: wynik ważniejszy od czasu, jeden najlepszy wynik na profil.
query('UPDATE sessions SET active_seconds=20 WHERE id=?',[$s['id']]);
profileApi('profile.login',['code'=>$p2['code'],'pin'=>'123456']);
$rankTest=start('test');$rankTest=command($rankTest,'finish',['answers'=>[$a=>$b,$b=>$a]]);
query('UPDATE sessions SET active_seconds=1 WHERE id=?',[$rankTest['id']]);
$r=profileApi('leaderboard',['id'=>$id])['ranking'];check(count($r)===2&&$r[0]['score']===2,'Wynik ważniejszy od czasu');
$rankTest=start('test');$rankTest=command($rankTest,'finish',['answers'=>[$a=>$a,$b=>$b]]);
query('UPDATE sessions SET active_seconds=10 WHERE id=?',[$rankTest['id']]);
$r=profileApi('leaderboard',['id'=>$id])['ranking'];check(count($r)===2&&$r[0]['active_seconds']===10,'Najlepsza próba i czas');
profileApi('profile.update',['nickname'=>'Jacek','avatar'=>'🦊','consent'=>false]);
check(count(profileApi('leaderboard',['id'=>$id])['ranking'])===1,'Wycofana zgoda ukrywa stare wyniki');
profileApi('profile.update',['nickname'=>'Jacek','avatar'=>'🦊','consent'=>true]);
check(count(profileApi('leaderboard',['id'=>$id])['ranking'])===2,'Ponowna zgoda przywraca wyniki');
profileApi('profile.login',['code'=>$p1['code'],'pin'=>'123456']);
$t=start('test');$t=command($t,'pause');$t=command($t,'resume');$t=command($t,'finish',['answers'=>[$a=>$a,$b=>$b]]);check($t['paused']===1,'Pauza nieodwracalna');
query('UPDATE sessions SET active_seconds=0 WHERE id=?',[$t['id']]);
check(profileApi('leaderboard',['id'=>$id])['ranking'][0]['active_seconds']===10,'Zapauzowany szybszy test wykluczony');
$t=start('test');query('UPDATE sessions SET last_seen=? WHERE id=?',[time()-60,$t['id']]);$t=command($t,'heartbeat');check($t['status']==='paused'&&$t['paused']===1,'Brak pagehide');
$old=start('test');$changed=$original;$changed[0]['description']='Changed meaning';saveQuiz(['title'=>'Changed','pairs'=>$changed,'revision'=>2],$id);
check(command($old,'finish',['answers'=>[$a=>$a,$b=>$b]])['score']===2,'Snapshot starej wersji');
check(count(profileApi('leaderboard',['id'=>$id])['ranking'])===0,'Nowa wersja ma nowy ranking');
$token=profileApi('profile.pair',[])['code'];profileApi('profile.pair-use',['code'=>$token]);rejects(fn()=>profileApi('profile.pair-use',['code'=>$token]),'Jednorazowe parowanie');
profileApi('profile.login',['code'=>$p2['code'],'pin'=>'123456']);rejects(fn()=>profileApi('attempt.get',['attempt_id'=>$s['id']]),'Izolacja profili');
rejects(fn()=>profileApi('admin.list',[]),'Admin osobno');
// Token urządzenia: w bazie tylko hash, rotacja, wygaśnięcie i odwołanie.
$_SERVER['HTTPS']='on';
rememberProfile($p2['id']);
check((int)query("SELECT COUNT(*) FROM profile_tokens WHERE kind='device' AND profile_id=?",[$p2['id']])->fetchColumn()===1,'Token urządzenia');
$raw=bin2hex(random_bytes(32));query('INSERT INTO profile_tokens VALUES(?,?,?,?)',[hash('sha256',$raw),$p2['id'],time()+100,'device']);
$_COOKIE['mathmatch_device']=$raw;$_SESSION=[];restoreProfile();
check(profile()['id']===$p2['id'],'Odtworzenie urządzenia');
check(!query('SELECT 1 FROM profile_tokens WHERE hash=?',[hash('sha256',$raw)])->fetch(),'Rotacja tokenu');
profileApi('profile.logout',[]);check(profile()===null,'Wylogowanie');
$expired=strtoupper(bin2hex(random_bytes(10)));query('INSERT INTO profile_tokens VALUES(?,?,?,?)',[hash('sha256',$expired),$p2['id'],time()-1,'pair']);
rejects(fn()=>profileApi('profile.pair-use',['code'=>$expired]),'Wygasłe parowanie');
profileApi('profile.login',['code'=>$p1['code'],'pin'=>'123456']);
$_SESSION['math_match_admin']=true;$_SESSION['math_match_admin_version']=hash('sha256','synthetic-marker');
profileApi('admin.pin',['id'=>$p1['id'],'pin'=>'654321']);check(profile()===null,'Reset unieważnia sesję');
profileApi('profile.login',['code'=>$p1['code'],'pin'=>'654321']);
check(isAdmin(),'Logowanie profilu zachowuje administratora');
profileApi('admin.delete',['id'=>$p2['id'],'confirm'=>true]);
check(!query('SELECT 1 FROM profile_tokens WHERE profile_id=?',[$p2['id']])->fetch(),'Kaskada tokenów');
for($i=0;$i<8;$i++)throttle('synthetic-code-limit',8,900);
$_SESSION=[];$_SERVER['REMOTE_ADDR']='192.0.2.5';rejects(fn()=>throttle('synthetic-code-limit',8,900),'Limit kodu niezależny od IP i sesji');
check($db->query('PRAGMA integrity_check')->fetchColumn()==='ok','Integralność');check(!$db->query('PRAGMA foreign_key_check')->fetch(),'Relacje');
echo "OK: migracja, rollback, profile, nauka, testy, pauza, wersje, ranking, izolacja\n";
