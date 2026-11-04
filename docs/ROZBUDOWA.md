# Profile, nauka i testy Math Match

## Uruchomienie lokalne

PHP >= 8.1 z PDO SQLite, docelowo 8.4. SQLite musi obsługiwać JSON i funkcje
okienkowe (zalecane >= 3.38). Bez Composera, Node na produkcji i usług zewnętrznych.

```sh
export MATH_MATCH_STORAGE="$(mktemp -d -t math-match-local)"
php bin/migrate.php
php bin/admin.php set-password
php -S 127.0.0.1:8080 -t public
```

Hasło podawaj wyłącznie na interaktywnym wejściu. Biblioteka nowej instalacji
jest pusta. Migracja nie odtwarza przykładów. Zapamiętanie urządzenia wymaga HTTPS;
lokalnie na HTTP można sprawdzać zwykłą sesję. Nie uruchamiaj testów na istniejącym
`storage/`. Testy tworzą i usuwają własne katalogi tymczasowe:

```sh
python3 tests/run.py
php -l src/lib.php
php -l src/migrations.php
php -l src/domain.php
php -l src/profile-api.php
php -l public/index.php
php -l bin/migrate.php
php -l bin/admin.php
node --check public/assets/app.js
```

## Model i migracja 0 → 1

`PRAGMA user_version` wyznacza wersję schematu. `bin/migrate.php` bierze blokadę
`BEGIN IMMEDIATE`, sprawdza integralność, wykonuje DDL i przeniesienie danych w
jednej transakcji. Błąd wycofuje także DDL. Ponowne uruchomienie wersji 1 nic nie
zmienia. Nowszy schemat jest odrzucany. Zwykłe połączenie wymaga schematu 1.

Dotychczasowe `settings`, `rate_limits` i quizy pozostają. `quizzes` otrzymuje
`archived_at` i `revision`. Każda stara para dostaje losowy 128-bitowy identyfikator;
pojęcie i definicja nie zmieniają się. `quiz_versions` przechowuje niezmienne JSON-y
par i numer wersji. Zmiana nazwy lub kolejności identycznych par nie tworzy nowej
wersji. Zmiana znaczenia nadaje nowe ID, więc stare opanowanie nie przechodzi na
nowy materiał. Aktualizacja quizu wymaga numeru `revision` z bootstrapu.

- `profiles`: kod 48-bitowy (12 znaków szesnastkowych), ksywka, avatar, hash PIN-u,
  zgoda domyślnie wyłączona, wersja autoryzacji, daty. Kod nie jest sekretem.
- `profile_tokens`: wyłącznie SHA-256 losowych tokenów; urządzenie 256 bitów/30 dni,
  parowanie 80 bitów/10 minut. Parowanie jest jednorazowe i atomowe. Token urządzenia
  obraca się przy odtworzeniu sesji; cookie Secure/HttpOnly/SameSite=Strict, ścieżka `/`.
- `sessions`: wspólna tabela sesji nauki i prób testowych, snapshot wersji,
  klucz idempotencji, status, rewizja, czas serwerowy, odpowiedzi JSON i wynik.
- `learning_events`: odpowiedzi, pierwsza próba i unikalny klucz zdarzenia w sesji.
- `progress`: agregat kontaktów (pierwsze próby w sesjach), sukcesów, błędów,
  statusu i historii wcześniejszego opanowania, po profilu i trwałym ID pary.

Usunięcie profilu kaskadowo usuwa tokeny, próby, zdarzenia i postępy. Quiz jest
archiwizowany, a jego wersje pozostają dla historii. Nie ma migracji w dół: rollback
polega na odtworzeniu spójnej kopii i odpowiadającego jej kodu.

## Sesje, czas i ranking

Profil i administrator mają oddzielne klucze w sesji PHP. Profil wygasa po 12
godzinach; token urządzenia może odtworzyć dostęp. Reset PIN-u lub unieważnienie
sesji podnosi `auth_version` i usuwa wszystkie tokeny. Przełączenie przez logowanie
usuwa token poprzedniego urządzenia. PIN jest hashowany algorytmem PASSWORD_DEFAULT.
Limity: 8 prób/kod/15 minut, dodatkowo 20 operacji logowania/IP/15 minut, 5 nowych
profili/IP/godzinę i 5 kodów parowania/IP/10 minut. Liczniki są transakcyjne.

Nauka nalicza pierwszą próbę dla danego pojęcia raz w sesji. Dwie udane pierwsze
próby w różnych sesjach dają opanowanie. Błąd przy pierwszym kontakcie po opanowaniu
zeruje licznik odzyskiwania i oznacza „Do powtórki”. Historia pozostaje. Powtórka
wybiera nieopanowane pary aktualnej wersji; przy mniej niż dwóch proponuje cały quiz.
Sesja powtórki zachowuje pełny snapshot; pozostałe pary można dokończyć po wznowieniu.

Test zapisuje połączenia na serwerze po każdej zmianie. `revision` zapobiega
nadpisaniu przez drugi klient. Zatwierdzenie jest nieodwracalne i idempotentne.
Przypisania muszą być pełną bijekcją identyfikatorów par. Serwer ocenia względem
wersji próby, nawet jeśli quiz zmieniono w trakcie.

Klient wysyła heartbeat co 15 sekund, bez osobnego rejestru tych zdarzeń. Przerwa
ponad 45 sekund automatycznie pauzuje próbę przy następnym żądaniu. Nieznany czas
od ostatniej aktywności jest wtedy pomijany. Odświeżenie i wznowienie przez listę
również oznacza pauzę. `visibilitychange` próbuje zgłosić ją wcześniej. Czas jest
liczony z serwerowych sekund; zegar JS jest tylko prezentacją. Krótkie przerwy,
których klient nie zgłosi i które nie przekroczą 45 sekund, mogą pozostać niewykryte;
nie przyspieszą wyniku, ponieważ czas przerwy wtedy się nalicza. Ranking ma cel
motywacyjny, nie gwarantuje odporności na oszukiwanie przez znajomość odpowiedzi.

Ranking: aktualna wersja aktywnego quizu, najlepsza ukończona próba bez pauzy,
wyłącznie profile ze zgodą. Kolejność: wynik malejąco, czas, data, ID rosnąco.
Wycofanie zgody usuwa widoczność natychmiast. Odpowiedź rankingu nie zawiera ID
profili, kodów graczy ani szczegółowej historii.

## API

`GET index.php?api=bootstrap`: biblioteka, revision quizów, uprawnienia, własny
profil i CSRF. Wszystkie pozostałe operacje: POST JSON, do 100000 bajtów,
`X-CSRF-Token` z aktualnej sesji. Zachowano `login/logout/create/update/delete`.
Żądanie aktualizacji zestawu zawiera `id`, `revision`, `title`, `pairs`.

| Operacja | Dane / wynik |
|---|---|
| `profile.register` | nickname, avatar, pin, pin_repeat, consent (bool), remember (bool) |
| `profile.login` | code, pin, remember; kod i PIN, nigdy ksywka |
| `profile.logout` | usuwa bieżącą sesję profilu i token urządzenia |
| `profile.update` | nickname, avatar, consent |
| `profile.preferences` | sound (bool), preferencja dźwięku zapisana na profilu |
| `profile.revoke` | unieważnia wszystkie urządzenia i sesje profilu |
| `profile.pair` | zwraca jednorazowy kod do ręcznego przepisania |
| `profile.pair-use` | code, opcjonalne remember |
| `attempt.start` | id quizu, mode=learn/test, request_key 16–100 znaków |
| `attempt.list` | maks. 20 niedokończonych własnych sesji |
| `attempt.get` | attempt_id; test zostaje zapauzowany |
| `attempt.answer` | attempt_id, term, definition, event_key; tylko nauka |
| `attempt.save/finish` | attempt_id, revision, answers: obiekt termID → definitionID |
| `attempt.pause/resume/heartbeat` | attempt_id, revision |
| `stats` | własne postępy, ostatnie 100 sesji i odpowiedzi, agregaty, najlepsze wyniki |
| `leaderboard` | id quizu; maks. 100 pozycji |
| `admin.list` | search, offset (strony po 50), sort=name/activity |
| `admin.stats` | id profilu |
| `admin.update` | id, nickname, avatar, consent |
| `admin.pin` | id, pin; unieważnia wszystkie sesje |
| `admin.revoke` | id |
| `admin.delete` | id, confirm=true |

Operacje `admin.*` wymagają administratora; pozostałe prywatne zasoby zawsze
wybierają profil z uwierzytelnionej sesji. Przekazane ID innego profilu nie zastępuje
tego sprawdzenia. Błędy walidacji/dostępu nowego API mają status 422 i bezpieczny
komunikat. Starsze API zachowuje 401/403/404/429. Awaria wewnętrzna zwraca 500 bez
szczegółów. Powtórz identyczne żądanie z tym samym kluczem po utracie odpowiedzi;
po konflikcie rewizji wznów próbę. Nie zmieniaj klucza nowej sesji przy retry.

## Ręczne wdrożenie na OVH — wymaga osobnej decyzji

Poniższa procedura jest instrukcją, nie wykonanym wdrożeniem. Ścieżki są
neutralnymi przykładami; należy podstawić rzeczywiste katalogi i konto PHP-FPM.
Nie wysyłaj lokalnego `storage/`.

1. Przygotuj osobny katalog wydania z przejrzanym kodem oraz zachowaj poprzednie
   wydanie. Sprawdź PHP 8.4, PDO SQLite, SQLite >=3.38, HTTPS, katalog publiczny
   wyłącznie `public/`, i uprawnienia. Kod tylko do odczytu dla PHP-FPM.
2. Włącz okno serwisowe w swojej konfiguracji nginx; zatrzymaj zapisy wszystkich
   procesów aplikacji. Zachowaj konfigurację i ścieżkę poprzedniego wydania.
3. Wykonaj spójny backup przez SQLite, poza katalogiem kodu/publicznym. Użyj
   nowej nazwy pliku, nigdy nie nadpisuj istniejącej kopii. Konto wykonujące
   backup musi mieć minimalne uprawnienia (katalog 0700, plik 0600).

```sh
umask 077
sqlite3 /srv/math-match-data/math_match.sqlite '.backup /srv/math-match-backups/przed-schematem-1.sqlite'
sqlite3 /srv/math-match-backups/przed-schematem-1.sqlite 'PRAGMA integrity_check;'
sqlite3 /srv/math-match-data/math_match.sqlite 'SELECT COUNT(*) FROM quizzes; PRAGMA user_version;'
```

4. W katalogu nowego wydania wykonaj kontrolę składni opisaną wyżej. Testy
   automatyczne uruchamiaj wcześniej na osobnym środowisku, nigdy na tej bazie.
5. Wykonaj świadomie migrację, wskazując zachowany katalog danych:

```sh
MATH_MATCH_STORAGE=/srv/math-match-data php bin/migrate.php
sqlite3 /srv/math-match-data/math_match.sqlite 'PRAGMA integrity_check; PRAGMA foreign_key_check; PRAGMA user_version; SELECT COUNT(*) FROM quizzes;'
```

   Wymagane: `ok`, brak błędów FK, wersja 1, niezmieniona liczba starych quizów.
   Przejrzyj kilka starych treści w aplikacji po przełączeniu. Nie publikuj
   zawartości bazy ani hashy z settings. Błąd = przerwij, nie wznawiaj ruchu.
6. Przełącz katalog wydania w dotychczasowym mechanizmie wdrożeniowym; zachowaj
   `MATH_MATCH_STORAGE` i `MATH_MATCH_ALLOW_PUBLIC_CREATION`. Nie resetuj hasła.
   W razie potrzeby odśwież PHP-FPM/OPcache zgodnie z konfiguracją serwera.
7. Wyłącz okno serwisowe po sprawdzeniu odczytu biblioteki, logowania i monitoringu
   błędów. Testy tworzenia profili i zapisu wykonaj na stagingu z syntetycznymi
   danymi. Nie testuj limitów ani obciążenia na produkcji.

## Wycofanie

Zatrzymaj ruch i wszystkie procesy używające bazy. Zachowaj spójną kopię aktualnego
stanu osobno, ponieważ odtworzenie starej kopii utraci późniejsze postępy. Przenieś
cały aktualny katalog danych do zabezpieczonego katalogu awaryjnego; nie nakładaj
starego pliku na bazę z aktywnymi WAL/SHM. Utwórz nowy katalog danych z właściwym
właścicielem i trybem, odtwórz kopię przez SQLite do nowego pliku:

```sh
sqlite3 /srv/math-match-data/math_match.sqlite '.restore /srv/math-match-backups/przed-schematem-1.sqlite'
sqlite3 /srv/math-match-data/math_match.sqlite 'PRAGMA integrity_check; PRAGMA user_version;'
```

Przywróć odpowiadające kopii poprzednie wydanie kodu i konfigurację, sprawdź
uprawnienia oraz bibliotekę, dopiero potem uruchom procesy i ruch. Kopie zawierają
hash administratora, a po migracji także dane dzieci: nie trafiają do Git, logów
ani publicznego katalogu. Ustal okres retencji kopii i bezpieczne usuwanie.

## Testy ręczne — wykonuje użytkownik

Na iPhone Safari, iPad Safari i macOS Chrome, na syntetycznym środowisku HTTPS:

1. Załóż dwa profile z identyczną ksywką, różnymi kodami. Sprawdź brak zgody
   domyślnie, walidację powtórzenia PIN-u i avatar. Zapisz kod, wyloguj się,
   zaloguj na drugim urządzeniu. Błędny PIN nie może ujawniać istnienia kodu.
2. Zapamiętaj urządzenie, zamknij przeglądarkę, wróć. Wyloguj i sprawdź, że
   następny profil wymaga kodu i PIN-u. Sprawdź jednorazowe parowanie, ponowne
   użycie i wygaśnięcie po 10 minutach.
3. Nauka: poprawna i błędna para, zielony/czerwony komunikat także przy wyciszeniu,
   dźwięki po dotknięciu, restart. W dwóch osobnych sesjach odpowiedz poprawnie
   za pierwszym razem, potem raz błędnie i sprawdź „Do powtórki”. Odświeżenie
   i wznowienie nie nalicza kolejnego sukcesu. Sprawdź powtórkę jednego pojęcia.
4. Test: tap pojęcie → tap definicja, połączone karty bez oceny, rozłączenie,
   nowe przypisanie, zakończenie wyłącznie po wszystkich parach. Sprawdź wynik,
   poprawne odpowiedzi, historię, najlepszy wynik i prezentację zmian w czasie.
5. Pauza ręczna, zmiana aplikacji, blokada iPhone'a, zamknięcie karty bez eventu,
   utrata sieci >45 s, odświeżenie. Po powrocie wznów; wynik pozostaje w historii
   poza rankingiem. Nowy test może się kwalifikować. Otwórz tę samą próbę na
   dwóch urządzeniach: konflikt nie może nadpisać odpowiedzi.
6. Ranking: różne wyniki i czasy, kilka prób jednego profilu, brak zgody,
   wycofanie i ponowne nadanie zgody. Zmień quiz podczas otwartego testu:
   wynik ocenia stara wersja i nie trafia do nowego rankingu.
7. Administrator: lista, wyszukiwanie, sortowanie, strony, szczegóły, zmiana
   avatara/ksywki/zgody, reset PIN-u, unieważnienie urządzeń, usunięcie z
   potwierdzeniem. Profil dziecka pozostaje oddzielny od sesji administratora.
8. Stare funkcje: tworzenie przez gościa zgodnie z flagą, edycja i archiwizacja
   tylko przez administratora, konflikt równoległej edycji, zachowana historia.
9. Na każdym urządzeniu: długie angielskie definicje, pion/poziom, brak przewijania
   poziomego, klawiatura i widoczny fokus, VoiceOver/komunikaty, duży tekst,
   ograniczone animacje, duże cele dotykowe. Dźwięk sprawdź na fizycznym iOS.

## Ograniczenia do uwzględnienia w odbiorze

Nie wykonano testów GUI. Parowanie używa kodu tekstowego bez QR. Historia i
szczegóły nauki pokazują ostatnie 100 pozycji (agregaty obejmują całość), ranking
100 profili; lista administracyjna ma stronicowanie. Nie ma listy nazwanych
urządzeń — można wylogować bieżące albo unieważnić wszystkie. Timer ma dokładność
sekundy i konserwatywnie pomija niewykryty wcześniej odcinek długiej przerwy.

Szybkie przełączanie profili, lokalną listę wyboru i rozszerzony kontrakt wylogowania opisuje [PRZELACZANIE-PROFILI.md](PRZELACZANIE-PROFILI.md).
