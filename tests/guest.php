<?php
declare(strict_types=1);
// Test logiki bez interfejsu, z deterministycznym zegarem i własną bazą.
if (!getenv('MATH_MATCH_STORAGE')) exit(1);
require dirname(__DIR__).'/src/lib.php';
require dirname(__DIR__).'/src/domain.php';
require dirname(__DIR__).'/src/guest-api.php';
function check(bool $v, string $message): void { if (!$v) throw new RuntimeException($message); }
function rejected(callable $fn): void {
    try { $fn(); } catch (InvalidArgumentException $e) { return; }
    throw new RuntimeException('Oczekiwano odrzucenia żądania.');
}
$pairs=[['id'=>str_repeat('a',32)], ['id'=>str_repeat('b',32)]];
$a=$pairs[0]['id']; $b=$pairs[1]['id'];
$s=['mode'=>'test','status'=>'active','revision'=>0,'last_seen'=>100,'active_seconds'=>0,'paused'=>0,'answers'=>'{}','finished'=>null,'score'=>null];
$s=advanceTest($s,'save',['revision'=>0,'answers'=>[$a=>$b]],$pairs,110);
check($s['active_seconds']===10 && $s['score']===null,'Zapis bez oceny.');
$s=advanceTest($s,'pause',['revision'=>1],$pairs,120);
check($s['active_seconds']===20 && $s['status']==='paused','Pauza z czasem serwera.');
$s=advanceTest($s,'heartbeat',['revision'=>2],$pairs,300);
check($s['active_seconds']===20,'Czas pauzy nie jest naliczany.');
$s=advanceTest($s,'resume',['revision'=>3],$pairs,400);
$s=advanceTest($s,'save',['revision'=>4,'answers'=>[]],$pairs,405);
check(json_decode($s['answers'],true)===[],'Rozłączenie odpowiedzi.');
rejected(fn()=>advanceTest($s,'finish',['revision'=>5,'answers'=>[$a=>$a]],$pairs,410));
rejected(fn()=>advanceTest($s,'finish',['revision'=>5,'answers'=>[$a=>$a,$b=>$a]],$pairs,410));
rejected(fn()=>advanceTest($s,'finish',['revision'=>5,'answers'=>[$a=>'unknown',$b=>$b]],$pairs,410));
$s=advanceTest($s,'finish',['revision'=>5,'answers'=>[$a=>$a,$b=>$b],'score'=>0,'active_seconds'=>1],$pairs,410);
check($s['score']===2 && $s['active_seconds']===30,'Serwer ocenia i liczy czas niezależnie od klienta.');
$again=advanceTest($s,'finish',['revision'=>0,'answers'=>[$a=>$b,$b=>$a]],$pairs,900);
check($again===$s,'Zakończenie idempotentne.');
check(gradeTest([$a=>$b,$b=>$a],$pairs)['score']===0,'Błędne kompletne połączenia.');
$s['status']='active';$s['last_seen']=100;$s['active_seconds']=0;
$s=advanceTest($s,'heartbeat',['revision'=>$s['revision']],$pairs,200);
check($s['status']==='paused' && $s['active_seconds']===0,'Uśpienie strony bez pagehide.');
$_SESSION=['guest_test'=>['expires'=>100]];expireGuestTest(100);
check(!isset($_SESSION['guest_test']),'Wygasły stan jest usuwany.');
$_SESSION=['guest_mode'=>true,'guest_test'=>['expires'=>200]];
// signIn działa na istniejącym profilu, nigdy nie importuje wyniku gościa.
query('INSERT INTO profiles(nickname,nickname_key,display_name,avatar,password_hash,created_at,last_active) VALUES(?,?,?,?,?,?,?)',
    ['Test','test','Test','🦊',hashAccountPassword('syntetyczne hasło'),1,1]);
$p=query('SELECT * FROM profiles')->fetch();signIn($p);
check(!isset($_SESSION['guest_mode'])&&!isset($_SESSION['guest_test']),'Logowanie usuwa stan gościa.');
check((int)query('SELECT COUNT(*) FROM sessions')->fetchColumn()===0,'Brak historii.');
echo "OK: wspólna ocena, timer, pauza, wznowienie, wygaśnięcie, izolacja\n";
