# Wspólny telefon

Karty pod kluczem `mathmatch.players.v2` zawierają wyłącznie `id`, `nickname`,
`display_name`, `avatar` (maksymalnie 20). Zapis jest opcjonalny. Na HTTPS ta sama opcja pozwala podtrzymać bieżące
logowanie tokenem w cookie Secure/HttpOnly (do 30 dni), odwoływanym przy
wylogowaniu i rotowanym przy odtworzeniu sesji. Hasła i tokeny
nie trafiają do localStorage. ID nie jest pokazywane i nie uprawnia do logowania.
Po wyborze karty wysyłana jest jej ksywka oraz hasło; `remembered_id` dodatkowo
zapobiega zalogowaniu innego profilu, który później otrzymał tę samą ksywkę.

Zmiana ksywki aktualizuje istniejącą kartę na bieżącym urządzeniu po odświeżeniu
własnego profilu. Na innym urządzeniu karta może pozostać nieaktualna: użyj
„Inny gracz”, wpisz nową ksywkę i zaznacz zapamiętanie. Usunięcie karty nie jest
operacją na koncie. Odświeżenie nie odtwarza usuniętej karty. Lista nie jest
przenoszona między urządzeniami. Niedostępny localStorage nie blokuje logowania.

Przełączenie czeka na wysłane operacje klienta, a `profile.logout` w jednej
transakcji pauzuje wskazany własny Test, ustawia `paused=1`, zwiększa revision
oraz odwołuje bieżący token urządzenia, jeżeli istnieje. Dopiero po sukcesie
kończy uwierzytelnienie profilu i czyści stan klienta. Wymuszony błąd zapisu
wycofuje transakcję i nie pokazuje sukcesu. Inne urządzenia i admin pozostają
zalogowani. Powtórzenie wylogowania jest bezpieczne. Zapisane odpowiedzi Nauki
zostają na serwerze. Przy aktywności klient pyta o jej przerwanie.

Stan klienta ma licznik zmiany gracza: opóźnione odpowiedzi nie mogą odtworzyć
prywatnego widoku poprzedniego profilu. Prywatne żądania wysyłają oczekiwane ID,
a serwer sprawdza aktualnego właściciela. Kilka kart przeglądarki współdzieli
sesję PHP: po zmianie gracza w jednej karcie odśwież pozostałe. Nie służą one
do jednoczesnej pracy dwóch różnych dzieci.

Menu używa natywnych `details`/`summary` i przycisków: Tab/Shift+Tab, Enter/Spacja,
Escape (z powrotem fokusu), kliknięcie poza menu i wyjście fokusu zamykają menu.
Na telefonie widoczny jest avatar oraz osobne menu nawigacji. Nie ma stale
widocznej drugiej belki. Programowy fokus nagłówka nie rysuje obramowania przy
obsłudze wskaźnikiem; fokus klawiatury pozostaje widoczny.

`python3 tests/run.py` sprawdza A → B → A, izolację, pauzę, rollback wylogowania,
CSRF, osobną sesję admina i inne urządzenie. `node tests/client.cjs` sprawdza
karty bez sekretów, usuwanie, brak pamięci lokalnej oraz obsługę powodzenia i
błędu wylogowania. Nie są to testy renderowania ani Safari.
