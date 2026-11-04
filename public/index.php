<?php
declare(strict_types=1);

// No scripts or styles from third-party CDNs; restrict embedding and caching.
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'self'; connect-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
header('Cache-Control: no-store');

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_httponly', '1');
$sessionPath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
session_name('mathmatch_accounts_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => $sessionPath === '' ? '/' : $sessionPath . '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();
require dirname(__DIR__) . '/src/lib.php';
require dirname(__DIR__) . '/src/domain.php';
require dirname(__DIR__) . '/src/profile-api.php';
require dirname(__DIR__) . '/src/guest-api.php';
expireGuestTest(time());

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function requestBody(): array
{
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        respond(['ok' => false, 'error' => 'Wymagana metoda POST.'], 405);
    }
    if (!hash_equals($_SESSION['csrf'], (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
        respond(['ok' => false, 'error' => 'Sesja wygasła. Odśwież stronę.'], 403);
    }
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 100_000) {
        respond(['ok' => false, 'error' => 'Zbyt duży zestaw.'], 413);
    }
    $raw = file_get_contents('php://input', false, null, 0, 100_001);
    if (strlen($raw ?: '') > 100_000) {
        respond(['ok' => false, 'error' => 'Zbyt duży zestaw.'], 413);
    }
    $body = json_decode($raw ?: '', true);
    if (!is_array($body)) {
        respond(['ok' => false, 'error' => 'Niepoprawne dane JSON.'], 400);
    }
    return $body;
}

function recordId(array $body): int
{
    $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false || $id === null) {
        throw new InvalidArgumentException('Nieprawidłowy identyfikator zestawu.');
    }
    return (int)$id;
}

$api = $_GET['api'] ?? null;
if (is_string($api)) {
    try {
        if ($api === 'bootstrap') {
            restoreProfile();
            if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
                respond(['ok' => false, 'error' => 'Wymagana metoda GET.'], 405);
            }
            respond([
                'ok' => true,
                'profile' => profile() ? publicProfile(profile()) : null,
                'guest' => !profile() && ($_SESSION['guest_mode'] ?? false) === true,
                'quizzes' => fetchQuizzes(),
                'admin' => isAdmin(),
                'adminConfigured' => readSetting('admin_hash') !== null,
                'canCreate' => publicCreationEnabled() || isAdmin(),
                'csrf' => $_SESSION['csrf'],
            ]);
        }
        $body = requestBody();
        if (str_starts_with($api, 'guest.')) respond(['ok'=>true] + guestApi($api,$body));
        if (str_contains($api, '.') || in_array($api, ['stats','leaderboard'], true)) {
            respond(['ok'=>true] + profileApi($api,$body));
        }
        if ($api === 'login') {
            if (!$isHttps && !in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1','::1'], true)) respond(['ok'=>false,'error'=>'Wymagane HTTPS.'],403);
            if (!rateAllowed('login', 8, 15 * 60)) {
                respond(['ok' => false, 'error' => 'Za dużo prób logowania. Spróbuj za 15 minut.'], 429);
            }
            $hash = readSetting('admin_hash');
            $pwd = $body['password'] ?? null;
            if ($hash === null || !is_string($pwd) || !password_verify($pwd, $hash)) {
                respond(['ok' => false, 'error' => 'Niepoprawne hasło administratora.'], 401);
            }
            session_regenerate_id(true);
            $_SESSION['math_match_admin'] = true;
            $_SESSION['math_match_admin_version'] = hash('sha256', $hash);
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            respond(['ok' => true, 'csrf' => $_SESSION['csrf']]);
        }
        if ($api === 'logout') {
            unset($_SESSION['math_match_admin'], $_SESSION['math_match_admin_version']);
            session_regenerate_id(true);
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            respond(['ok' => true, 'csrf' => $_SESSION['csrf']]);
        }
        if ($api === 'create') {
            if (!publicCreationEnabled() && !isAdmin()) {
                respond(['ok' => false, 'error' => 'Dodawanie zestawów jest dostępne tylko dla administratora.'], 403);
            }
            $quiz = validatedQuiz($body);
            if (!isAdmin() && !rateAllowed('create', 10, 60 * 60)) {
                respond(['ok' => false, 'error' => 'Limit 10 zestawów na godzinę. Spróbuj później.'], 429);
            }
            respond(['ok' => true, 'id' => saveQuiz($body)]);
        }
        if ($api === 'update' || $api === 'delete') {
            if (!isAdmin()) {
                respond(['ok' => false, 'error' => 'Tylko administrator może edytować i usuwać zestawy.'], 403);
            }
            $id = recordId($body);
            if ($api === 'delete') {
                $stmt = database()->prepare("UPDATE quizzes SET archived_at=datetime('now') WHERE id=? AND archived_at IS NULL");
                $stmt->execute([$id]);
                if ($stmt->rowCount() === 0) {
                    respond(['ok' => false, 'error' => 'Ten zestaw już nie istnieje.'], 404);
                }
                respond(['ok' => true]);
            }
            respond(['ok' => true, 'id' => saveQuiz($body,$id)]);
        }
        respond(['ok' => false, 'error' => 'Nieznana operacja.'], 404);
    } catch (InvalidArgumentException $e) {
        respond(['ok' => false, 'error' => $e->getMessage()], 422);
    } catch (Throwable $e) {
        error_log('[Math Match] Błąd obsługi żądania.');
        respond(['ok' => false, 'error' => 'Błąd serwera. Sprawdź konfigurację PHP i uprawnienia storage.'], 500);
    }
}
?><!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#eef4ff">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>Math Match — dopasuj pojęcia</title>
  <link rel="stylesheet" href="assets/app.css?v=10">
  <script src="assets/app.js?v=11" defer></script>
</head>
<body>
  <main class="shell">
    <header class="topbar">
      <div class="brand">
        <div class="brandicon" aria-hidden="true">✦</div>
        <div><div class="eyebrow">NAUKA PRZEZ ZABAWĘ</div><h1>Math Match <span aria-hidden="true">✨</span></h1></div>
      </div>
      <div class="topactions">
        <button type="button" class="btn btn-primary" id="newQuiz">＋ Nowy zestaw</button>
        <button type="button" class="btn" id="adminButton">🔐 Admin</button>
      </div>
    </header>
    <div id="banner" class="banner" role="status" hidden></div>

    <section id="welcomeView" class="welcome-panel" aria-labelledby="welcomeHeading">
      <p class="kicker">MAŁE KROKI, WIELKIE ODKRYCIA</p>
      <h2 id="welcomeHeading" tabindex="-1">Gotowi na zabawę? 🧩</h2>
      <p class="muted">Łącz pojęcia, ćwicz i sprawdzaj, ile już umiesz. Wybierz, jak chcesz grać.</p>
      <div class="welcome-actions">
        <button class="btn btn-primary" id="chooseGuest" type="button">🎮 Graj jako Gość</button>
        <button class="btn" id="chooseLogin" type="button">Zaloguj się</button>
        <button class="btn" id="chooseRegister" type="button">Utwórz profil</button>
      </div>
    </section>

    <section id="guestComparisonView" class="welcome-panel" hidden aria-labelledby="guestHeading">
      <h2 id="guestHeading" tabindex="-1">🎮 Jak chcesz grać?</h2>
      <p class="muted">Możesz grać bez konta, ale z profilem masz więcej możliwości!</p>
      <table class="guest-comparison">
        <caption class="sr-only">Porównanie gry jako Gość i gry z profilem</caption>
        <thead><tr><th scope="col">Możliwość</th><th scope="col">Gość</th><th scope="col">Z profilem</th></tr></thead>
        <tbody>
          <tr><th scope="row">Przeglądanie quizów</th><td>✅ <span class="sr-only">Tak</span></td><td>✅ <span class="sr-only">Tak</span></td></tr>
          <tr><th scope="row">Tryb Nauka</th><td>✅ <span class="sr-only">Tak</span></td><td>✅ <span class="sr-only">Tak</span></td></tr>
          <tr><th scope="row">Tryb Test</th><td>✅ <span class="sr-only">Tak</span></td><td>✅ <span class="sr-only">Tak</span></td></tr>
          <tr><th scope="row">Wynik i czas po teście</th><td>✅ <span class="sr-only">Tak</span></td><td>✅ <span class="sr-only">Tak</span></td></tr>
          <tr><th scope="row">Pauza i wznowienie w bieżącej grze</th><td>✅ <span class="sr-only">Tak</span></td><td>✅ <span class="sr-only">Tak</span></td></tr>
          <tr><th scope="row">Zapisywanie postępów</th><td>❌ <span class="sr-only">Nie</span></td><td>✅ <span class="sr-only">Tak</span></td></tr>
          <tr><th scope="row">Historia testów</th><td>❌ <span class="sr-only">Nie</span></td><td>✅ <span class="sr-only">Tak</span></td></tr>
          <tr><th scope="row">Śledzenie opanowanych pojęć</th><td>❌ <span class="sr-only">Nie</span></td><td>✅ <span class="sr-only">Tak</span></td></tr>
          <tr><th scope="row">Udział w leaderboardzie</th><td>❌ <span class="sr-only">Nie</span></td><td>✅ <span class="sr-only">Tak</span><small>za zgodą opiekuna</small></td></tr>
          <tr><th scope="row">Kontynuowanie na innym urządzeniu</th><td>❌ <span class="sr-only">Nie</span></td><td>✅ <span class="sr-only">Tak</span></td></tr>
        </tbody>
      </table>
      <div class="guest-actions">
        <button class="btn btn-primary" id="guestRegister" type="button">Utwórz profil — zapisuj swoje postępy!</button>
        <button class="btn" id="confirmGuest" type="button">Kontynuuj jako Gość</button>
        <button class="btn btn-quiet" id="guestLogin" type="button">Mam już profil — zaloguj się</button>
        <button class="btn btn-quiet" id="guestBack" type="button">← Ekran startowy</button>
      </div>
    </section>
    <p id="guestNotice" class="muted guest-notice" hidden>🙂 Gość · Grasz jako Gość — Twoje wyniki nie są zapisywane</p>

    <section id="libraryView" hidden aria-labelledby="libraryHeading">
      <div id="resumeCard" class="resume-card" hidden></div>
      <div class="sectionhead"><div><p class="kicker">WYBIERZ SWOJE WYZWANIE</p><h2 id="libraryHeading">Quizy</h2><p class="muted" id="libraryGreeting">Wybierz zestaw i znajdź wszystkie pasujące pary.</p></div><span class="pill" id="quizCount">0 zestawów</span></div>
      <div class="quiz-grid" id="quizGrid" aria-live="polite"></div>
      <div class="empty" id="emptyLibrary" hidden>Nie ma jeszcze żadnych zestawów. Stwórz pierwszy! 🎨</div>
    </section>

    <section id="gameView" aria-label="Gra w dopasowywanie" hidden>
      <div class="viewtop"><button type="button" class="btn" id="backFromGame">← Wszystkie quizy</button><div class="viewtools"><button type="button" class="btn" id="restart">↻ Od nowa</button><button type="button" class="btn iconbtn" id="soundToggle" aria-label="Wyłącz dźwięk" aria-pressed="true">🔊</button></div></div>
      <div class="board">
        <div class="boardhead"><div><p class="kicker">POŁĄCZ PARY</p><h2 id="gameTitle">Quiz</h2><p class="muted small">Najpierw wybierz nazwę po lewej, potem pasujący opis po prawej.</p></div><span class="pill" id="gameCounter">0 / 0</span></div>
        <div class="progress" id="progressBar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Postęp"><div id="progressFill"></div></div>
        <p class="feedback" id="feedback" aria-live="polite">Wybierz nazwę po lewej 👈</p>
        <div id="gameColumns" class="columns">
          <div><div class="columnlabel"><span class="step">1</span> NAZWY</div><div class="choices terms" id="terms"></div></div>
          <div><div class="columnlabel"><span class="step rightstep">2</span> OPISY</div><div class="choices descriptions" id="descriptions"></div></div>
        </div>
        <div class="finish" id="finish" hidden><div class="trophy">🏆</div><h2>Fantastycznie!</h2><p>Brawo! Wszystkie pary dopasowane! 🎉</p><button type="button" class="btn btn-primary" id="playAgain">Zagraj jeszcze raz ↻</button><button type="button" class="btn" id="finishLibrary">Inny quiz</button></div>
        <p class="footerhint">Dobra para znika. Przy błędzie usłyszysz „buuu” i możesz spróbować jeszcze raz.</p>
      </div>
    </section>

    <section id="editorView" hidden aria-labelledby="editorHeading">
      <div class="viewtop"><button type="button" class="btn" id="cancelEditTop">← Wszystkie quizy</button></div>
      <div class="editor-panel">
        <p class="kicker">TWÓJ WŁASNY ZESTAW</p><h2 id="editorHeading">Nowy quiz</h2>
        <p class="muted">Podaj nazwę i pary pojęcie–opis. Zestaw zostanie <strong>zapisany na serwerze</strong> i będzie dostępny na wszystkich urządzeniach.</p>
        <form id="editorForm" novalidate>
          <label class="fieldlabel" for="quizTitle">Nazwa zestawu</label>
          <input class="field" id="quizTitle" placeholder="Np. Geometry — Chapter 2" maxlength="100" autocomplete="off" required>
          <div class="pairsheader"><strong>Pary pojęcie + opis</strong><span class="muted small" id="pairCount"></span></div>
          <div id="editorPairs"></div>
          <button type="button" class="btn" id="addPair">＋ Dodaj parę</button>
          <p class="formerror" id="editorError" role="alert"></p>
          <div class="formactions"><button type="button" class="btn btn-danger" id="deleteQuiz" hidden>🗑 Usuń zestaw</button><div class="grow"></div><button type="button" class="btn" id="cancelEdit">Anuluj</button><button type="submit" class="btn btn-primary" id="saveQuiz">💾 Zapisz na serwerze</button></div>
        </form>
      </div>
    </section>

    <footer class="sitefooter">Math Match · Twoje zestawy zapisane na serwerze 🔒</footer>
  </main>

  <dialog id="adminDialog" aria-labelledby="adminHeading">
    <form id="loginForm" class="dialogbody" novalidate>
      <div class="dialoghead"><h2 id="adminHeading">Panel administratora</h2><button type="button" class="closebtn" id="closeAdmin" aria-label="Zamknij">×</button></div>
      <p class="muted">Zaloguj się, aby edytować i usuwać zapisane zestawy.</p>
      <label class="fieldlabel" for="adminPassword">Hasło administratora</label>
      <input type="text" name="admin_username" value="Administrator Math Match" autocomplete="username" readonly class="sr-only" tabindex="-1" aria-label="Konto administratora">
      <input class="field" id="adminPassword" name="admin_password" type="password" autocomplete="current-password" required>
      <p class="formerror" id="loginError" role="alert"></p>
      <button type="submit" class="btn btn-primary btn-full" id="loginSubmit">Zaloguj</button>
    </form>
  </dialog>
</body>
</html>
