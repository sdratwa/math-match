# Tryb Gościa

## Zachowanie

Niezalogowany użytkownik zaczyna od wyboru „Graj jako Gość”, „Zaloguj się” lub
„Utwórz profil”. Pierwszy przycisk otwiera osobny ekran porównawczy z dziesięcioma
możliwościami. Dopiero „Kontynuuj jako Gość” aktywuje ten tryb. Można wrócić na
start albo wybrać konkretny formularz logowania/rejestracji. Tabela nie wraca
podczas zmiany quizu, restartu Nauki ani kolejnego Testu.

Gość ma pełną lokalną Naukę oraz Test z serwerową oceną, czasem, zmianą połączeń,
pauzą, wznowieniem i podsumowaniem. Nawigacja pokazuje „Gość” i informację o braku
zapisu wyników. Nie pokazuje prywatnych statystyk, historii ani opanowania.
„Wznów” w Quizach pozwala kontynuować próbę po wyjściu do Quizów lub
formularza w tej samej otwartej stronie. Odświeżenie/zamknięcie strony nie daje
gwarancji wznowienia. Zalogowany profil zachowuje dotychczasowy sposób działania.

**Polityka rankingu pozostaje bez zmian:** odczyt jest dostępny dla zalogowanych
profili. Przycisk „Ranking” wyjaśnia to Gościowi i pozwala wrócić do gry bez
rejestracji. Udział Gościa w rankingu jest zawsze wykluczony.

## Brak trwałych wyników

- Nauka Gościa działa w pamięci strony; nie wysyła odpowiedzi do API nauki.
- Test Gościa przechowuje wyłącznie jedną bieżącą próbę w `$_SESSION['guest_test']`.
  Zwykła blokada sesji PHP serializuje żądania. Próba ma losowe ID i rewizję.
- Żaden endpoint `guest.*` nie dopisuje do `profiles`, `profile_tokens`,
  `sessions`, `learning_events`, `progress` ani tabel quizów. Nie powstaje
  fikcyjny profil. SQLite służy do odczytu quizu oraz liczników limitowania.
- Serwer wybiera aktualną wersję aktywnego quizu i zachowuje snapshot w sesji.
  Edycja lub archiwizacja po rozpoczęciu nie zmienia oceny bieżącego testu.
- Wynik i czas klienta nie są źródłem prawdy. `gradeTest()` i `advanceTest()`
  są wspólne z profilem, ale nie zapisują danych. Osobne wywołanie warstwy
  profilu odpowiada za zapis trwałych prób; Gość nigdy do niej nie przechodzi.
- Identyfikator profilu w treści anonimowego żądania jest ignorowany i nigdy
  nie powoduje przypisania próby. Prywatne endpointy nadal wymagają profilu.

Próba wygasa po 2 godzinach bez obsługi żądania. Ukończona próba jest dostępna
przez 5 minut dla powtórzenia żądania po utracie odpowiedzi. Nowy test zastępuje
poprzedni. Logowanie/rejestracja/parowanie usuwa cały stan Gościa i nie importuje
wyniku. Stan klienta poprzedniego gracza jest również czyszczony. Wygaśnięte dane
są usuwane przy kolejnym żądaniu; fizyczna retencja nieaktywnych plików sesyjnych
zależy od mechanizmu sprzątania PHP. Katalog sesji powinien mieć ograniczone
uprawnienia i działające sprzątanie według konfiguracji serwera. Nie wykonuje się
backupu sesji jako historii gry.

Wybór Gościa nie usuwa autoryzacji administratora. Zalogowany profil musi najpierw
jawnie się wylogować, zanim przejdzie do Gościa. Same uprawnienia administratora
nie nadają dostępu do prywatnych endpointów profilu dziecka.

## API i czas

Nowe operacje POST JSON z aktualnym `X-CSRF-Token`, limitem treści 100000 bajtów:

| Operacja | Dane |
|---|---|
| `guest.enter` | `confirm: true`; świadomy wybór trybu |
| `guest.start` | `id` aktywnego quizu, `request_key` 16–100 znaków; retry z tym samym kluczem zwraca tę samą próbę |
| `guest.get` | `attempt_id`; pobiera własną bieżącą próbę i pauzuje ją przed wznowieniem |
| `guest.save` | `attempt_id`, `revision`, `answers` (mapa ID pojęcia → ID definicji) |
| `guest.pause/resume/heartbeat` | `attempt_id`, `revision` |
| `guest.finish` | `attempt_id`, `revision`, kompletna mapa `answers` |

Limit: 180 żądań Gościa na IP/minutę, dodatkowo 120 rozpoczęć na IP/godzinę.
Pole `guest` w bootstrapie informuje o potwierdzonym trybie. Odpowiedź próby
zawsze ma `guest: true`, `ranking_eligible: false`. Nie zawiera danych profilu.

Czas pochodzi z serwera. Heartbeat co 15 sekund podtrzymuje próbę; przerwa >45
sekund powoduje pauzę bez doliczania nieznanego odcinka czasu. Klient sygnalizuje
ukrycie strony także przez `visibilitychange`, a nie opiera czasu na liczbie
wywołań `setInterval`. Pauza nie nalicza czasu. Powrót do nadal otwartej strony
umożliwia wznowienie, o ile sesja PHP i tymczasowa próba nadal istnieją.

## Weryfikacja bez przeglądarki

`python3 tests/run.py` obejmuje dotychczasowe regresje oraz:

- wejście bez profilu, Quizy, wymagane potwierdzenie i CSRF;
- utworzenie testu, retry, rozłączenie, ponowne przypisanie, pauzę i wznowienie;
- odrzucenie niepełnych, powielonych i nieznanych przypisań;
- serwerowy wynik i czas, ignorowanie podrobionego wyniku i `profile_id`;
- identyczność zawartości tabel danych przed i po grze Gościa (poza licznikami);
- odmowę zapisu lokalnej Nauki przez chronione API i dostępu do prywatnych danych;
- izolację między dwiema sesjami, snapshot starej wersji i archiwizację;
- rejestrację oraz logowanie po grze bez importowania historii;
- zachowanie administratora podczas gry Gościa i logowania profilu;
- deterministyczne testy zegara, przerwy, wygaśnięcia i idempotencji.

Interakcje DOM, wygląd porównania, lokalna Nauka i dźwięk wymagają poniższego
odbioru ręcznego. Kontrola składni JS i analiza ścieżki bez zapisu nie zastępują
uruchomienia interfejsu na urządzeniu.

## Checklista ręczna

Na osobnym środowisku z syntetycznymi quizami wykonaj na iPhone Safari,
iPad Safari oraz macOS Chrome:

1. Otwórz nową sesję bez profilu. Sprawdź trzy opcje startowe. „Graj jako Gość”
   pokazuje porównanie, a nie Quizy. Wróć na start. Sprawdź osobno przyciski
   rejestracji i logowania z obu ekranów oraz możliwość powrotu.
2. Przeczytaj wszystkie 10 wierszy. Sprawdź pion/poziom, mały ekran i powiększony
   tekst: bez poziomego przewijania strony, czytelna zgoda opiekuna przy rankingu,
   pionowe przewijanie całej strony, wygodne przyciski i bezpieczne obszary ekranu.
3. Wybierz „Kontynuuj jako Gość”. Sprawdź nagłówek, komunikat o braku zapisu oraz
   brak prywatnych sekcji. Zmieniaj quizy i tryby — tabela nie pojawia się ponownie.
4. Nauka: poprawna para znika, błędna jest czerwona i daje „buuu”, można ponawiać,
   wyciszać, restartować, a zakończenie pokazuje gratulacje. Dźwięk sprawdź na
   fizycznym iOS. Nie powinny pojawiać się statystyki ani statusy opanowania.
5. Test: tap → tap, połączone karty bez oceny, rozłączenie i zmiana odpowiedzi.
   „Zakończ test” działa dopiero po wszystkich parach. Wynik, czas i poprawne
   odpowiedzi są widoczne po zatwierdzeniu. Można ponowić test bez rejestracji.
6. Pauzuj i odczekaj minutę. Wznów: czas pauzy nie nalicza się. Przełącz aplikację,
   zablokuj ekran, wróć do otwartej strony. Sprawdź również brak sieci >45 s
   i „Wznów” w Quizach po przywróceniu połączenia.
7. Otwórz formularz profilu w trakcie testu i wróć bez logowania: można kontynuować
   bieżący test. Następnie zaloguj się lub utwórz profil: prywatna historia nie
   zawiera prób Gościa. Wyloguj się i ponownie wybierz Gościa — brak danych profilu.
8. Ranking jako Gość wyjaśnia wymaganie logowania, ale nie blokuje dalszej gry.
   Zalogowany profil nadal widzi ranking zgodnie ze zgodami opiekunów.
9. Administrator bez profilu dziecka może grać jako Gość i nadal zarządzać quizami.
   Sam wybór Gościa nie wylogowuje administratora. Sprawdź publiczne tworzenie
   quizów zgodnie z flagą oraz odmowę edycji/usuwania bez administratora.
10. Klawiatura i VoiceOver: kolejność Tab, widoczny fokus, nagłówki tabeli, odczyt
    przycisków i komunikatów; żaden etap nie wymaga przeciągania ani samego koloru.

## Wdrożenie

Bieżące wydanie wymaga czystej instalacji schematu 2, opisanej w
[WDROZENIE.md](WDROZENIE.md). Gość nie wymaga dodatkowych tabel.
Kod PHP i assety aktualizuj razem. Backup i wycofanie całego wydania są
opisane w instrukcji wdrożenia.
