# Czyste wdrożenie na OVH

Procedura jest do ręcznego wykonania **po osobnej decyzji użytkownika**.
Codex nie wykonuje na VPS backupu, usuwania bazy, aktualizacji ani restartów.
Nie ma konwersji danych. Dotychczasowe testowe quizy, konta i wyniki zostaną
celowo usunięte. Backup jest wyłącznie awaryjną możliwością odtworzenia starej wersji.

Poniższe ścieżki są przykładami, nie potwierdzonym stanem VPS:
`/var/www/math-match`, `/var/www/math-match/storage`, `/var/backups/math-match`.
Przed wykonaniem ustal rzeczywisty katalog danych z konfiguracji PHP-FPM
(`MATH_MATCH_STORAGE`). Nie zgaduj ścieżki bazy ani konfiguracji nginx.
Wszystkie polecenia wykonuj na VPS, nie na lokalnej bazie Codex.

## Pierwsza instalacja bez starej aplikacji

1. Zatwierdź wydanie i opublikuj kod w GitHub oddzielnym poleceniem użytkownika.
   Na VPS sklonuj wybrane repozytorium i sprawdzony commit:

   ```sh
   sudo git clone ADRES_REPOZYTORIUM /var/www/math-match
   sudo git -C /var/www/math-match checkout --detach ZATWIERDZONY_COMMIT
   sudo apt install php8.4-fpm php8.4-sqlite3 php8.4-intl php8.4-mbstring sqlite3
   sudo install -d -o www-data -g www-data -m 750 /var/www/math-match/storage
   ```

   `ADRES_REPOZYTORIUM` i `ZATWIERDZONY_COMMIT` zastąp własnymi wartościami;
   nie umieszczaj tokenów w URL. Kod ma należeć do operatora/root, nie www-data.
2. Zainicjalizuj i ustaw hasło (bez wpisywania hasła do argumentów):

   ```sh
   sudo -u www-data env MATH_MATCH_STORAGE=/var/www/math-match/storage php8.4 /var/www/math-match/bin/init.php
   sudo -u www-data env MATH_MATCH_STORAGE=/var/www/math-match/storage php8.4 /var/www/math-match/bin/admin.php set-password
   ```

3. Dostosuj `deploy/nginx-example.conf`. Root to wyłącznie
   `/var/www/math-match/public`, socket właściwej wersji PHP-FPM. Włącz HTTPS
   dla domeny i przekierowanie HTTP → HTTPS. Plik jest przykładem, nie zawiera
   gotowych certyfikatów. W puli FPM ustaw tę samą ścieżkę danych co w CLI.
4. Sprawdź `sudo nginx -t`, następnie przeładuj nginx i uruchom/restartuj właściwą
   usługę PHP-FPM. Wykonaj checklistę ręczną.

## Wymiana istniejącej testowej aplikacji

1. Przed przerwą sprawdź wyniki testów wydania, rozszerzenia w CLI **i FPM** oraz
   dostępność wybranego commita w GitHub. Zapisz bieżący commit poleceniem
   `git -C /var/www/math-match rev-parse HEAD`. Sprawdź czyste drzewo Git i zachowaj
   lokalne ustawienia operatora poza repozytorium. Nie stosuj reset --hard.
2. Włącz przerwę techniczną w istniejącym bloku nginx (np. czasowy `return 503;`
   na poziomie właściwego `server`), sprawdź `nginx -t` i przeładuj nginx.
   Zatrzymaj procesy zapisujące dane, także CLI. Zatrzymaj właściwe PHP-FPM;
   `sudo systemctl stop php8.4-fpm` zatrzymuje wszystkie witryny tej usługi,
   więc w środowisku współdzielonym uzgodnij przerwę lub odizoluj pulę.
3. Wykonaj spójną kopię awaryjną przez SQLite. Nie kopiuj samej aktywnej bazy:

   ```sh
   sudo install -d -o www-data -g www-data -m 700 /var/backups/math-match
   MM_BACKUP="/var/backups/math-match/przed-czysta-instalacja-$(date +%Y%m%d-%H%M%S).sqlite"
   sudo -u www-data sqlite3 /var/www/math-match/storage/math_match.sqlite ".backup '$MM_BACKUP'"
   sudo chmod 600 "$MM_BACKUP"
   sudo -u www-data sqlite3 "$MM_BACKUP" 'PRAGMA integrity_check; PRAGMA foreign_key_check;'
   ```

   Oczekuj `ok` i braku wierszy błędów FK. Przerwij procedurę przy błędzie.
   Zachowaj ścieżkę kopii oraz wcześniejszy commit i konfigurację. Kopia zawiera
   hashe i dane; nie wysyłaj jej do GitHub, logów ani PR.
4. **Świadomy reset, tylko po sprawdzeniu kopii i zatrzymaniu zapisów:** usuń
   dokładnie starą testową bazę oraz pliki pomocnicze. Nie usuwaj całego storage:

   ```sh
   sudo rm -f -- /var/www/math-match/storage/math_match.sqlite /var/www/math-match/storage/math_match.sqlite-wal /var/www/math-match/storage/math_match.sqlite-shm
   ```

5. Pobierz kod z GitHub i przełącz całe wydanie podczas przerwy:

   ```sh
   sudo git -C /var/www/math-match fetch origin
   sudo git -C /var/www/math-match checkout --detach ZATWIERDZONY_COMMIT
   ```

   Nowy commit musi zawierać wszystkie pliki wydania i usuwać stary migrator.
   Nie publikuj mieszanych wersji PHP, JS i CSS. Sprawdź prawa kodu oraz katalogu
   danych. Zainstaluj brakujące `php8.4-intl`, `php8.4-mbstring`, `php8.4-sqlite3`.
6. Uruchom dwa polecenia `init.php` i `admin.php set-password` z sekcji pierwszej
   instalacji, z właściwym `MATH_MATCH_STORAGE`. Sprawdź bazę:

   ```sh
   sudo -u www-data sqlite3 /var/www/math-match/storage/math_match.sqlite 'PRAGMA user_version; PRAGMA integrity_check; PRAGMA foreign_key_check; SELECT COUNT(*) FROM profiles; SELECT COUNT(*) FROM quizzes;'
   ```

   Oczekuj wersji `2`, `ok`, braku błędów FK oraz dwóch zer. To czysta baza, nie
   migracja. Jeśli `init.php` odmawia, ustal przyczynę; nie obchodź blokady.
7. Uruchom PHP-FPM, co również odświeży OPcache. Usuń czasową regułę przerwy,
   sprawdź nginx i przeładuj konfigurację. Zweryfikuj HTTPS i brak publicznego
   dostępu do `storage/`, `src/`, `.git/` oraz kopii. Nie ufaj nagłówkom proxy bez
   jawnej konfiguracji zaufanych źródeł.
8. Wykonaj [checklistę ręczną](TESTY-RECZNE.md). Świeża instalacja wymaga ponownego
   utworzenia quizów i profili. Obserwuj wyłącznie ogólne błędy serwera,
   bez logowania haseł, tokenów i treści żądań logowania.

## Awaryjne wycofanie

1. Ponownie włącz przerwę i zatrzymaj zapisy/PHP-FPM.
2. Jeżeli w nowej bazie powstały potrzebne dane, wykonaj jej oddzielny `.backup`.
   Odtworzenie starej wersji nie przeniesie nowych danych.
3. Przywróć zapamiętany poprzedni commit i jego konfigurację. Nowy kod nie
   obsłuży starego schematu. Usuń **wyłącznie nieużywane już** pliki nowej bazy
   SQLite/WAL/SHM po backupie, następnie odtwórz starą kopię przez `.restore`:

   ```sh
   sudo -u www-data sqlite3 /var/www/math-match/storage/math_match.sqlite ".restore '$MM_BACKUP'"
   sudo chmod 600 /var/www/math-match/storage/math_match.sqlite
   sudo -u www-data sqlite3 /var/www/math-match/storage/math_match.sqlite 'PRAGMA integrity_check; PRAGMA foreign_key_check;'
   ```

4. Ustaw ponownie hasło administratora przy użyciu CLI odtworzonego wydania.
   Zabezpiecz sesje zgodnie z procedurą starego wydania (nie przywracaj starych
   plików sesji). Uruchom FPM, sprawdź stronę i dopiero zdejmij przerwę.

Przy późniejszych aktualizacjach tego wydania nie usuwaj bazy i nie uruchamiaj
ponownie inicjalizatora. Powyższy reset dotyczy wyłącznie świadomej wymiany
starej aplikacji testowej na tę czystą instalację.
