# Math Match

Gra edukacyjna PHP + SQLite + Vanilla JavaScript: wspólne Quizy, Nauka, Test,
postępy i dobrowolny ranking. Konta używają unikalnej ksywki i hasła; imię
wyświetlane jest opcjonalne. Gość gra bez trwałych wyników. Administrator ma
oddzielne uwierzytelnienie i zarządza zestawami oraz profilami.

To wydanie wymaga **czystej instalacji**. Schemat ma numer **2**, lecz nie jest
migracją: nie odczytuje, nie konwertuje i nie zachowuje poprzedniej bazy.
Usunięcie starej bazy testowej oraz wdrożenie wykonuje użytkownik po osobnej decyzji.

## Wymagania

- Docelowo PHP 8.4; minimalnie PHP 8.1, z `pdo_sqlite`, `intl`, `mbstring`,
  `session`, `json`. `intl` i `mbstring` są wymagane do spójnej normalizacji Unicode.
- nginx + PHP-FPM, HTTPS, katalog danych poza `public/`, zapisywalny wyłącznie
  przez uprawniony proces aplikacji. Kod nie powinien być zapisywalny przez PHP.
- Argon2id preferowany; w środowisku bez niego obsługiwany jest bcrypt z
  przygotowaniem pełnego hasła SHA-384/base64 (opis w dokumentacji kont).
- Python 3, Node i Git służą tylko testom; nie są zależnościami aplikacji.

## Nowa instalacja lokalna

```sh
export MATH_MATCH_STORAGE="$(mktemp -d)"
php bin/init.php
php bin/admin.php set-password
php -S 127.0.0.1:8080 -t public
```

`bin/init.php` tworzy pustą bazę, bez kont, quizów i domyślnych haseł. Odmawia,
jeśli plik już istnieje (nawet pusty). Nie ma opcji automatycznego resetu.
Po błędzie inicjalizacji zbadaj przyczynę; ponowna próba wymaga nowego pustego
katalogu. Otwarcie strony nigdy nie tworzy schematu ani przykładowych danych.
Hasło administratora wprowadź na interaktywnym wejściu, nigdy jako argument CLI.
Obowiązuje dotychczasowa polityka administratora: 12–72 bajty.

Katalog `storage/` jest domyślny. `MATH_MATCH_STORAGE` musi mieć tę samą wartość
w CLI i konfiguracji puli PHP-FPM. Do testów zawsze używaj osobnego katalogu.

## Korzystanie

1. Utwórz profil: ksywka, opcjonalne imię, avatar, hasło i powtórzenie.
   Zgoda na ranking jest domyślnie wyłączona. Po ekranie powitalnym kliknij „Zaczynamy!”.
2. W Quizach wybierz Naukę lub Test. Poprawne pary w Nauce znikają; błędne mają
   czerwony komunikat i dźwięk, jeśli jest włączony i dozwolony przez przeglądarkę.
3. Menu avatara zawiera zmianę gracza, postępy, ustawienia i wylogowanie.
4. „Zapamiętaj urządzenie” zapisuje lokalną **kartę gracza** bez hasła. Na HTTPS
   zapisuje też token bieżącego logowania w cookie Secure/HttpOnly (do 30 dni).
   Jawne wylogowanie usuwa token; każdy wybór karty wymaga hasła.
   Niezaznaczenie opcji nie usuwa wcześniej zapisanej karty; służy do tego
   „Usuń z tego urządzenia”. Sesja trwa 12 godzin; ważny token urządzenia może ją odtworzyć.
   Lokalnie na HTTP zapisywana jest tylko karta, bez tokenu.
5. Niedokończone aktywności można wznowić z karty na początku Quizów.
   Pauza Testu trwale wyklucza próbę z rankingu.
6. Admin otwiera osobny panel. Po potwierdzeniu tożsamości gracza może wydać
   jednorazowy sekret do ustawienia nowego hasła, ważny 10 minut.

Tworzenie, edycja i archiwizacja quizów wymagają zalogowanego administratora.
Przycisk „Nowy zestaw” pojawia się po zalogowaniu jako admin. Dawna zmienna
`MATH_MATCH_ALLOW_PUBLIC_CREATION` nie jest już obsługiwana.
Limity zestawów: tytuł 2–100, pojęcie 1–140, opis 2–700 znaków, 2–40 par,
żądanie JSON do 100 000 bajtów.

## Testy bez przeglądarki

```sh
python3 tests/run.py
node tests/client.cjs
node --check public/assets/app.js
find src public bin tests -name '*.php' -exec php -l {} \;
git diff --check
```

Testy tworzą syntetyczne bazy i sesje w katalogach tymczasowych; lokalny HTTP
nasłuchuje tylko na `127.0.0.1`. Nie dotykają VPS ani istniejącego `storage/`.
JavaScript jest testowany w Node bez DOM i emulacji przeglądarki.
Interfejs, autofill, VoiceOver i dźwięk na fizycznym iOS sprawdza użytkownik.

## Dokumentacja

- [Czyste wdrożenie OVH, backup i wycofanie](docs/WDROZENIE.md)
- [Schemat, konta, hasła i API](docs/ROZBUDOWA.md)
- [Wspólny telefon i izolacja](docs/PRZELACZANIE-PROFILI.md)
- [Tryb Gościa](docs/GOSC.md)
- [Ręczna checklista iPhone, iPad i Chrome](docs/TESTY-RECZNE.md)

`src/schema.php` i `bin/init.php` definiują instalację; `src/accounts.php` obsługuje
konta, `src/domain.php` reguły nauki i testów, `src/profile-api.php` prywatne API,
`public/index.php` sesje i HTTP, `public/assets/` interfejs. Nie dodawaj baz,
WAL/SHM, kopii, hashy, tokenów, cookies, `.env` ani kluczy do Git.
