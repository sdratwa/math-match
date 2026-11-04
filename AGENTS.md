# Zasady pracy nad Math Match

## Język i zgoda na zmiany

- Wszystkie opisy architektury, dokumentację projektu i instrukcje w tym pliku
  pisz po polsku. Zachowuj oryginalne nazwy plików, identyfikatory kodu, nazwy
  technologii i składnię poleceń.
- Nie zmieniaj istniejących funkcji ani zachowania aplikacji bez wyraźnej zgody
  użytkownika na dany zakres zmian. Samo wykrycie błędu nie upoważnia do naprawy.
- Możesz wykonywać analizę statyczną, sprawdzanie składni i testy jednostkowe.
  Testowanie interfejsu w przeglądarce pozostaw użytkownikowi: nie uruchamiaj
  samodzielnie testów ręcznych ani automatycznych w przeglądarce, także bez
  widocznego okna lub z emulacją urządzeń. Możesz przygotować scenariusze dla użytkownika.

## Cel i architektura

Math Match to edukacyjna gra dopasowująca pojęcia do definicji. Produkcja:
https://mathmatch.skycamp.pl, VPS OVH, Debian, nginx, PHP 8.4 i SQLite.

- `public/index.php`: HTML, sesje, nagłówki bezpieczeństwa i API JSON.
- `src/lib.php`: połączenie SQLite, inicjalizacja, walidacja i limity żądań.
- `public/assets/app.js`: biblioteka, gra, formularze i klient API.
- `public/assets/app.css`: responsywny wygląd i animacje.
- `bin/admin.php`: ustawianie hasła administratora przez CLI.
- `deploy/nginx-example.conf`: przykład konfiguracji, nie potwierdzony stan VPS.
- `storage/`: dane wykonania, poza katalogiem publicznym i poza Git.

Zachowuj prosty stos PHP i JavaScript bez frameworka. Dodanie zależności musi
wynikać z konkretnej potrzeby. Nie wprowadzaj przebudowy architektury przy okazji
małej poprawki. PHP 8.4 jest środowiskiem docelowym; README deklaruje PHP >= 8.1,
więc zmianę minimalnej wersji trzeba jawnie uzasadnić i udokumentować.

## Niezmienne wymagania produktu

- Zestawy są wspólne i trwale zapisywane w SQLite na serwerze. Pamięć przeglądarki
  nie może zastąpić serwerowego źródła danych.
- Domyślnie każdy może wybierać i tworzyć zestawy. Respektuj opcję
  `MATH_MATCH_ALLOW_PUBLIC_CREATION`; edycja i usuwanie wymagają administratora.
- Uprawnienia sprawdzaj na serwerze dla każdej operacji, niezależnie od interfejsu.
- Poprawne pary znikają; błędne wywołują czerwony komunikat i dźwięk, jeśli jest
  włączony i przeglądarka na niego pozwala. Komunikat musi działać bez dźwięku.
- Obsługuj iPhone, iPad i komputery, dotyk i klawiaturę. Zachowuj dostępne etykiety,
  widoczny fokus, komunikaty dla czytników ekranu i ograniczanie animacji.
- Nie dodawaj kont uczniów, zapisu wyników ani zbierania danych osobowych bez
  wymagania produktowego.

## Dane i sekrety — reguły bezwzględne

- Nigdy nie umieszczaj produkcyjnej bazy, jej kopii, eksportów, plików WAL/SHM,
  haseł, hashy haseł, tokenów, cookies sesyjnych, kluczy SSH/TLS ani `.env`
  z sekretami w Git/GitHub, PR-ach, logach lub dokumentacji.
- Przykłady konfiguracji mają zawierać wyłącznie neutralne wartości zastępcze.
- Nie kopiuj produkcyjnych danych do testów. Używaj syntetycznych zestawów oraz
  osobnego katalogu tymczasowego wskazanego przez `MATH_MATCH_STORAGE`.
- Przed zatwierdzeniem sprawdź listę plików i różnice przygotowane do zatwierdzenia. `.gitignore` nie chroni
  już śledzonych plików; nie używaj `git add -f` do danych i sekretów.
- Nie nadpisuj ani nie usuwaj produkcyjnego `storage/`. Nie uruchamiaj inicjalizacji,
  resetu hasła ani migracji na produkcji bez decyzji użytkownika.
- Kopie działającej bazy wykonuj przez API kopii zapasowych SQLite lub `.backup`, nie przez
  kopiowanie samego pliku SQLite przy aktywnym WAL. Kopie też zawierają hash admina.
- Zmiany schematu planuj jako wersjonowane migracje z testem zachowania danych,
  kopią zapasową i planem odtworzenia. Nie odtwarzaj przykładów po usunięciu zestawów.
- Katalog publiczny serwera to wyłącznie `public/`. Kod nie powinien być zapisywalny
  przez PHP-FPM; dane i kopie zapasowe wymagają minimalnych uprawnień. Nigdy `chmod 777`.

## API i bezpieczeństwo

- SQL z danymi użytkownika wykonuj przez zapytania parametryzowane.
- Zmiany stanu wymagają POST, poprawnego tokena CSRF i odpowiednich uprawnień.
- Waliduj typy, UTF-8, identyfikatory, długości i liczbę par na serwerze. Limity
  bieżącego kontraktu: tytuł 2–100, pojęcie 1–140, opis 2–700, zestaw 2–40 par,
  JSON do 100 000 bajtów. Zmiany kontraktu synchronizuj z kodem przeglądarkowym i dokumentacją.
- Treści użytkownika wstawiaj jako tekst (`textContent`, `value`), nie HTML.
  Nie osłabiaj CSP, ochrony sesji ani limitów żądań.
- Używaj `password_hash`/`password_verify`; nie przekazuj haseł jako argumentów CLI.
  Uwzględniaj limit bajtów algorytmu oraz unieważnianie sesji po zmianie hasła.
- Wymagaj HTTPS dla admina. Nie ufaj nagłówkom IP/protokołu od dowolnego klienta;
  konfiguracja proxy musi wskazywać zaufane źródła, szczególnie przy Cloudflare.
- Nie zwracaj klientowi wyjątków SQL, ścieżek i sekretów. Nie loguj treści logowania.
- Przy zmianach zapisu sprawdzaj konflikty równoległych edycji, atomowość limitów,
  blokady SQLite i zachowanie przy powtórzeniu żądania po utracie odpowiedzi.

## Weryfikacja i lokalne uruchomienie

Przed wykonaniem PHP korzystającego z bazy utwórz oddzielny katalog testowy i ustaw
`MATH_MATCH_STORAGE` na jego bezwzględną ścieżkę. Ta sama konfiguracja obowiązuje
CLI oraz lokalny serwer. Nigdy nie wskazuj danych produkcyjnych.

Kontrola składni bez połączenia z bazą:

```sh
php -l src/lib.php
php -l public/index.php
php -l bin/admin.php
node --check public/assets/app.js
```

Node służy tu tylko do kontroli składni, nie jest zależnością uruchomieniową aplikacji.
Jeśli zakres zlecenia wymaga lokalnego serwera, uruchamiaj go na `127.0.0.1`,
po ustawieniu testowego katalogu danych. Nie oznacza to zgody na testowanie
interfejsu w przeglądarce.

Dobierz analizę statyczną i testy jednostkowe do zmiany. Poniższa lista wskazuje
również scenariusze integracyjne do zaplanowania; nie stanowi dodatkowego
upoważnienia do ich wykonywania:

- Kod serwerowy: zapis i ponowny odczyt w nowym procesie/sesji, tworzenie, odczyt,
  edycja i usuwanie przez administratora, odmowa operacji
  anonimowych, CSRF, błędny JSON i typy, granice długości, limity, brak rekordu.
- Sesje: logowanie, wylogowanie, wygaśnięcie, zmiana hasła i stare sesje.
- SQLite: współbieżne żądania, zachowanie po restarcie, migracja i odtworzenie kopii.
- Interfejs — scenariusze do wykonania wyłącznie przez użytkownika:
  poprawna/błędna para, restart, dźwięk i wyciszenie, utrata połączenia,
  błędy zapisu, długie treści, klawiatura oraz Safari na iPhone/iPad i przeglądarki
  na komputerach.

Testy przeglądarkowe w emulacji nie potwierdzają działania dźwięku na fizycznym iOS.
W raporcie rozdziel wyniki wykonanych testów, analizę statyczną i niewykonane testy.

## Produkcja i zakres zmian

- Nie wykonuj automatycznych wdrożeń na OVH. Każde wdrożenie wymaga osobnej,
  jednoznacznej decyzji użytkownika. Zgoda na zmianę kodu nie jest zgodą na wdrożenie.
- Bez tej decyzji nie przesyłaj plików na VPS, nie uruchamiaj zdalnego pull,
  migracji, restartów usług ani zmian nginx/PHP-FPM/DNS/Cloudflare.
- W ramach zatwierdzonego zakresu przygotuj konkretną zmianę, wyniki dozwolonych
  testów, plan kopii zapasowej, wdrożenia i wycofania. Automatyzacja może wykonywać
  analizę statyczną i testy jednostkowe; wdrożenie ma pozostać ręcznie zatwierdzane.
- Nie testuj tworzenia/usuwania quizów, haseł, limitów ani obciążenia na produkcji
  w ramach zwykłego audytu. Używaj lokalnego środowiska z danymi syntetycznymi.
- Zadanie analityczne nie upoważnia do napraw funkcjonalnych. Raportuj problemy
  i propozycje osobno; zmieniaj zachowanie aplikacji dopiero w ramach zleconej pracy.

## Rozbudowa profili i postępów

Zakres produktowy obejmuje profile bez e-maila, PIN, naukę, testy i dobrowolny
ranking. Nie rozszerzaj zbierania danych poza ksywkę, avatar i postępy.

- `src/migrations.php`, `bin/migrate.php`: jawna migracja CLI; zwykłe żądanie
  nie tworzy schematu ani przykładów. Nowa instalacja zaczyna z pustą biblioteką.
- `src/domain.php`: transakcje, wersje quizów, autoryzacja profilu i nauka.
- `src/profile-api.php`: API profili, prób, statystyk i administracji.
- `tests/features.php`: syntetyczna stara baza, migracja i logika domenowa.
- `docs/ROZBUDOWA.md`: model danych, API, wdrożenie i testy ręczne.

Niezmienne snapshoty w `quiz_versions` oceniają historyczne próby. Identyczne
pary zachowują ID przy zmianie kolejności; zmiana treści tworzy nowe ID i nie
przenosi opanowania. Quizy są archiwizowane. Aktualizacja wymaga `revision`.
Każda pauza i wznowienie testu trwale wykluczają go z rankingu. Autoryzacja
administratora nie zastępuje ani nie zmienia profilu dziecka.

## Tryb Gościa

- Wejście jako Gość wymaga ekranu porównawczego i świadomego potwierdzenia.
  Nie powtarzaj ekranu podczas każdej gry; nie wymagaj rejestracji do Nauki/Testu.
- `src/guest-api.php` przechowuje jedną tymczasową próbę w sesji PHP, bez zapisów
  do tabel profili, historii i postępów. Nauka Gościa jest lokalna.
- Ocena i czas są wspólne z profilem (`gradeTest`, `advanceTest`), ale trwały zapis
  należy wyłącznie do ścieżki autoryzowanego profilu. Nie importuj prób Gościa.
- Zachowaj odrębną autoryzację administratora i aktualną politykę odczytu rankingu
  (tylko zalogowane profile). Potwierdzenie Gościa nie nadaje prywatnych uprawnień.
- Nie dodawaj migracji dla stanu tymczasowego. Schemat pozostaje w wersji 1.
- `docs/GOSC.md` zawiera kontrakt, retencję i ręczny odbiór interfejsu;
  `tests/guest.php` oraz testy HTTP sprawdzają logikę bez przeglądarki.
