<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Tylko terminal.\n");
}
require dirname(__DIR__) . '/src/lib.php';

if (($argv[1] ?? 'set-password') !== 'set-password') {
    fwrite(STDERR, "Użycie: php bin/admin.php set-password\n");
    exit(1);
}
// Never accept an admin password in CLI arguments (which can be visible in process lists/history).
function secretPrompt(string $prompt): string
{
    fwrite(STDOUT, $prompt);
    $tty = function_exists('shell_exec') && DIRECTORY_SEPARATOR !== '\\' && stream_isatty(STDIN);
    if ($tty) {
        shell_exec('stty -echo');
    }
    try {
        $value = trim((string)fgets(STDIN));
    } finally {
        if ($tty) {
            shell_exec('stty echo');
            fwrite(STDOUT, "\n");
        }
    }
    return $value;
}
try {
    $password = secretPrompt('Nowe hasło admina (12–72 bajty): ');
    $repeat = secretPrompt('Powtórz hasło: ');
    if (strlen($password) < 12 || strlen($password) > 72 || $password !== $repeat) {
        throw new RuntimeException('Hasło musi mieć 12–72 bajty; oba wpisy muszą być identyczne.');
    }
    writeSetting('admin_hash', password_hash($password, PASSWORD_DEFAULT));
    fwrite(STDOUT, "Hasło administratora zapisane. Wcześniejsze sesje administratora utraciły uprawnienia.\n");
} catch (Throwable $e) {
    fwrite(STDERR, "Błąd: " . $e->getMessage() . "\n");
    exit(1);
}
