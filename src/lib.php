<?php
declare(strict_types=1);

/** Math Match: small PHP + SQLite service, no framework or Composer needed. */

function dataDirectory(): string
{
    $override = getenv('MATH_MATCH_STORAGE');
    return $override !== false && $override !== '' ? rtrim($override, '/') : dirname(__DIR__) . '/storage';
}

function database(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dir = dataDirectory();
    if (!is_dir($dir) || !is_writable($dir)) {
        throw new RuntimeException('Brak katalogu storage z prawem zapisu. Sprawdź README.');
    }
    if (!extension_loaded('pdo_sqlite')) {
        throw new RuntimeException('Brakuje rozszerzenia PHP pdo_sqlite (zainstaluj php8.4-sqlite3).');
    }
    $pdo = new PDO('sqlite:' . $dir . '/math_match.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec('PRAGMA busy_timeout = 5000');
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA foreign_keys = ON');
    if (!defined('MATH_MATCH_MIGRATING')) {
        $version = (int)$pdo->query('PRAGMA user_version')->fetchColumn();
        if ($version !== 1) throw new RuntimeException('Wymagana migracja CLI.');
    }
    return $pdo;
}

function readSetting(string $key): ?string
{
    $stmt = database()->prepare('SELECT value FROM settings WHERE key = ?');
    $stmt->execute([$key]);
    $v = $stmt->fetchColumn();
    return $v === false ? null : (string)$v;
}

function writeSetting(string $key, string $value): void
{
    database()->prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
        ->execute([$key, $value]);
}

function publicCreationEnabled(): bool
{
    return !in_array(strtolower((string)getenv('MATH_MATCH_ALLOW_PUBLIC_CREATION')), ['0', 'false', 'no'], true);
}

function isAdmin(): bool
{
    if (($_SESSION['math_match_admin'] ?? null) !== true) {
        return false;
    }
    // Wersję uprawnień wyznacza dokładnie ten hash hasła, który zweryfikowano
    // przy logowaniu. Zmiana hasła jest jednym atomowym zapisem w SQLite.
    $version = $_SESSION['math_match_admin_version'] ?? null;
    $hash = readSetting('admin_hash');
    if (!is_string($version) || $hash === null ||
        !hash_equals(hash('sha256', $hash), $version)) {
        unset($_SESSION['math_match_admin'], $_SESSION['math_match_admin_version']);
        return false;
    }
    return true;
}

function fetchQuizzes(): array
{
    $rows = database()->query('SELECT id, title, pairs_json, created_at, updated_at, revision FROM quizzes WHERE archived_at IS NULL ORDER BY id DESC')->fetchAll();
    return array_map(static fn (array $row): array => [
        'id' => (int)$row['id'],
        'title' => $row['title'],
        'pairs' => json_decode($row['pairs_json'], true, 32, JSON_THROW_ON_ERROR),
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
        'revision' => (int)$row['revision'],
    ], $rows);
}

function stringLength(string $text): int
{
    return preg_match_all('/./us', $text) ?: 0;
}

function validatedQuiz(mixed $body): array
{
    if (!is_array($body) || !is_string($body['title'] ?? null) || !is_array($body['pairs'] ?? null)) {
        throw new InvalidArgumentException('Podaj nazwę i listę par.');
    }
    $title = trim($body['title']);
    if (!preg_match('//u', $title) || stringLength($title) < 2 || stringLength($title) > 100) {
        throw new InvalidArgumentException('Nazwa zestawu musi mieć od 2 do 100 znaków.');
    }
    $pairs = $body['pairs'];
    if (count($pairs) < 2 || count($pairs) > 40 || !array_is_list($pairs)) {
        throw new InvalidArgumentException('Zestaw musi zawierać od 2 do 40 par.');
    }
    $out = [];
    $seen = [];
    foreach ($pairs as $index => $pair) {
        if (!is_array($pair) || !is_string($pair['term'] ?? null) || !is_string($pair['description'] ?? null)) {
            throw new InvalidArgumentException('Każda para musi mieć pojęcie i opis.');
        }
        $term = trim($pair['term']);
        $description = trim($pair['description']);
        if (!preg_match('//u', $term) || stringLength($term) < 1 || stringLength($term) > 140) {
            throw new InvalidArgumentException('Pojęcie nr ' . ($index + 1) . ': wpisz od 1 do 140 znaków.');
        }
        if (!preg_match('//u', $description) || stringLength($description) < 2 || stringLength($description) > 700) {
            throw new InvalidArgumentException('Opis nr ' . ($index + 1) . ': wpisz od 2 do 700 znaków.');
        }
        $normalized = function_exists('mb_strtolower') ? mb_strtolower($term, 'UTF-8') : strtolower($term);
        if (isset($seen[$normalized])) {
            throw new InvalidArgumentException('Pojęcia nie mogą się powtarzać: ' . $term);
        }
        $seen[$normalized] = true;
        $out[] = ['term' => $term, 'description' => $description];
    }
    return ['title' => $title, 'pairs' => $out];
}

/** Fixed-window throttle is persisted across sessions; keys are SHA-256 hashes of IPs. */
function rateAllowed(string $action, int $max, int $period): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = hash('sha256', $action . '|' . $ip);
    $pdo = database();
    $now = time();
    $pdo->exec('BEGIN IMMEDIATE');
    try {
        $stmt = $pdo->prepare('SELECT started_at, attempts FROM rate_limits WHERE key=?');
        $stmt->execute([$key]);
        $record = $stmt->fetch();
        if ($record && $now - (int)$record['started_at'] < $period && (int)$record['attempts'] >= $max) {
            $pdo->commit();
            return false;
        }
        if (!$record || $now - (int)$record['started_at'] >= $period) {
            $pdo->prepare('INSERT INTO rate_limits(key, started_at, attempts) VALUES(?,?,1)
                ON CONFLICT(key) DO UPDATE SET started_at=excluded.started_at, attempts=1')
                ->execute([$key, $now]);
        } else {
            $pdo->prepare('UPDATE rate_limits SET attempts=attempts+1 WHERE key=?')->execute([$key]);
        }
        // Opportunistic cleanup of old counters to avoid unlimited table growth.
        if (random_int(1, 100) === 1) {
            $pdo->prepare('DELETE FROM rate_limits WHERE started_at < ?')->execute([$now - 86400 * 2]);
        }
        $pdo->commit();
        return true;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}
