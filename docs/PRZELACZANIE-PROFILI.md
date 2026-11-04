# Szybkie przełączanie profili

Górna belka zalogowanego gracza pokazuje avatar, ksywkę i przycisk „👥 Zmień gracza”. Belka pozostaje dostępna podczas przewijania. „Zmień gracza” otwiera wybór profili po wylogowaniu; „Wyloguj się” wraca do standardowego ekranu startowego. Obie operacje zachowują odrębną sesję administratora.

## Lista na urządzeniu

Klucz `mathmatch.players.v1` w `localStorage` zawiera maksymalnie 20 ostatnich profili: wyłącznie `code`, `nickname`, `avatar`. Aktualizacja następuje po pobraniu uwierzytelnionego profilu. Dane lokalne nie dają uprawnień. PIN jest wymagany przy każdym wyborze karty, nie jest zapisywany w liście; po próbie szybkiego logowania pole PIN jest czyszczone. Przy identycznych ksywkach karty pokazują niesekretny kod gracza (pełny kod pozwala uniknąć kolizji skrótów). Wybór prowadzi bezpośrednio do pola PIN z klawiaturą numeryczną.

„Usuń z tego urządzenia” usuwa wyłącznie kartę z lokalnej listy; nie wykonuje żądania API. Ponowne zalogowanie kodem i PIN-em ponownie dodaje kartę. Wyczyszczenie pamięci przeglądarki usuwa listę. Jeśli zapis jest niedostępny, lista działa tylko do zamknięcia strony. Lista jest wspólna dla kart tego samego originu i profilu przeglądarki; nie synchronizuje się między urządzeniami. Odczyt listy następuje przy otwarciu strony.

Opcja zapamiętanego uwierzytelnienia HTTPS pozostaje niezależna od tej listy. Szybkie logowanie kartą nie tworzy nowego tokena zapamiętanego urządzenia.

## Kontrakt i niezawodność

`POST profile.logout` wymaga CSRF. Opcjonalny `attempt_id` wskazuje test bieżącego urządzenia. Serwer sprawdza właściciela i w jednej transakcji SQLite pauzuje aktywny test, ustawia `paused=1`, zwiększa jego wersję oraz usuwa bieżący token urządzenia. Błąd wycofuje oba zapisy i zachowuje autoryzację. Po zatwierdzeniu usuwa uwierzytelnienie profilu z sesji PHP oraz cookie urządzenia. Nie zmienia wersji autoryzacji profilu ani tokenów innych urządzeń. Nie wymaga migracji: schemat pozostaje w wersji 1.

Powtórne wylogowanie jest poprawne również bez aktywnego profilu — pozwala odzyskać stan po utracie odpowiedzi. Nie rotuje identyfikatora sesji PHP ani CSRF, aby ponowienie nie utraciło osobnej sesji administratora. Logowanie nadal rotuje identyfikator sesji. Klient wysyła również `expected_profile_id`; operacje prywatne i wylogowanie odrzucają rozbieżność z aktualnym profilem, np. ze starej karty po przełączeniu w innej karcie. To dodatkowa kontrola spójności, nie sposób uwierzytelnienia.

Klient czeka na rozpoczęte żądania, blokuje nowe żądania podczas wylogowania i sprawdza generację stanu przy odbiorze odpowiedzi. Sukces usuwa dane profilu, testu, nauki i statystyk z pamięci i elementów interfejsu. Błąd pokazuje brak potwierdzenia wylogowania oraz możliwość ponowienia. Dotychczas zapisane odpowiedzi pozostają na serwerze; nie ma importu danych między graczami ani do Gościa. Test można wznowić istniejącą opcją „Wznów naukę lub test”, poza rankingiem. Wyjście z aktywności wymaga potwierdzenia również przy wylogowaniu.

## Weryfikacja bez przeglądarki

`python3 tests/run.py` używa wyłącznie syntetycznych danych w osobnych katalogach tymczasowych i lokalnego HTTP na `127.0.0.1`. Scenariusz `test_shared_device_switching` sprawdza A → B → A, identyczne ksywki z różnymi kodami, błędny PIN, brak logowania samym ID, izolację statystyk i prób, zachowanie postępów obu graczy, zapisane odpowiedzi, pauzę, wznowienie, wykluczenie z rankingu, osobnego administratora i drugie urządzenie. Wymuszony błąd zapisu sprawdza wycofanie transakcji; powtórzenie sprawdza idempotencję. Test sprawdza też POST, CSRF i odrzucenie żądania ze starej karty. Tokeny urządzeń są syntetyczne; test HTTP nie weryfikuje zachowania cookie Secure w Safari.

Lista lokalna i obsługa dotykowa wymagają poniższego odbioru ręcznego. Nie wykonywano testów przeglądarkowych ani screenshotów.

## Ręczny odbiór na iPhonie i iPadzie

Użyj środowiska testowego HTTPS i dwóch syntetycznych profili A i B. Powtórz w Safari na fizycznym iPhonie i iPadzie, pionowo i poziomo; dodatkowo sprawdź klawiaturę komputera.

1. Zaloguj A kodem i PIN-em, potem „Zmień gracza” → „Inny gracz” i zaloguj B. Ponownie wybierz zmianę: obie karty są widoczne. Wybierz A: tylko PIN, bez wpisywania kodu. Powtórz B → A kilka razy. Po logowaniu widoczna jest biblioteka i właściwa tożsamość w belce.
2. Ustaw tę samą ksywkę i avatar dla obu profili. Sprawdź różne kody na kartach; wybór każdej karty wymaga właściwego PIN-u. Błędny PIN pozostawia ekran PIN-u i komunikat, bez prywatnych danych.
3. Usuń kartę B z urządzenia. Odśwież stronę: karty B nie ma. Zaloguj B przez „Inny gracz” kodem i PIN-em: historia i postęp nadal istnieją, karta wraca. Usuń pamięć witryny i sprawdź działanie logowania bez listy.
4. Rozpocznij naukę A, dopasuj parę, zmień gracza. Anuluj potwierdzenie: gra trwa. Potwierdź: przejdź do B bez historii A. Wróć do A i wznów naukę: zapisany postęp pozostał.
5. Rozpocznij test A, zapisz połączenie, zmień gracza. Wróć do A, wznów test: zapisane połączenie pozostało, test jest poza rankingiem. Dokończ; sprawdź historię A i brak tego wyniku w rankingu oraz historii B.
6. Podczas zapisu odpowiedzi kliknij zmianę gracza. Nie mogą pojawić się dane poprzednika po zalogowaniu następcy. Powtórz z wolnym połączeniem, a następnie offline: błąd nie oznacza sukcesu, po przywróceniu połączenia operację można ponowić.
7. „Wyloguj się” prowadzi do standardowego startu. Odśwież: profil nie loguje się ponownie z tokena. „Zmień gracza” prowadzi od razu do kart. Drugi telefon z sesją A nadal działa. Zalogowany osobno administrator pozostaje zalogowany.
8. Otwórz dwie karty: przełącz A → B w jednej; operacja prywatna lub wylogowanie ze starej karty A musi zostać odrzucona. Odśwież starą kartę, aby wczytać bieżącego gracza. Już wyświetlony ekran drugiej karty nie jest automatycznie czyszczony.
9. Sprawdź belkę podczas przewijania długiego testu, długą ksywkę, duże karty, brak poziomego przewijania, klawiaturę numeryczną PIN, widoczny fokus i komunikaty VoiceOver. Przetestuj ograniczenie animacji oraz ekran Gościa z wymaganym potwierdzeniem.

## Ręczne wdrożenie i wycofanie

Wdrożenie wymaga osobnego polecenia użytkownika. Przed nim sprawdź dokładny diff (katalog zawierał już poprawki logowania), wykonaj kopię SQLite przez `.backup` lub API backup do chronionego katalogu poza `public/` i Git, zachowaj obecną wersję plików aplikacji. Nie kopiuj samego pliku aktywnej bazy WAL.

Po akceptacji wgraj spójny komplet zmienionych plików aplikacji: `src/profile-api.php`, `public/index.php`, `public/assets/app.js`, `public/assets/app.css`; pozostaw `storage/` i konfigurację serwera bez zmian. Nie wykonuj migracji ani resetu hasła. Zmienione wersje adresów assetów odświeżają cache. Odbiór wykonaj na środowisku testowym przed wdrożeniem.

Wycofanie: przywróć poprzednie pliki aplikacji i wersje assetów. Nie przywracaj bazy tylko z powodu wycofania kodu — utraciłoby to nowszy postęp. Pauzy i wylogowania wykonane przed wycofaniem pozostają ważne. Lokalna lista niesekretnych profili może pozostać; starszy kod ją ignoruje.
