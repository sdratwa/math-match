<?php
declare(strict_types=1);

// Uruchamiany przez run.py wyłącznie na osobnej bazie tymczasowej.
require dirname(__DIR__) . '/src/lib.php';
if (!getenv('MATH_MATCH_STORAGE')) {
    throw new RuntimeException('Test wymaga osobnego katalogu MATH_MATCH_STORAGE.');
}
function check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}
$_SESSION = [];
check(!isAdmin(), 'Gość nie jest administratorem.');
$_SESSION = ['math_match_admin' => true];
check(!isAdmin(), 'Sesja bez hasła w bazie musi być odrzucona.');
$hash = password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT);
writeSetting('admin_hash', $hash);
$quizzes = fetchQuizzes();
$_SESSION = ['math_match_admin' => true];
check(!isAdmin(), 'Stara sesja bez wersji musi być odrzucona.');
foreach ([null, [], 123, '', str_repeat('0', 64)] as $version) {
    $_SESSION = ['math_match_admin' => true, 'math_match_admin_version' => $version];
    check(!isAdmin(), 'Niepoprawna wersja musi być odrzucona.');
}
$valid = ['math_match_admin' => true, 'math_match_admin_version' => hash('sha256', $hash)];
$_SESSION = ['math_match_admin_version' => $valid['math_match_admin_version']];
check(!isAdmin(), 'Sama wersja bez zalogowania nie daje uprawnień.');
$_SESSION = $valid;
check(isAdmin(), 'Aktualna sesja musi działać.');
writeSetting('admin_hash', password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT));
check(!isAdmin(), 'Zmiana hasła unieważnia sesję.');
check(!isset($_SESSION['math_match_admin_version']) && !isset($_SESSION['math_match_admin']), 'Usuń uprawnienia sesji.');
// Logowanie rozpoczęte przed rotacją nie może otrzymać nowej wersji uprawnień.
$_SESSION = $valid;
check(!isAdmin(), 'Sesja utworzona ze starego hasha musi być odrzucona.');
check(fetchQuizzes() === $quizzes, 'Zmiana hasła nie zmienia quizów.');
echo "OK: testy funkcji autoryzacji\n";
