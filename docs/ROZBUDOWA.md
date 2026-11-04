# Konta, schemat i API

## Czysta instalacja

`bin/init.php` rezerwuje plik przez wyłączne utworzenie (`fopen` tryb `x`),
a `initializeDatabase()` wykonuje DDL w transakcji `BEGIN IMMEDIATE`, sprawdza
integralność i klucze obce, ustawia `user_version=2`. Istniejąca baza jest
odrzucana. Nie ma migratora, seedów ani konwersji danych. Numer 2 pozwala
odrzucić niezgodną bazę przed obsługą aplikacji. Po błędzie nie usuwamy pliku
automatycznie. Stara baza testowa wymaga świadomej wymiany przez operatora.

| Tabela | Zawartość i ograniczenia |
| --- | --- |
| `settings` | Ustawienia administratora, losowy identyfikator instalacji, zastępczy hash do neutralnej weryfikacji logowania |
| `profiles` | ID AUTOINCREMENT, ksywka, unikalny `nickname_key`, imię wyświetlane, avatar, hash hasła, dźwięk, zgoda, wersja autoryzacji, daty |
| `profile_tokens` | Wyłącznie hash sekretu, właściciel FK, termin ważności, rodzaj; `recovery` jest wydawany przez admina; `device` podtrzymuje zapamiętany dostęp przez cookie HttpOnly na HTTPS |
| `quizzes` | Wspólne zestawy, JSON par, revision, archiwizacja |
| `quiz_versions` | Niezmienne snapshoty, UNIQUE(quiz_id,version), FK do quizu |
| `sessions` | Nauka/Test, właściciel FK, snapshot FK, odpowiedzi, status, czas, pauza, wynik, UNIQUE(profile_id,request_key) |
| `learning_events` | Odpowiedzi w Nauce, UNIQUE(session_id,event_key), kaskada usuwania |
| `progress` | Stan opanowania par, klucz (profile_id,pair_id), kaskada profilu |
| `rate_limits` | Atomowe liczniki prób, klucze skrótów, początek okna |

Ranking jest wyliczany z zakończonych prób, aktualnej wersji quizu i zgody
opiekuna. Nie wymaga dodatkowej tabeli. Każda pauza lub wznowienie Testu ustawia
trwałe wykluczenie. Odpowiedzi i czas ocenia serwer. Zmiana treści par tworzy nowe
ID, sama kolejność zachowuje ID. Zapis zestawu wymaga aktualnego `revision`.

## Normalizacja i hasła

Ksywka: usunięcie skrajnych spacji Unicode, NFC, 1–40 punktów kodowych, bez
znaków sterujących. Klucz: Unicode case folding (`MB_CASE_FOLD`) i ponownie NFC.
Ta sama funkcja działa przy rejestracji, logowaniu, edycji własnej i administracyjnej.
SQLite wymusza UNIQUE na gotowym kluczu; aplikacja obsługuje konflikt także przy
równoległych zapisach. `Ł` i `ł`, prekomponowane i rozłożone litery są równoważne.
Polskie litery nie są usuwane. Imię wyświetlane ma do 40 znaków i nie musi być
unikalne; puste pole przy zapisie przyjmuje ksywkę.

Hasło ma 8–128 punktów kodowych UTF-8. Nie jest przycinane, normalizowane ani
zmieniane na małe litery. Dopuszcza spacje, polskie litery i symbole; odrzuca NUL,
krótką lokalną listę oczywistych haseł i powtórzenie jednego znaku. Lista nie
jest pełną bazą wycieków. Minimum 8 znaków jest kompromisem wygody i bezpieczeństwa.

Preferowany `password_hash(..., PASSWORD_ARGON2ID)` z domyślnymi parametrami PHP.
Fallback: standardowy SHA-384 pełnego wejścia, base64 (64 bajty), następnie
`password_hash(..., PASSWORD_BCRYPT)`, zapis z prefiksem `bcrypt-sha384$`.
`password_verify()` sprawdza odpowiednią postać. Zapobiega to obcinaniu długiego
hasła przez limit bcrypt 72 bajtów. `password_needs_rehash()` aktualizuje parametry
lub przenosi fallback na Argon2id po poprawnym logowaniu. Bez jawnych haseł w
sesjach, logach, URL-ach i pamięci lokalnej.

## Sesje i odzyskiwanie

Cookie sesji: HttpOnly, SameSite=Lax, Secure na HTTPS, strict mode. Rotacja ID
przy logowaniu. Sesja profilu trwa 12 godzin i sprawdza `auth_version` oraz
identyfikator instalacji; reset bazy nie może przywrócić dostępu starej sesji.
Administrator sprawdza niezależną wersję hasha administratora. Zmiana hasła
profilu odwołuje inne sesje; zachowuje ponownie uwierzytelnioną bieżącą sesję.
Wylogowanie kończy tylko bieżące uwierzytelnienie i usuwa token tego urządzenia.
Opcjonalny token urządzenia (losowy, 256-bitowy, SHA-256 w bazie, 30 dni) jest
rotowany przy odtworzeniu sesji. Cookie `mathmatch_account_device` ma Secure,
HttpOnly i SameSite=Strict. Token nie trafia do localStorage. Zmiana hasła lub
odwołanie sesji usuwa wszystkie tokeny profilu. Karty graczy nie są tokenami.

Limity: 20 prób uwierzytelniania/IP/15 minut, 8 prób/znormalizowana ksywka/15 minut,
5 rejestracji/IP/godzinę, 8 prób zmiany danych wrażliwych/profil/15 minut.
Liczniki uwierzytelniania obejmują także udane próby. Błędy logowania nie
rozróżniają nieistniejącej ksywki i złego hasła. Komunikat zajętej ksywki przy
rejestracji jest celowo jawny, bez dodatkowych danych. Limity używają REMOTE_ADDR,
nie ufają przesłanym przez klienta nagłówkom proxy.

Admin po weryfikacji tożsamości wydaje losowy sekret 256-bitowy (10 minut).
W bazie znajduje się SHA-256 sekretu. Wydanie odwołuje sesje i wcześniejsze sekrety,
a użycie atomowo zmienia hash hasła i usuwa tokeny. Sekret nie trafia do URL ani
localStorage, jest wyświetlany tylko w wydzielonym ekranie administratora.
Nie jest kodem codziennego logowania. Admin nie odczytuje hasła dziecka.

## API

`GET index.php?api=bootstrap`: Quizy, własny profil bez hashy, status Gościa,
admina, możliwości tworzenia i CSRF. Pozostałe operacje poniżej to POST JSON z
nagłówkiem `X-CSRF-Token`. Własne operacje przyjmują `expected_profile_id`, aby
odrzucić opóźnione żądanie z karty poprzedniego gracza.

| Akcja | Pola / wynik |
| --- | --- |
| `profile.register` | nickname, opcjonalne display_name, avatar, password, password_repeat, consent, opcjonalne remember (HTTPS); tworzy i loguje |
| `profile.login` | nickname, password, opcjonalne remember (HTTPS), remembered_id do sprawdzenia tożsamości wybranej karty |
| `profile.logout` | opcjonalne attempt_id; atomowo pauzuje własny Test i kończy bieżącą autoryzację |
| `profile.update` | nickname, display_name, avatar, consent, opcjonalne sound, current_password, password, password_repeat |
| `profile.preferences` | sound |
| `profile.revoke` | odwołuje wszystkie sesje profilu |
| `profile.recover` | secret, password, password_repeat; jednorazowy reset i logowanie |
| `admin.list` | search po ksywce/imieniu, offset, sort: name/activity |
| `admin.update` | id i dane profilu, bez hasła |
| `admin.recovery` | id; zwraca jednorazowo secret i expires_in |
| `admin.revoke`, `admin.delete` | id, przy usuwaniu confirm=true |
| `admin.stats` | id profilu; historia i postępy |
| `stats`, `leaderboard` | własne statystyki / id quizu; tylko profil |
| `attempt.list` | własne niedokończone aktywności |
| `attempt.start` | id quizu, mode=learn/test, request_key |
| `attempt.answer` | attempt_id, event_key, term, definition |
| `attempt.get` | attempt_id; pobranie Testu pauzuje go |
| `attempt.save`, `attempt.finish` | attempt_id, revision, answers |
| `attempt.pause`, `attempt.resume`, `attempt.heartbeat` | attempt_id, revision |

API quizów (`create`, `update`, `delete`) i administratora (`login`, `logout`)
pozostaje odrębne. Autoryzacja admina nie nadaje dostępu jako profil.
Zestawy są archiwizowane. Powtórzona rejestracja nie tworzy drugiego konta dzięki
UNIQUE; po utracie odpowiedzi można zalogować się wybraną ksywką i hasłem.

## Rezygnacja z Testu

`attempt.cancel` (POST, CSRF, attempt_id) atomowo usuwa własną niezakończoną
próbę Testu. Nie dotyczy Nauki ani zakończonych wyników. Usunięta próba nie jest
w historii, statystykach, rankingu ani liście wznowienia. Powtórzenie po utracie
odpowiedzi jest bezpieczne. Równoległe zakończenie/rezygnacja są rozstrzygane
transakcją SQLite: zakończonego wyniku nie można później usunąć tą operacją.
`guest.cancel` usuwa tylko bieżący, niezakończony Test Gościa z sesji PHP.
Nie wymaga zmiany schematu. Klient wraca do Quizów dopiero po sukcesie API.

Potwierdzenia używają natywnego elementu HTML `dialog` z tłem przyciemnionym
i rozmytym. Dialogi są kolejkowane, mają przyciski Anuluj/Potwierdź, etykiety
dla czytników i obsługę Escape. Nie używają przeglądarkowego confirm/alert.
