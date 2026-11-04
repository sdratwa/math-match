<?php
declare(strict_types=1);

/** Wyłącznie pusta baza; żadnej konwersji wcześniejszych danych. */
function initializeDatabase(PDO $db): void
{
    $db->exec('BEGIN IMMEDIATE');
    try {
        if ((int)$db->query('PRAGMA user_version')->fetchColumn() !== 0 ||
            $db->query("SELECT 1 FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'")->fetchColumn()) {
            throw new RuntimeException('Baza nie jest pusta. Inicjalizacja odmówiona.');
        }
        $db->exec("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            CREATE TABLE quizzes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
            pairs_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), archived_at TEXT, revision INTEGER NOT NULL DEFAULT 1);
            CREATE TABLE rate_limits (key TEXT PRIMARY KEY, started_at INTEGER NOT NULL, attempts INTEGER NOT NULL);
            CREATE TABLE quiz_versions (id INTEGER PRIMARY KEY, quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
                version INTEGER NOT NULL, pairs_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(quiz_id,version));
            CREATE TABLE profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT NOT NULL, nickname_key TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, avatar TEXT NOT NULL,
                password_hash TEXT NOT NULL, sound INTEGER NOT NULL DEFAULT 1 CHECK(sound IN (0,1)), consent INTEGER NOT NULL DEFAULT 0 CHECK(consent IN (0,1)), auth_version INTEGER NOT NULL DEFAULT 1,
                created_at INTEGER NOT NULL, last_active INTEGER NOT NULL);
            CREATE TABLE profile_tokens (hash TEXT PRIMARY KEY, profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                expires INTEGER NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('device','recovery')));
            CREATE INDEX token_profile ON profile_tokens(profile_id);
            CREATE TABLE sessions (id TEXT PRIMARY KEY, profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                version_id INTEGER NOT NULL REFERENCES quiz_versions(id), mode TEXT NOT NULL CHECK(mode IN ('learn','test')),
                request_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', started INTEGER NOT NULL, last_seen INTEGER NOT NULL,
                active_seconds INTEGER NOT NULL DEFAULT 0, paused INTEGER NOT NULL DEFAULT 0, revision INTEGER NOT NULL DEFAULT 0,
                answers TEXT NOT NULL DEFAULT '{}', finished INTEGER, score INTEGER, UNIQUE(profile_id,request_key));
            CREATE INDEX session_profile ON sessions(profile_id,started);
            CREATE INDEX session_ranking ON sessions(version_id,mode,status,paused,score);
            CREATE TABLE learning_events (id INTEGER PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                event_key TEXT NOT NULL, pair_id TEXT NOT NULL, definition_id TEXT NOT NULL, correct INTEGER NOT NULL,
                first_try INTEGER NOT NULL, created INTEGER NOT NULL, UNIQUE(session_id,event_key));
            CREATE INDEX learning_pair ON learning_events(session_id,pair_id);
            CREATE TABLE progress (profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                pair_id TEXT NOT NULL, contacts INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0,
                errors INTEGER NOT NULL DEFAULT 0, successes INTEGER NOT NULL DEFAULT 0, mastered_before INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'new', last_seen INTEGER NOT NULL, PRIMARY KEY(profile_id,pair_id));");
        $db->prepare('INSERT INTO settings(key,value) VALUES(?,?)')->execute(['installation_id',bin2hex(random_bytes(16))]);
        $db->exec('PRAGMA user_version=2');
        if ($db->query('PRAGMA integrity_check')->fetchColumn() !== 'ok' || $db->query('PRAGMA foreign_key_check')->fetch()) {
            throw new RuntimeException('Błąd integralności.');
        }
        $db->commit();
    } catch (Throwable $e) { $db->rollBack(); throw $e; }
}
