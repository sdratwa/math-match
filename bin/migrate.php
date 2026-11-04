<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
define('MATH_MATCH_MIGRATING', true);
require dirname(__DIR__).'/src/lib.php';
require dirname(__DIR__).'/src/migrations.php';
try { migrateDatabase(database()); echo "Schemat 1; integralność OK.\n"; }
catch (Throwable $e) { fwrite(STDERR,"Migracja przerwana; zmiany wycofane. Sprawdź bazę i wersję kodu.\n"); exit(1); }
