<?php
declare(strict_types=1);

/** Jedna bieżąca gra, bez tabel sesji, profili, wyników i postępów. */
function expireGuestTest(int $now): void
{
    if (isset($_SESSION['guest_test']) && ($_SESSION['guest_test']['expires'] ?? 0) <= $now) {
        unset($_SESSION['guest_test']);
    }
}

function guestTestView(array $s): array
{
    $view = $s;
    unset($view['request_key'], $view['expires']);
    $view['answers'] = json_decode($s['answers'], true, 32, JSON_THROW_ON_ERROR);
    $view['server_now'] = time();
    $view['guest'] = true;
    $view['ranking_eligible'] = false;
    return $view;
}

function guestApi(string $action, array $body): array
{
    if (profile()) invalid('Aby grać jako Gość, najpierw wyloguj profil.');
    if (!rateAllowed('guest-requests', 180, 60)) invalid('Za dużo żądań. Spróbuj za minutę.');
    expireGuestTest(time());
    if ($action === 'guest.enter') {
        if (($body['confirm'] ?? null) !== true) invalid('Potwierdź wybór trybu Gościa.');
        $_SESSION['guest_mode'] = true;
        return ['guest' => true];
    }
    if (($_SESSION['guest_mode'] ?? false) !== true) invalid('Najpierw wybierz „Kontynuuj jako Gość”.');
    if ($action === 'guest.start') {
        if (!rateAllowed('guest-start', 120, 3600)) invalid('Limit nowych testów. Spróbuj później.');
        $id = recordId($body);
        $key = textField($body, 'request_key', 16, 100);
        $old = $_SESSION['guest_test'] ?? null;
        if ($old && $old['request_key'] === $key) {
            if ($old['quiz_id'] !== $id) invalid('Klucz rozpoczęcia został już użyty.');
            return ['attempt' => guestTestView($old)];
        }
        // Wersję wybiera serwer. Klient nie może podstawić snapshotu ani wyniku.
        $version = query('SELECT v.*, q.title FROM quiz_versions v JOIN quizzes q ON q.id=v.quiz_id
            WHERE q.id=? AND q.archived_at IS NULL ORDER BY v.version DESC LIMIT 1', [$id])->fetch();
        if (!$version) invalid('Brak zestawu.');
        $now = time();
        $s = [
            'id' => bin2hex(random_bytes(16)), 'quiz_id' => $id,
            'version_id' => $version['id'], 'title' => $version['title'],
            'pairs' => json_decode($version['pairs_json'], true, 32, JSON_THROW_ON_ERROR),
            'mode' => 'test', 'request_key' => $key, 'status' => 'active',
            'started' => $now, 'last_seen' => $now, 'active_seconds' => 0,
            'paused' => 0, 'revision' => 0, 'answers' => '{}', 'finished' => null,
            'score' => null, 'expires' => $now + 7200,
        ];
        $_SESSION['guest_test'] = $s;
        return ['attempt' => guestTestView($s)];
    }
    $s = $_SESSION['guest_test'] ?? null;
    if (!$s || !hash_equals($s['id'], textField($body, 'attempt_id', 32, 32))) {
        invalid('Bieżący test Gościa nie jest już dostępny. Możesz rozpocząć nowy.');
    }
    if ($action === 'guest.get') {
        if ($s['status'] !== 'finished') {
            $s = tick($s, time());
            $s['status'] = 'paused';
            $s['paused'] = 1;
            $s['revision']++;
        }
    } else {
        $s = advanceTest($s, substr($action, strlen('guest.')), $body, $s['pairs'], time());
    }
    // Ukończony wynik zostaje krótko dla bezpiecznego ponowienia odpowiedzi HTTP.
    $s['expires'] = $s['finished'] !== null ? $s['finished'] + 300 : time() + 7200;
    $_SESSION['guest_test'] = $s;
    return ['attempt' => guestTestView($s)];
}
