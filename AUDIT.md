# Audyt Math Match — 4 listopada 2026

## Zakres i wynik

Przeanalizowano wszystkie śledzone pliki projektu, stan Git i historię dostępną
lokalnie (jeden commit `6b694bb`). Kod działania aplikacji nie został zmieniony.
Dodano tylko dokumentację. Nie wykonywano wdrożenia, SSH, testów zapisu ani
prób logowania na produkcji. Lokalne testy używały PHP 8.4.17, osobnego storage
w katalogu tymczasowym i syntetycznych danych; dane testowe usunięto.

Aplikacja ma sensowną, prostą architekturę i działające podstawowe zabezpieczenia.
Nie znaleziono w analizowanych ścieżkach obejścia autoryzacji edycji/usuwania,
SQL injection ani renderowania treści quizów jako HTML. Nie jest to gwarancja
braku wszystkich podatności ani audyt konfiguracji VPS.

Najważniejsze ustalenia: stare sesje administratora zachowują uprawnienia po
zmianie hasła; świeży klon nie zawiera wymaganego katalogu storage; konfiguracja
adresów IP za Cloudflare wymaga weryfikacji; równoległe edycje mogą nadpisywać dane.

## Struktura i przepływ danych

| Element | Odpowiedzialność |
| --- | --- |
| `public/index.php` | Jedna strona HTML i router API `?api=...`, sesja, CSRF, uprawnienia |
| `src/lib.php` | SQLite przez PDO, schemat, przykłady, walidacja, limity IP |
| `public/assets/app.js` | Biblioteka, losowanie i dopasowywanie, Web Audio, edytor, logowanie |
| `public/assets/app.css` | RWD, stany par, animacje, reduced motion |
| `bin/admin.php` | Ustawianie hasła przez terminal |
| `deploy/nginx-example.conf` | Przykład nginx i socket PHP 8.4-FPM |
| `README.md` | Instalacja, konfiguracja, kopie i obsługa |

Przeglądarka pobiera `bootstrap` z całą biblioteką, statusem admina i tokenem CSRF.
Rozgrywka odbywa się lokalnie: pary mają identyfikatory według indeksu; prawidłowa
para znika wizualnie i zostaje wyłączona, błędna wyświetla czerwony komunikat
i generuje dźwięk. Wyniki nie są zapisywane. Biblioteka odświeża się przy starcie
strony oraz po wybranych operacjach, nie automatycznie po zmianie w innej przeglądarce.

API: `bootstrap` wymaga GET; `login`, `logout`, `create`, `update`, `delete`
wymagają POST i CSRF. Tworzenie jest publiczne domyślnie, aktualizacja i usuwanie
zawsze sprawdzają `isAdmin()` na serwerze. Nie ma kont użytkowników ani właścicieli zestawów.

## Zapis i trwałość

Baza `storage/math_match.sqlite` może być przeniesiona przez `MATH_MATCH_STORAGE`.
Tabele: `quizzes` (tytuł, JSON par, znaczniki czasu), `settings` (hash admina,
znacznik inicjalizacji), `rate_limits` (liczniki dla hasha akcji i IP).

PDO używa parametrów, wyjątków, WAL i `busy_timeout=5000`. Pojedyncze zapisy
quizów są atomowe. Inicjalizacja przykładów i aktualizacja liczników używają
`BEGIN IMMEDIATE`; lokalnie potwierdzono poprawną współpracę z `commit()` PDO
na PHP 8.4.17. Nie zgłaszamy tu błędu transakcji. Znacznik `seeded` zapobiega
ponownemu dodawaniu przykładów po opróżnieniu biblioteki.

Każde nowe połączenie wykonuje DDL i transakcję inicjalizacji, także dla odczytu.
To zbędna konkurencja o blokadę zapisu przy większym ruchu. Brak wersjonowanych
migracji, wersji rekordów, historii zmian i kosza. Instrukcja `.backup` w README
uwzględnia WAL; nie zweryfikowano harmonogramu kopii ani możliwości odtworzenia na VPS.

## Autoryzacja i bezpieczeństwo

Mocne strony:

- Hasło konfigurowane przez CLI, przechowywany tylko hash; logowanie przez
  `password_verify`. Brak hasła domyślnego w kodzie.
- Sesja cookie: `HttpOnly`, `SameSite=Lax`, tryb ścisły, `Secure` przy rozpoznanym
  HTTPS. Rotacja identyfikatora sesji i CSRF przy logowaniu/wylogowaniu.
- Losowy token CSRF, sprawdzany przez `hash_equals` przed operacjami POST.
- Prepared statements i renderowanie danych przez `textContent`/`value`.
- CSP ograniczająca źródła do własnej domeny, ochrona przed osadzaniem,
  `nosniff`, brak cache odpowiedzi aplikacji, ogólne komunikaty błędów serwera.
- Limity: 8 prób logowania/15 minut/IP oraz 10 utworzeń/godzinę/IP dla gości.
  Licznik logowania obejmuje również logowania poprawne; to może ograniczać
  pracę ze wspólnej sieci szkolnej. CSRF nie jest ochroną przed botem, który pobiera sesję.

Publiczne HEAD do domeny produkcyjnej zwróciło HTTP 200, nagłówki bezpieczeństwa
i cookie z Secure/HttpOnly/SameSite=Lax. Odpowiedź przechodzi przez Cloudflare.
W badanej odpowiedzi HTTPS nie było HSTS. To obserwacja publicznej odpowiedzi,
nie dowód konfiguracji nginx ani zgodności wersji wdrożenia z lokalnym kodem.
Nie odczytywano bazy produkcyjnej. Nie potwierdzono uprawnień plików, aktualizacji
Debiana/PHP, reguł Cloudflare, konfiguracji real IP, backupów ani ochrony originu.

## Walidacja i interfejs

Serwer sprawdza typy pól, poprawność UTF-8, listę 2–40 par, tytuł 2–100 znaków,
pojęcie 1–140, opis 2–700, dodatni identyfikator i limit JSON 100 000 bajtów.
Przyjmuje tylko niepowtarzające się pojęcia po zmianie wielkości liter; pełna
obsługa Unicode zależy od opcjonalnego `mbstring`. Liczenie PHP obejmuje punkty
kodowe, podczas gdy JavaScript i maxlength operują na jednostkach UTF-16.
Przy emoji limity mogą się różnić. Największy dozwolony zestaw z wielobajtowymi
znakami może przekroczyć limit bajtowy całego JSON.

Powtarzające się opisy są akceptowane, chociaż gracz nie potrafi odróżnić takich
kart, a gra uznaje tylko identyczny indeks. Frontend sprawdza mniej reguł niż
backend (np. jedną literę opisu wysyła, serwer odrzuca). Nie osłabia to walidacji
serwerowej, ale daje spóźnione komunikaty.

CSS ma breakpointy dla telefonów, font 16px w formularzach, safe area u dołu,
widoczny fokus i reduced motion. Przyciski są natywnie obsługiwane klawiaturą.
Gra pozostaje dwukolumnowa na telefonie; 40 długich opisów wymaga testów ergonomii.
Znikające karty pozostają w układzie, więc nie skracają planszy. Brakuje zarządzania
fokusem po przejściach i dopasowaniu oraz semantycznego oznaczenia wybranej karty.
Dźwięk używa Web Audio w reakcji na kliknięcie; nie potwierdzono działania na
fizycznym iPhone/iPad ani w trybie cichym. Nie wykonano testów wizualnych przeglądarki.

## Usprawnienia według priorytetu

Nie stwierdzono potwierdzonego P0 w zbadanym zakresie. P1 oznacza wysoką wagę,
P2 planowaną poprawę niezawodności/bezpieczeństwa, P3 dalsze usprawnienia.

| Priorytet | Ustalenie, miejsce i konsekwencja | Propozycja / warunek odbioru |
| --- | --- | --- |
| P1 | `src/lib.php:99–102`, `bin/admin.php:37`: po zmianie hasła stara sesja nadal może edytować. Potwierdzone testem HTTP. Brak jawnego limitu bezczynności i maksymalnego wieku admina; nie należy polegać na GC PHP. | Wersja autoryzacji w bazie i sesji, sprawdzana przy operacjach admina; rotacja hasła unieważnia stare sesje. Test dwóch sesji i czasów wygaśnięcia. |
| P1 | `.gitignore:6–7`, `src/lib.php:18–20`: Git nie śledzi żadnego pliku storage, chociaż wyjątek przewiduje `.gitkeep`. Świeży klon nie tworzy katalogu wymaganego także przez CLI hasła. | Dodać bezpieczny pusty znacznik i udokumentować utworzenie oraz uprawnienia katalogu. Potwierdzić uruchomienie z czystego checkoutu. |
| P1 — weryfikacja | `src/lib.php:161`, przykład nginx: limity bazują na REMOTE_ADDR, produkcja jest za Cloudflare; przykład nie ustawia real IP. Bez właściwej konfiguracji wiele osób współdzieli limit proxy. Faktyczny stan VPS nieznany. | Sprawdzić zaufane zakresy proxy i real IP w nginx, odporność na podszycie nagłówkiem oraz dostęp do originu. Dwa prawdziwe IP mają osobne liczniki. Nie ufać bezwarunkowo X-Forwarded-For/CF-Connecting-IP. |
| P1 — operacyjne | Kopie zawierają także hash admina; istnienia i odtwarzalności backupów nie potwierdzono. | Zweryfikować backup SQLite, szyfrowaną kopię poza VPS, retencję, alert niepowodzenia i próbę odtworzenia poza produkcją. Bez automatycznego wdrożenia. |
| P2 | `public/index.php:134`: aktualizacja wyłącznie po ID; ostatni zapis nadpisuje wcześniejszą edycję innej sesji. | Licznik wersji i warunkowy UPDATE; konflikt zwraca 409 i pozwala zachować niezapisany formularz. Test dwóch edytorów. |
| P2 | `public/assets/app.js:275–279`: zapis i późniejsze odświeżenie są traktowane jako jedna próba. Jeśli zapis się uda, a refresh zawiedzie, użytkownik widzi błąd i ponowienie może utworzyć duplikat. | Oddzielić potwierdzony zapis od błędu odczytu, dodać idempotencję tworzenia. Test utraty odpowiedzi oraz błędu bootstrap po zapisie. |
| P2 | `src/lib.php:104–113`: każdy bootstrap pobiera wszystkie pary wszystkich quizów; publiczne tworzenie nie ma globalnej kwoty. Liczne IP mogą zwiększać bazę i koszt każdego odczytu. | Paginacja metadanych, pobranie par wybranego quizu, monitorowanie rozmiaru i ochrony przed spamem przy zachowaniu publicznego tworzenia. |
| P2 | `src/lib.php:33–76`: DDL i blokada zapisu przy każdym połączeniu, brak migracji. | Oddzielić kontrolowaną inicjalizację/migracje od zwykłego odczytu, utrzymać atomowe liczniki i jednorazowe seedowanie; test współbieżny. |
| P2 | `bin/admin.php:35–37`: 12–200 jest liczone w bajtach, bcrypt uwzględnia tylko pierwsze 72 bajty. Różne syntetyczne hasła z tym samym prefiksem zaakceptowane w teście. | Uzgodnić limit i komunikat z algorytmem lub zastosować wspierane Argon2id; uwzględnić istniejące hashe i bezpieczną migrację. |
| P2 | `src/lib.php:121–155`, `app.js:145`: identyczne definicje mogą dawać błąd dla wizualnie poprawnego dopasowania. Niejednolite limity Unicode frontend/backend. | Ustalić politykę identycznych opisów i wspólne reguły normalizacji/liczenia; test polskich znaków, emoji i granic JSON. |
| P2 | `.gitignore`: chroni storage, .env i część rozszerzeń baz, ale nie np. eksport `.sql`, archiwum `.zip` ani `*.db-wal` poza storage. Lokalna historia nie zawiera bazy ani rozpoznanych sekretów w przeczytanych plikach. | Rozszerzyć ochronę kopii i plików pomocniczych, dodać skan sekretów oraz kontrolę staged diff. Nie traktować ignorowania jako kompletnej ochrony. |
| P2 | Brak testów automatycznych/CI, brak udokumentowanego sprawdzenia urządzeń. | Utrwalić testy API na danych syntetycznych, CI bez wdrożeń, testy Safari/iOS i desktop, sieci oraz przywracania danych. |
| P2 — konfiguracja | Brak HSTS w obserwowanej odpowiedzi; przykład nginx obejmuje HTTP i odsyła do Certbota. | Po sprawdzeniu TLS i przekierowania zaplanować HSTS oraz weryfikację bezpiecznych cookies. Nie włączać includeSubDomains/preload bez analizy innych subdomen. |
| P3 | Brak historii zmian i możliwości cofnięcia usunięcia; bibliotekę w innej sesji odświeża dopiero ponowne pobranie. | Rozważyć kosz/historię, jawne odświeżenie biblioteki, wyszukiwarkę i kategorie przy większej liczbie zestawów. Nie logować sekretów. |
| P3 | Fokus i wybrana karta nie mają pełnej obsługi dostępności; formularz można opuścić z niezapisanymi zmianami. CSS jest mocno skompresowany. | Poprawić fokus i aria-pressed, ostrzeganie o utracie edycji, ergonomię długich plansz, czytelność CSS i wersjonowanie zasobów po zmianach. |

## Wykonane sprawdzenia i ograniczenia

- Składnia wszystkich trzech plików PHP oraz `node --check` JavaScript: poprawna.
- Inicjalizacja SQLite i dwie przykładowe pozycje, transakcje PDO: poprawne.
- Lokalny HTTP: bootstrap, publiczne tworzenie, odczyt drugiego klienta, admin
  login/update/delete/logout, odmowa anonimowej edycji/usunięcia, odmowa bez CSRF:
  zgodne z oczekiwaniami.
- Limity tworzenia i logowania zwracają 429 po wykorzystaniu budżetu.
- Odczyt po zakończeniu serwera z nowego procesu PHP potwierdza trwałość zapisu.
- Walidacja odrzuca błędny typ tytułu i powtórzone pojęcie ASCII; akceptuje
  powtórzone opisy. Nie wykonano pełnej macierzy granic i błędnych danych.
- Potwierdzono zachowanie uprawnień starej sesji po rotacji hasła oraz limit bcrypt.
- Sprawdzono śledzone pliki, lokalną historię i wybrane wzorce ignorowania.
  Nie audytowano zdalnej historii GitHub, innych repozytoriów ani archiwów VPS.
- Nie wykonano testów obciążenia, współbieżności, odtworzenia backupu, fizycznych
  urządzeń ani zmian infrastruktury. Lokalny serwer PHP nie zastępuje testu nginx/FPM.

Źródła techniczne: [PHP password_hash — bcrypt i algorytmy](https://www.php.net/manual/en/function.password-hash.php),
[PHP PDO::beginTransaction — transakcje](https://www.php.net/manual/en/pdo.begintransaction.php).
Wnioski o konkretnym działaniu aplikacji opierają się na kodzie i opisanych testach,
nie na samych ogólnych zaleceniach dokumentacji.
