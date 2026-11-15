<?php
declare(strict_types=1);
// Wydzielony materiał do nauki: bez bazy, kont i trwałych wyników.
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'self'; connect-src 'none'; img-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
header('Cache-Control: no-store');
?><!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#edf4ff">
  <title>Cambridge Unit 3 — Math Match</title>
  <link rel="stylesheet" href="assets/unit3/unit3.css?v=6">
  <script src="assets/unit3/core.js?v=6" defer></script>
  <script src="assets/unit3/ui.js?v=6" defer></script>
</head>
<body>
  <div class="u3-shell">
    <header class="u3-header">
      <a href="index.php" class="brand">✦ Math Match</a>
      <button type="button" id="unitHome" class="secondary">Start modułu</button>
    </header>
    <main id="unitApp" aria-label="Cambridge Unit 3">
      <p>Przygotowujemy materiał…</p>
      <noscript>Ten moduł wymaga JavaScript. Włącz JavaScript w przeglądarce, aby rozwiązywać zadania.</noscript>
    </main>
    <footer>Przygotowanie do sprawdzianu · Stage 5 · Unit 3<br>Bez logowania. Wyniki są tylko na tej otwartej stronie. Odświeżenie je usuwa.</footer>
  </div>
  <dialog id="unitConfirm" aria-labelledby="confirmTitle" aria-describedby="confirmText">
    <h2 id="confirmTitle">Zakończyć tę aktywność?</h2>
    <p id="confirmText"></p>
    <div class="actions">
      <button type="button" id="confirmNo" class="secondary">Zostań</button>
      <button type="button" id="confirmYes">Potwierdź</button>
    </div>
  </dialog>
</body>
</html>
