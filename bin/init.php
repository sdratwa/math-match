<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
define('MATH_MATCH_INITIALIZING', true);
require dirname(__DIR__).'/src/lib.php';
require dirname(__DIR__).'/src/schema.php';
try {
    if (!extension_loaded('intl') || !extension_loaded('mbstring')) throw new RuntimeException('Wymagane intl i mbstring.');
    // Wyłączne utworzenie zapobiega nadpisaniu pliku, również przy dwóch procesach CLI.
    $path=dataDirectory().'/math_match.sqlite';
    $file=@fopen($path, 'x');
    if (!$file) throw new RuntimeException('Plik bazy już istnieje lub katalog nie jest zapisywalny.');
    fclose($file); chmod($path, 0600);
    initializeDatabase(database());
    echo "Pusta baza gotowa; schemat 2; integralność OK.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Inicjalizacja odmówiona lub przerwana. Sprawdź pusty katalog, rozszerzenia PHP i uprawnienia. Istniejącej bazy nie nadpisano.\n");
    exit(1);
}
