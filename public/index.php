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
session_name('mathmatch_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => $sessionPath === '' ? '/' : $sessionPath . '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();
require dirname(__DIR__) . '/src/lib.php';

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
            if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
                respond(['ok' => false, 'error' => 'Wymagana metoda GET.'], 405);
            }
            respond([
                'ok' => true,
                'quizzes' => fetchQuizzes(),
                'admin' => isAdmin(),
                'adminConfigured' => readSetting('admin_hash') !== null,
                'canCreate' => publicCreationEnabled() || isAdmin(),
                'csrf' => $_SESSION['csrf'],
            ]);
        }
        $body = requestBody();
        if ($api === 'login') {
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
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            respond(['ok' => true, 'csrf' => $_SESSION['csrf']]);
        }
        if ($api === 'logout') {
            unset($_SESSION['math_match_admin']);
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
            $stmt = database()->prepare('INSERT INTO quizzes(title,pairs_json) VALUES(?,?)');
            $stmt->execute([$quiz['title'], json_encode($quiz['pairs'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
            respond(['ok' => true, 'id' => (int)database()->lastInsertId()]);
        }
        if ($api === 'update' || $api === 'delete') {
            if (!isAdmin()) {
                respond(['ok' => false, 'error' => 'Tylko administrator może edytować i usuwać zestawy.'], 403);
            }
            $id = recordId($body);
            if ($api === 'delete') {
                $stmt = database()->prepare('DELETE FROM quizzes WHERE id=?');
                $stmt->execute([$id]);
                if ($stmt->rowCount() === 0) {
                    respond(['ok' => false, 'error' => 'Ten zestaw już nie istnieje.'], 404);
                }
                respond(['ok' => true]);
            }
            $quiz = validatedQuiz($body);
            $stmt = database()->prepare('UPDATE quizzes SET title=?, pairs_json=?, updated_at=datetime(\'now\') WHERE id=?');
            $stmt->execute([$quiz['title'], json_encode($quiz['pairs'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $id]);
            if ($stmt->rowCount() === 0) {
                $check = database()->prepare('SELECT 1 FROM quizzes WHERE id=?');
                $check->execute([$id]);
                if ($check->fetchColumn() === false) {
                    respond(['ok' => false, 'error' => 'Ten zestaw już nie istnieje.'], 404);
                }
            }
            respond(['ok' => true, 'id' => $id]);
        }
        respond(['ok' => false, 'error' => 'Nieznana operacja.'], 404);
    } catch (InvalidArgumentException $e) {
        respond(['ok' => false, 'error' => $e->getMessage()], 422);
    } catch (Throwable $e) {
        error_log('[Math Match] ' . $e->getMessage());
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
  <link rel="stylesheet" href="assets/app.css?v=1">
  <script src="assets/app.js?v=1" defer></script>
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

    <section id="libraryView" aria-labelledby="libraryHeading">
      <div class="sectionhead"><div><p class="kicker">WYBIERZ SWOJE WYZWANIE</p><h2 id="libraryHeading">Biblioteka quizów</h2><p class="muted">Wybierz zestaw i znajdź wszystkie pasujące pary.</p></div><span class="pill" id="quizCount">0 zestawów</span></div>
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
      <input class="field" id="adminPassword" type="password" autocomplete="current-password" required>
      <p class="formerror" id="loginError" role="alert"></p>
      <button type="submit" class="btn btn-primary btn-full" id="loginSubmit">Zaloguj</button>
    </form>
  </dialog>
</body>
</html>
