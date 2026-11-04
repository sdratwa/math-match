# Math Match — quizy zapisane na serwerze OVH

Gotowa aplikacja **PHP 8.1+ + SQLite + JavaScript**, bez Composer, Node i bez zewnętrznych serwisów.

## Funkcje

- Biblioteka wspólnych zestawów: po otwarciu na iPhonie, iPadzie i komputerze widać te same quizy.
- Gracz łączy pojęcia po lewej z opisami po prawej. Dobra para znika, błędna robi się czerwona i wydaje „buuu” (zależnie od ustawień dźwięku urządzenia).
- Każdy może **utworzyć nowy zestaw**, który jest zapisywany na stałe w SQLite na OVH.
- **Tylko administrator**, po podaniu hasła, może edytować i usuwać istniejące zestawy.
- Obsługa ekranu dotykowego, responsywny wygląd, przyciski do powtórki i wyłączania dźwięku.
- Dwa przykładowe zestawy startowe: „Number sequences” oraz „Number types”.
- Ochrona przed SQL injection, XSS, CSRF, podstawowe limity żądań i bezpieczeństwo sesji.

**Ważne:** quizy przechowuje plik `storage/math_match.sqlite`, nie `localStorage` przeglądarki. Nie usuwaj tego pliku przy aktualizacji! Przechowuj kopie zapasowe. Nie jest to system kont graczy ani rejestr wyników — zapisywane są *quizy*, nie postępy konkretnych uczniów.

## Instalacja na OVH VPS (Debian 13 / nginx / PHP 8.4)

Zakładamy, że masz SSH oraz domenę/subdomenę wskazującą na VPS, np. `quiz.twojadomena.pl`.

### 1. Rozpakuj pliki

Prześlij `math-match-ovh.zip` na serwer (SFTP/scp), np. do `/tmp`, a następnie:

```bash
sudo mkdir -p /var/www/math-match
sudo unzip /tmp/math-match-ovh.zip -d /var/www/math-match
```

W folderze powinny być bezpośrednio: `public/`, `storage/`, `src/`, `bin/`, `deploy/`, `README.md`.

### 2. SQLite i prawa zapisu

```bash
sudo apt update
sudo apt install php8.4-sqlite3 sqlite3
sudo systemctl restart php8.4-fpm
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
sudo -u www-data php /var/www/math-match/bin/admin.php set-password
```

Wpisz dwa razy własne hasło (min. 12 znaków). Hasło nie jest trzymane w jawnym tekście — zapisywany jest jego bezpieczny hash. Aby zmienić hasło, uruchom to samo polecenie ponownie.

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

Otwórz `https://quiz.twojadomena.pl`. Przy pierwszym uruchomieniu pojawią się 2 przykładowe zestawy. Nowe zestawy zapiszą się w `/var/www/math-match/storage/math_match.sqlite`.

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

## Wymagania

- PHP >= 8.1 z `pdo_sqlite`, `session`, `json`, `openssl` (do hashowania hasła używane jest `password_hash` / `password_verify`).
- Serwer WWW: nginx + PHP-FPM, Apache + PHP albo `php -S` lokalnie.
- Trwale zapisywalny katalog `storage/`.
- HTTPS dla bezpieczeństwa hasła i sesji administratora.
- JavaScript w przeglądarce.

## Test lokalny

Gdy masz SQLite dla PHP:

```bash
php -S 127.0.0.1:8080 -t public
```

Następnie otwórz `http://127.0.0.1:8080`. W przypadku uruchomienia z innego katalogu projektu sprawdź `cd` i ścieżki.

## Struktura projektu

```text
math-match-ovh/
├── public/
│   ├── index.php             # HTML + zabezpieczone API
│   └── assets/
│       ├── app.css           # RWD: iPhone, iPad, desktop
│       └── app.js            # dopasowywanie i edycja
├── src/lib.php               # SQLite, walidacja, przykładowe quizy
├── bin/admin.php             # konfiguracja/zmiana hasła admina (CLI)
├── storage/                  # TU jest trwała baza quizów — nie publikuj!
├── deploy/nginx-example.conf
└── README.md
```

### Uwaga o starej wersji HTML

Jeśli masz quizy dodane w poprzednim, jednoplikowym `math_match.html`, były zapisane w `localStorage` tej przeglądarki. Nie przenoszą się automatycznie. W tej wersji możesz utworzyć je ponownie; nowe zestawy są już centralnie zapisywane na serwerze.
