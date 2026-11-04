# Weryfikacja wydania kont — 4 listopada 2026

## Wykonane

Środowisko lokalne: PHP 8.4.17. Wszystkie wykonania PHP korzystające z bazy
miały odrębny, pusty katalog `MATH_MATCH_STORAGE`, syntetyczne dane i lokalne
sesje. HTTP tylko na 127.0.0.1. Produkcja nie była odczytywana ani zmieniana.

- `python3 tests/run.py`: 15 testów zakończonych powodzeniem. Obejmują zestawy
  asercji PHP, API, kont, inicjalizacji, logiki domenowej i autoryzacji.
- `node tests/client.cjs`: powodzenie. Karty bez sekretów, limit 20, usunięcie
  bez odtwarzania przy refresh, brak localStorage, powodzenie/błąd wylogowania.
- `node --check public/assets/app.js`: powodzenie.
- `php -l` dla wszystkich 13 plików PHP w src/public/bin/tests: powodzenie.
- `git diff --check`: powodzenie.

Testy kont obejmują Unicode NFC/case folding i polskie litery, UNIQUE,
rejestrację bez duplikatów, 8–128 znaków, spacje, długie Unicode, blokadę
popularnych haseł, Argon2id i fallback bez obcinania, zmianę hasła i ksywki,
limity per konto/IP, odwołanie innych sesji, odzyskanie i wygaśnięcie sekretu.
Dodatkowy przebieg testu kont sprawdza aktualizację algorytmu po logowaniu,
konflikt zmiany ksywki, tożsamość zapamiętanej karty i izolację nowej instalacji.
Tokeny urządzeń: odtworzenie, rotacja, wygaśnięcie i brak odtworzenia po wylogowaniu.

Test wspólnego telefonu sprawdza A → B → A, zachowanie postępów, brak dostępu
do prób innego dziecka, pauzę z odpowiedziami i wykluczeniem z rankingu,
niezależną sesję admina i drugiego urządzenia, POST/CSRF oraz rollback przy
wymuszonym błędzie SQLite podczas wylogowania.

Testy domenowe obejmują Naukę, Test, pauzę, wznowienie, historię, ranking,
zgody, wersje quizów i niezmienne snapshoty. Testy Gościa obejmują brak trwałych
wyników, serwerowy timer i ocenę, izolację, brak importu po logowaniu.
Inicjalizator jest sprawdzany także w świeżym klonie z nałożonymi plikami
bieżącej poprawki; ponowne uruchomienie nie niszczy danych.

## Analiza statyczna

Sprawdzono serwerową autoryzację, ograniczenie danych publicznego profilu,
brak PIN-ów/parowania/migratora w aktywnym kodzie, użycie textContent/value,
czyszczenie stanu przy zmianie gracza, semantykę pól autocomplete, strukturę
menu i reguły responsywności. Nie potwierdza to działania renderowania.

## Niewykonane

Nie uruchamiano przeglądarki, Playwright, Selenium, screenshotów ani emulacji
urządzeń. Układ, klawiatura/VoiceOver, autofill Safari/Chrome i dźwięk na iOS
wymagają ręcznej checklisty `TESTY-RECZNE.md`. Nie sprawdzano rzeczywistej
konfiguracji VPS, FPM, certyfikatów ani proxy. Nie wykonano wdrożenia, usuwania
starej bazy, commita ani pusha.

## Pliki wydania

- Nowe: `bin/init.php`, `src/schema.php`, `src/accounts.php`,
  `tests/accounts.php`, `tests/client.cjs`, `docs/WDROZENIE.md`,
  `docs/TESTY-RECZNE.md`, `docs/WERYFIKACJA.md`.
- Zmienione: `src/lib.php`, `src/domain.php`, `src/profile-api.php`,
  `public/index.php`, `public/assets/app.js`, `public/assets/app.css`,
  `tests/features.php`, `tests/guest.php`, `tests/run.py`, `README.md`,
  `AGENTS.md`, `docs/ROZBUDOWA.md`, `docs/PRZELACZANIE-PROFILI.md`, `docs/GOSC.md`.
- `AUDIT.md`: dodane oznaczenie dokumentu historycznego, bez przepisywania audytu.
- Usunięte: `bin/migrate.php`, `src/migrations.php`.
