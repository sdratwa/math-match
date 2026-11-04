# Odbiór interfejsu — wykonuje użytkownik

Wykonaj checklistę osobno na fizycznym iPhonie (Safari), iPadzie (Safari)
i macOS (Chrome). Zapisz wersję systemu/przeglądarki i wynik każdego punktu.
Użyj własnej instalacji testowej i syntetycznych danych. Nie oznaczaj scenariusza
jako sprawdzony na podstawie samych testów backendu.

## A. Nowe dziecko

- [ ] Utwórz profil z unikalną ksywką, opcjonalnym imieniem i avatarem.
- [ ] Użyj małych liter, spacji i polskich znaków w haśle (8–128 znaków).
- [ ] Sprawdź krótkie/popularne hasło i różne powtórzenie. Pokaż/ukryj oba pola,
      wklej hasło. Zgoda rankingowa na początku jest wyłączona.
- [ ] Wyślij formularz dwukrotnie szybko: powstaje jedno konto.
- [ ] Zobacz avatar i osobne powitanie, bez formularza ustawień.
- [ ] „Zaczynamy!” otwiera Quizy. Ksywka różniąca się tylko wielkością polskich
      liter lub skrajnymi spacjami jest zajęta.

## B. Powrót i nowy telefon

- [ ] Na HTTPS zaznacz zapamiętanie podczas logowania. Po zamknięciu i ponownym
      otwarciu przeglądarki dostęp jest zachowany. Jawnie wyloguj się: pojawia się
      karta, a odświeżenie nie odtwarza dostępu bez hasła.
- [ ] Kliknij avatar, wpisz tylko hasło. Sprawdź własne postępy.
- [ ] Błędne hasło i nieistniejąca ksywka mają ten sam komunikat.
- [ ] Na drugim urządzeniu wpisz ksywkę i hasło; wyniki są dostępne bez kodów.
- [ ] Sprawdź Safari/iCloud Keychain i Chrome Password Manager: username,
      current-password, new-password; brak automatycznego wysyłania.
- [ ] Wybór karty A nie loguje B po użyciu autofill B. Admin ma oddzielną nazwę
      konta „Administrator Math Match”. Usuń ręcznie nieaktualny wpis menedżera,
      jeśli przeglądarka proponuje stare dane — aplikacja nie może go usunąć.

## C. Bliźniaczki i wylogowanie

- [ ] Utwórz A i B z różnymi ksywkami, ale tym samym imieniem wyświetlanym.
- [ ] A odpowiada w Nauce. Menu → Zmień gracza → B → hasło → własne postępy.
- [ ] Powtórz B → A; każde dziecko widzi tylko swoje dane.
- [ ] A rozpoczyna Test i zapisuje część odpowiedzi. Zmiana gracza wymaga
      potwierdzenia, pauzuje Test. B nie widzi próby A.
- [ ] Wróć do A, karta „Wznów” pokazuje aktywność; odpowiedzi są zachowane,
      ukończona próba po pauzie nie jest w rankingu.
- [ ] „Wyloguj się” pokazuje karty i dostęp do pełnego ekranu startowego.
      Odświeżenie nie odtwarza dostępu bez hasła; drugie urządzenie A nadal działa.
- [ ] Odłącz internet przed wylogowaniem: brak potwierdzenia sukcesu,
      komunikat pozwala ponowić. Po odzyskaniu sieci spróbuj ponownie.
- [ ] Usuń B z urządzenia; odśwież. Konto B nadal działa przez „Inny gracz”.
- [ ] Wyłącz dostęp do pamięci lokalnej: logowanie nadal działa.
- [ ] Zmień gracza w drugiej karcie przeglądarki; stara karta nie może wysyłać
      odpowiedzi jako poprzednie dziecko. Po odświeżeniu pokazuje aktualny profil.

## D. Ustawienia i administrator

- [ ] Zmień avatar, imię, dźwięk i zgodę. Zobacz „Zmiany zostały zapisane ✓”.
- [ ] Zmiana ksywki/hasła bez aktualnego hasła jest odrzucona; z poprawnym działa.
      Stare hasło przestaje działać, inne sesje profilu wygasają.
- [ ] Admin wyszukuje po ksywce i imieniu, zmienia dane/zgodę, widzi historię,
      unieważnia sesje i może usunąć syntetyczny profil.
- [ ] Admin wydaje sekret odzyskiwania po potwierdzeniu tożsamości. Nowe hasło
      działa, sekret drugi raz oraz po 10 minutach nie działa.
- [ ] Zaloguj admina i dziecko w tej samej przeglądarce. Wylogowanie jednego nie
      wylogowuje drugiego. Menu Admin prowadzi do panelu, a nie do wylogowania.
- [ ] Utwórz i edytuj quiz; sprawdź konflikt dwóch edycji i archiwizację.

## E. Gość i gra

- [ ] Gość widzi porównanie i świadomie potwierdza wejście tylko raz.
- [ ] Nauka: dobre pary znikają, błędne dają czerwony komunikat także bez dźwięku.
- [ ] Test: łączenie/zmiana odpowiedzi, czas, pauza, wznowienie, wynik.
- [ ] Wznowienie Gościa z Quizów działa w bieżącej sesji.
- [ ] Gość nie ma trwałych postępów ani rankingu. Logowanie/rejestracja nie
      importuje wyniku Gościa.
- [ ] Ranking pokazuje imiona wyświetlane tylko przy zgodzie opiekuna.

## F. Nawigacja i dostępność

- [ ] Telefon pionowo/poziomo, iPad w obu orientacjach, Chrome w wąskim oknie:
      jeden nagłówek, avatar, menu; brak przewijania całej strony poziomo.
- [ ] Długie imię/ksywka/opis pary nie wychodzą poza ekran.
- [ ] Menu otwiera dotyk, Enter i Spacja; Tab przechodzi po opcjach, Escape
      zamyka i oddaje fokus. Kliknięcie poza menu i wyjście fokusu zamykają je.
- [ ] VoiceOver odczytuje etykiety, bieżącego gracza i komunikaty. Fokus
      klawiatury jest widoczny; kliknięcie nie daje przypadkowej ramki tytułu.
- [ ] Sprawdź większy tekst, zoom 200%, ograniczone animacje i obszary dotykowe.
- [ ] Dźwięk/wygaszenie ekranu/powrót z tła na fizycznym iOS; komunikat błędu
      pozostaje czytelny nawet gdy system blokuje dźwięk.

## G. Rezygnacja i dialogi

- [ ] Profil i Gość: rozpocznij Test, połącz parę, wybierz „Zrezygnuj”.
      Anuluj i Escape pozostawiają próbę. Potwierdzenie wraca do Quizów,
      bez wyniku, historii i karty wznowienia. Powtórz dla zapauzowanego Testu.
- [ ] Przy odłączonej sieci rezygnacja nie pokazuje sukcesu; można ją ponowić.
- [ ] Pauza, zmiana gracza, odwołanie sesji, usuwanie quizu/profilu i odzyskanie
      dostępu pokazują dialog aplikacji, z przyciemnionym/rozmytym tłem.
- [ ] Na telefonie i z klawiaturą: tekst mieści się w oknie, Tab pozostaje
      w dialogu, Escape anuluje, a fokus po anulowaniu wraca do przycisku.
