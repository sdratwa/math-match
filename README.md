# Math Match — quizy zapisane na serwerze OVH

Gotowa aplikacja **PHP 8.1+ + SQLite + JavaScript**, bez Composer, Node i bez zewnętrznych serwisów.

## Funkcje

- Biblioteka wspólnych zestawów: po otwarciu na iPhonie, iPadzie i komputerze widać te same quizy.
- Gracz łączy pojęcia po lewej z opisami po prawej. Dobra para znika, błędna robi się czerwona i wydaje „buuu” (zależnie od ustawień dźwięku urządzenia).
- Każdy może **utworzyć nowy zestaw**, który jest zapisywany na stałe w SQLite na OVH.
- **Tylko administrator**, po podaniu hasła, może edytować i usuwać istniejące zestawy.
- Obsługa ekranu dotykowego, responsywny wygląd, przyciski do powtórki i wyłączania dźwięku.
- Profile, trwałe postępy, osobny tryb Test i dobrowolny ranking. Nowa instalacja ma pustą bibliotekę.
- Ochrona przed SQL injection, XSS, CSRF, podstawowe limity żądań i bezpieczeństwo sesji.

**Ważne:** quizy przechowuje plik `storage/math_match.sqlite`, nie `localStorage` przeglądarki. Nie usuwaj tego pliku przy aktualizacji! Przechowuj kopie zapasowe. Baza zawiera również profile i postępy dzieci; kopie wymagają ochrony dostępu.

## Instalacja na OVH VPS (Debian 13 / nginx / PHP 8.4)

Zakładamy, że masz SSH oraz domenę/subdomenę wskazującą na VPS, np. `quiz.twojadomena.pl`.

Poniższe czynności na OVH wykonuj wyłącznie po osobnej decyzji o wdrożeniu.
Zatwierdzenie zmian w kodzie nie oznacza zgody na wdrożenie.

### 1. Rozpakuj pliki

Prześlij `math-match-ovh.zip` na serwer (SFTP/scp), np. do `/tmp`, a następnie:

```bash
sudo mkdir -p /var/www/math-match
sudo unzip /tmp/math-match-ovh.zip -d /var/www/math-match
```

W folderze powinny być bezpośrednio: `public/`, `storage/`, `src/`, `bin/`, `deploy/`, `README.md`.

Alternatywnie wykonaj `git clone ADRES_REPOZYTORIUM math-match` (zastąp adres
adresem swojego repozytorium, bez tokenów i haseł w poleceniu). Świeży klon zawiera
`storage/.gitkeep`, dzięki czemu katalog danych istnieje od razu. Git nie przechowuje
bazy; powstaje ona po jawnym uruchomieniu migracji CLI.
Na VPS umieść kod w `/var/www/math-match`, a następnie ustaw uprawnienia poniżej.
Nie klonuj ani nie rozpakowuj nowej instalacji na istniejący katalog danych produkcyjnych.

### 2. SQLite i prawa zapisu

```bash
sudo apt update
sudo apt install php8.4-sqlite3 sqlite3
sudo systemctl restart php8.4-fpm
sudo mkdir -p /var/www/math-match/storage
sudo chown -R www-data:www-data /var/www/math-match/storage
sudo chmod 750 /var/www/math-match/storage
```

Sprawdź, czy PHP obsługuje SQLite:

```bash
php -m | grep -i sqlite
```

Oczekiwane: `pdo_sqlite`, `sqlite3`. Jeśli używasz innej wersji PHP, zainstaluj odpowiedni pakiet (`php8.3-sqlite3` itd.), dopasuj socket PHP-FPM w konfiguracji nginx i uruchom ponownie właściwą usługę.

### 3. Skonfiguruj hasło administratora (przed publikacją strony)

```bash
sudo -u www-data php /var/www/math-match/bin/migrate.php
sudo -u www-data php /var/www/math-match/bin/admin.php set-password
```

Wpisz dwa razy własne hasło (12–72 bajty, zgodnie z limitem bcrypt). Hasło nie jest trzymane w jawnym tekście — zapisywany jest jego bezpieczny hash. Aby zmienić hasło, uruchom to samo polecenie ponownie.

Każde poprawne ustawienie hasła, także ponowne ustawienie tego samego hasła,
unieważnia wcześniejsze sesje administratora na wszystkich urządzeniach.
Przy następnym sprawdzeniu uprawnień serwer odrzuci starą sesję. Otwarty panel
może nadal pokazywać przyciski, ale kolejne chronione żądania zostaną odrzucone;
odśwież stronę i zaloguj się ponownie. Nie wymaga to usuwania plików sesji PHP.
Operacji już autoryzowanej przed zmianą hasła nie można w ten sposób cofnąć.
Nieudana zmiana hasła (np. różne wpisy) pozostawia dotychczasowe hasło i sesje.

> Jeżeli `sudo -u www-data` nie ma dostępu do katalogów nadrzędnych lub polecenie nie działa, popraw uprawnienia odczytu kodu. **Nie** ustawiaj całemu katalogowi `chmod 777`.

### 4. Uruchom serwer WWW

Skopiuj przykładowy plik nginx:

```bash
sudo cp /var/www/math-match/deploy/nginx-example.conf /etc/nginx/sites-available/math-match
sudo nano /etc/nginx/sites-available/math-match
```

Zamień `quiz.twojadomena.pl` na własną subdomenę i sprawdź ścieżkę socketu PHP-FPM. Następnie:

```bash
sudo ln -s /etc/nginx/sites-available/math-match /etc/nginx/sites-enabled/math-match
sudo nginx -t
sudo systemctl reload nginx
```

Następnie uruchom HTTPS — np. jeśli korzystasz z Certbota:

```bash
sudo certbot --nginx -d quiz.twojadomena.pl
```

**Ważne:** root strony ma być **`/var/www/math-match/public`**, a NIE `/var/www/math-match`. W przeciwnym razie plik SQLite z quizami mógłby być publicznie dostępny. Właśnie dlatego baza jest poza `public/`.

### 5. Gotowe

Otwórz `https://quiz.twojadomena.pl`. Po migracji nowa instalacja ma pustą bibliotekę; można dodać własne zestawy. Nowe zestawy zapiszą się w `/var/www/math-match/storage/math_match.sqlite`.

## Korzystanie

1. Na stronie głównej wybierz zestaw i kliknij **Graj**.
2. Kliknij pojęcie po lewej, potem opis po prawej. Błąd = czerwień + „buuu”; sukces = para znika.
3. **＋ Nowy zestaw** → wpisz nazwę, co najmniej 2 pary → **Zapisz na serwerze**.
4. Kliknij **Admin** → podaj hasło. Przy zestawach pojawi się przycisk **Edytuj**, a wewnątrz formularza również **Usuń zestaw**.
5. **Wyloguj admina** kończy sesję administratora w tej przeglądarce.

Maksymalnie 40 par na zestaw. Publicznie można tworzyć do 10 zestawów na godzinę na adres IP. Administrator nie ma tego limitu.

### Ograniczenie tworzenia quizów do administratora (opcjonalnie)

Domyślnie tworzyć może **każdy**, zgodnie z wymaganiem. Jeśli chcesz ograniczyć możliwość dodawania, ustaw dla PHP-FPM zmienną środowiskową `MATH_MATCH_ALLOW_PUBLIC_CREATION=0` (np. w konfiguracji puli FPM, używając `env[MATH_MATCH_ALLOW_PUBLIC_CREATION] = 0` i restartu FPM). Edycja i usuwanie zawsze wymagają admina.

### Przeniesienie storage poza katalog aplikacji (opcjonalnie)

Można ustawić zmienną PHP-FPM `MATH_MATCH_STORAGE=/var/lib/math-match` i przenieść tam bazę. Katalog musi istnieć, być zapisywalny przez użytkownika PHP-FPM i nie znajdować się w katalogu publicznym. Tej samej zmiennej trzeba użyć przy poleceniach CLI. Dla prostej instalacji domyślna ścieżka poza `public/` wystarcza.

Przy **nowej instalacji** z zewnętrznym katalogiem danych przygotuj go jawnie:

```bash
sudo mkdir -p /var/lib/math-match
sudo chown www-data:www-data /var/lib/math-match
sudo chmod 750 /var/lib/math-match
sudo -u www-data env MATH_MATCH_STORAGE=/var/lib/math-match php /var/www/math-match/bin/admin.php set-password
```

Przy istniejącej instalacji nie wskazuj pustego katalogu zamiast dotychczasowej
bazy. Najpierw zaplanuj przeniesienie poprawnej kopii i konfiguracji CLI/PHP-FPM.
Aplikacja nie tworzy samodzielnie dowolnych katalogów ani nie zmienia ich uprawnień.

## Kopie zapasowe

Przy działającej stronie **nie kopiuj na ślepo** samego pliku `.sqlite` poleceniem `cp`, bo SQLite może trzymać dane w pliku WAL. Zamiast tego użyj polecenia SQLite `.backup`:

```bash
sudo mkdir -p /var/backups/math-match
sudo chown www-data:www-data /var/backups/math-match
sudo chmod 700 /var/backups/math-match
sudo -u www-data sqlite3 /var/www/math-match/storage/math_match.sqlite ".backup '/var/backups/math-match/quiz-$(date +%F).sqlite'"
```

Rób regularne kopie również **poza VPS** (np. do zaszyfrowanego archiwum). Można wykorzystać cron do codziennej kopii. Kopie powinny być przechowywane z ograniczonymi uprawnieniami, bo zawierają też hash hasła administratora.

## Aktualizacja i przenoszenie

Możesz aktualizować pliki `public/`, `src/`, `bin/`. **Nie nadpisuj ani nie usuwaj katalogu `storage/`.** Po przeniesieniu na inny serwer przenieś również bazę SQLite z poprawnie wykonanej kopii `.backup`.

### Aktualizacja mechanizmu sesji administratora

Po zatwierdzeniu wdrożenia wykonaj kopię SQLite zgodnie z instrukcją powyżej.
Zaktualizuj razem `src/lib.php`, `public/index.php` i `bin/admin.php`, unikając
obsługi żądań przez mieszaną wersję kodu. Uwzględnij odświeżenie OPcache zgodnie
z konfiguracją PHP-FPM. Nie zastępuj bazy plikiem z nowej instalacji.

Sam mechanizm sesji administratora nie wymaga resetu hasła. Rozbudowa profili wymaga migracji schematu opisanej w `docs/ROZBUDOWA.md`. Sesje sprzed aktualizacji
stracą uprawnienia i wymagają ponownego logowania; quizy pozostają bez zmian.
Sesja przechowuje skrót SHA-256 hasha zweryfikowanego przy logowaniu, a serwer
porównuje go z aktualną wartością `admin_hash` przy każdym sprawdzeniu uprawnień.
Wykorzystuje to istniejący, atomowy zapis hasła bez osobnego licznika w bazie.
Nie należy przywracać historycznej wartości `admin_hash` jako metody zmiany hasła.
Po odtworzeniu starej kopii bazy ustaw hasło ponownie, aby unieważnić również
sesje odpowiadające przywróconemu hashowi. Cofnięcie kodu do poprzedniej wersji
usuwa nowe zabezpieczenie; nie jest bezpiecznym sposobem przywrócenia dostępu admina.

Jedynym plikiem w `storage/`, który należy dodać do Git, jest pusty `.gitkeep`.
Reguły `.gitignore` obejmują cały katalog oraz pliki SQLite i ich pliki pomocnicze
również poza nim. Nie dodawaj baz, kopii, eksportów ani sekretów przez `git add -f`.

## Wymagania

- PHP >= 8.1 z `pdo_sqlite`, `session`, `json`, `openssl` (do hashowania hasła używane jest `password_hash` / `password_verify`).
- Serwer WWW: nginx + PHP-FPM, Apache + PHP albo `php -S` lokalnie.
- Trwale zapisywalny katalog `storage/`.
- HTTPS dla bezpieczeństwa hasła i sesji administratora.
- JavaScript w przeglądarce.

## Test lokalny

Gdy masz SQLite dla PHP, utwórz osobny katalog danych do testów:

```bash
export MATH_MATCH_STORAGE="$(mktemp -d)"
php bin/migrate.php
php -S 127.0.0.1:8080 -t public
```

Testy interfejsu wykonuje użytkownik, otwierając `http://127.0.0.1:8080`.
W przypadku uruchomienia z innego katalogu projektu sprawdź `cd` i ścieżki.

### Testy bez przeglądarki

Wymagania testowe: PHP z `pdo_sqlite`, Python 3 i Git. Nie są to dodatkowe
zależności aplikacji na produkcji. Z katalogu projektu uruchom:

```bash
python3 tests/run.py
php -l src/lib.php
php -l public/index.php
php -l bin/admin.php
php -l tests/auth.php
```

Opcjonalnie ustaw `PHP_BINARY` na ścieżkę właściwej wersji PHP. Testy tworzą
tymczasowe bazy, hasła i katalogi sesji, uruchamiają lokalny serwer HTTP wyłącznie
na `127.0.0.1` i sprzątają po zakończeniu. Nie korzystają z przeglądarki ani OVH.
Sprawdzają dwie niezależne sesje, rotację hasła, odrzucanie dawnych uprawnień,
ponowne logowanie, zachowanie quizów, reguły ignorowania i inicjalizację danych.
Test świeżej instalacji klonuje lokalny HEAD i nakłada jawnie wskazane pliki
bieżącej poprawki (bez danych storage), ponieważ zmiany mogą nie być jeszcze
zatwierdzone. Nie wykonuje commita ani pusha.

## Struktura projektu

```text
math-match-ovh/
├── public/
│   ├── index.php             # HTML + zabezpieczone API
│   └── assets/
│       ├── app.css           # RWD: iPhone, iPad, desktop
│       └── app.js            # dopasowywanie i edycja
├── src/lib.php               # SQLite, walidacja i limity
├── bin/admin.php             # konfiguracja/zmiana hasła admina (CLI)
├── storage/                  # TU jest trwała baza quizów — nie publikuj!
├── deploy/nginx-example.conf
└── README.md
```

### Uwaga o starej wersji HTML

Jeśli masz quizy dodane w poprzednim, jednoplikowym `math_match.html`, były zapisane w `localStorage` tej przeglądarki. Nie przenoszą się automatycznie. W tej wersji możesz utworzyć je ponownie; nowe zestawy są już centralnie zapisywane na serwerze.

## Profile, postępy, testy i migracja schematu 1

Nowe wydanie wymaga **jawnego uruchomienia `php bin/migrate.php` przed obsługą
żądań i przed pierwszym ustawieniem hasła administratora**. Dotychczasowe
instrukcje inicjalizacji przez otwarcie strony nie dotyczą tej wersji. Nowa
instalacja ma pustą bibliotekę; istniejące zestawy i ustawienia pozostają.

Pełna [dokumentacja rozbudowy](docs/ROZBUDOWA.md) opisuje model, API, bezpieczny
backup SQLite, migrację, ręczne wdrożenie OVH, rollback i checklistę urządzeń.
Profile korzystają z kodu gracza i sześciocyfrowego PIN-u; ranking wymaga
opcjonalnej decyzji opiekuna. Nauka zapisuje postęp, a osobny test pozwala
poprawiać połączenia do zatwierdzenia. Każda pauza wyklucza próbę z rankingu.

Testy backendu i HTTP na izolowanych bazach: `python3 tests/run.py`. Testy
przeglądarkowe pozostają do ręcznego wykonania przez użytkownika.

## Gra jako Gość

Bez profilu można korzystać z Nauki oraz Testu z wynikiem, czasem i pauzą.
Na ekranie startowym „Graj jako Gość” otwiera porównanie możliwości; dopiero
„Kontynuuj jako Gość” prowadzi do biblioteki. Późniejsze przechodzenie między
quizami nie powtarza porównania. Logowanie i rejestracja mają osobne przyciski.

Nauka Gościa działa w pamięci strony, a jedna bieżąca próba testowa w tymczasowej
sesji PHP. Wyniki nie trafiają do SQLite, historii ani rankingu i nie są
przenoszone po założeniu profilu. Ranking nadal wymaga zalogowanego profilu.
Nie jest potrzebna nowa migracja bazy.

[Dokumentacja Gościa i checklista ręczna](docs/GOSC.md) opisuje retencję stanu,
API, izolację danych oraz testy na iPhone/iPad/macOS. Testy bez przeglądarki:
`python3 tests/run.py`.
