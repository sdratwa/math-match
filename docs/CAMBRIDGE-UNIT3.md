# Cambridge Unit 3 — materiał do sprawdzianu

Moduł otwiera się przez przycisk „Cambridge Unit 3” na ekranie startowym
lub w menu Math Match, a także bezpośrednio pod `cambridge-unit3.php`.
Działa bez logowania i bez dostępu do SQLite. Nie zmienia istniejących quizów,
kont, historii ani rankingu. Odświeżenie lub zamknięcie strony usuwa odpowiedzi.

## Korzystanie

- **Uczę się:** każda lekcja zaczyna się od „To już znasz — użyj definicji”.
  Znane angielskie nazwy rozwijają dokładne definicje podane przez rodzica.
  Obok są krótkie zastosowania do liczb lub rysunków z danej lekcji. Łącznie
  uwzględniono wszystkie 11 definicji, rozłożonych między odpowiednie tematy.
  Rozróżniamy sequence i linear sequence oraz factor i multiple; ciągi
  kwadratów i liczb trójkątnych nie mają stałego przyrostu. Dalej: osiem tematów, krótkie numerowane kroki na konkretnych liczbach,
  rysunki przy omawianym kroku i pytanie kontrolne z odpowiedzią do odkrycia.
  Patyczki uczą dokładania po 3, szafki — liczenia od końca pełnej kolumny,
  ciągi — dopisywania liczb, a dzielniki — układania klocków w rzędy.
  Nie używamy wzorów z literą „n” ani skrótu z granicą sprawdzania dzielników.
  Pozostają polskie objaśnienia oraz
  sekcja „Takie polecenia zobaczysz na sprawdzianie”. Najpierw dziecko czyta
  angielskie polecenie z DOCX i mówi, co ma zrobić, potem rozwija polskie
  objaśnienie i przykład angielskiej odpowiedzi.
- **Ćwiczę:** polecenia, podpunkty, etykiety i odpowiedzi po angielsku. Przycisk
  „Translate / Tłumaczenie” odkrywa polski sens poleceń, „Hint / Podpowiedź”
  pomaga w matematyce. Pomoc jest domyślnie ukryta. Runda ma 3–6 pełnych zadań
  z działu (obejmuje każdy jego rodzaj) lub po jednym z ośmiu działów.
  Odpowiedzi wpisuje się bezpośrednio w lukach ciągów, działań i zdań,
  w komórkach tabeli lub obok pytania. Widoczne oznaczenia podpunktów nie
  powtarzają się przy polach; etykiety dostępności zachowują ich kontekst.
  Po sprawdzeniu każda odpowiedź ma własne zielone ✓ albo czerwone ✗, a błędna
  także poprawną odpowiedź tuż przy polu. Edycja usuwa ocenę zmienionego pola
  do następnego sprawdzenia. Podsumowanie i rachunki mają neutralny kolor;
  rozwiązania potęg są rozdzielone na wiersze. Uzasadnienia mają neutralne ✎.
  Sprawdzenie jest natychmiastowe; raport pamięta pierwszą odpowiedź oraz użycie
  pomocy przed nią. Można poprawiać błędy.
- **Próbny sprawdzian:** najpierw wybór jednej sekcji A–H albo całego arkusza.
  Sekcje mają odpowiednio A: 2, B: 1, C: 1, D: 2, E: 1, F: 1, G: 6, H: 3 zadania
  z podpunktami. Pełny arkusz ma 17 zadań. Zachowana kolejność i podpunkty DOCX,
  angielskie polecenia oraz nawigacja. Raport obejmuje tylko wybrany zakres,
  a powtórzenie z nowymi liczbami zachowuje ten zakres. Można wybrać
  oryginalne liczby albo nowe losowe warianty. Nie ma tłumaczeń, podpowiedzi,
  ocen ani rozwiązań przed oddaniem. Można wracać i poprawiać odpowiedzi.
- **Raport:** punktacja dotyczy wyłącznie odpowiedzi sprawdzanych automatycznie:
  liczb, wyborów, budowanych wzorów, krótkich reguł i nazwy „composite number”.
  Nie jest pełną oceną pracy. 11 pisemnych uzasadnień ma osobne oznaczenie
  do sprawdzenia z dorosłym, odpowiedź dziecka i angielski wzór. Pusta odpowiedź
  także wymaga omówienia. Inne poprawne wyjaśnienia lub rachunki są dopuszczalne.
  Raport wskazuje błędy, pomoc użytą w ćwiczeniach i tematy do powtórzenia.

Zachowano angielskie sformułowania arkusza; np. zadanie 2 ma pytanie o regułę,
**cztery** kolejne wyrazy oraz pytanie o przynależność liczby z uzasadnieniem.
Wariant losowy zmienia wartości, nie rodzaj polecenia. Definicje wzorów 1, 2, 3,
liczba czterech rzędów, podstawowy ciąg trójkątny i fakty o 1 oraz 2 pozostają
stałe, żeby zachować znaczenie arkusza. Nie każde pole zmienia się w każdej rundzie.

Krótkie reguły wpisuje się np. jako `Add 7`, `Add 7 each time`, `Increase by 7`
lub `+7` (analogicznie `Subtract`, `Decrease by`, `-`). To jawnie ograniczony
format, podany przy polu; nie jest oceną dowolnej angielskiej wypowiedzi.
Pisemne uzasadnienia mają limit 800 znaków i nie dostają automatycznie punktów
nawet za sam fakt wpisania tekstu. Nie oceniamy gramatyki ani pisowni uzasadnień.

Jest to lokalna samoocena z deterministycznym sprawdzaniem matematyki w JS,
bez AI i bez zabezpieczania odpowiedzi przed odczytem kodu. Wyniki nie są
kwalifikowane do rankingu. Nie wprowadzono trwałego zapisu ani trybu offline.
Otwarta i załadowana strona nie wysyła odpowiedzi do sieci.

## Źródło i weryfikacja odpowiedzi

Przeczytano dokument `wiad-72277-Stage_5_Mathematics_Unit_3.docx`,
wszystkie zadania 1–17, klucz, obie tabele oraz nagłówek i stopkę.
DOCX nie zawiera osadzonych obrazów ani obiektów rysunkowych. Wzory są opisane
tekstem, znakiem □ oraz tabelami. Nowe rysunki SVG odtwarzają te definicje.
Nie uruchamiano przeglądarki, renderowania interfejsu ani screenshotów.
Plik źródłowy nie jest kopiowany do repozytorium ani publikowany w aplikacji.

Poprawki względem arkusza:

- 1: wspólne polecenie mówi o wzroście, ale 1d maleje o 8. Moduł jasno
  uwzględnia ciągi rosnące i malejące.
- 2c: klucz przeczy sam sobie. **74 należy** do ciągu 18, 25, 32…:
  74 − 18 = 56 = 8 × 7.
- 5c: **7² = 49**, nie 121.
- 5d: **10² = 100**, nie 144.
- 6b: **4² = 4 × 4 = 16**, nie 10 × 10 = 100.

Pozostałe odpowiedzi przeliczono niezależnie:

| Zadanie | Zweryfikowana odpowiedź |
| --- | --- |
| 1a–d | 52,70,88; 115,145,165; 28,35,42; 72,64,56 |
| 2a–c | Dodaj 7; 46,53,60,67; 74 należy do ciągu |
| 3a–c | 16; 16,25,36; kwadraty kolejnych liczb |
| 3d–e | 8,10,12; dodaj 2 |
| 4a–d | Rząd 2; 3,7,11,15,19,23,27,31,35,39; rząd 2; nie, 57 jest w rzędzie 1 |
| 5a–d | 36,64,49,100 |
| 6a–b | 9×9=81; 4×4=16 |
| 7a–d | Pięć połączonych kwadratów; 4,7,10,13; dodaj 3; 31 |
| 8a–d | Wzór 4: rzędy 1,2,3,4 = 10 pól; 10,15,21; przyrosty 2,3,4…; różnice 2 i 3 |
| 9 | 1,2,3,4,6,8,12,24 |
| 10 | 2 i 7 |
| 11 | 17,31,41,53 |
| 12 | Dodatnie dzielniki 31 to tylko 1 i 31 |
| 13 | Liczba złożona — composite number |
| 14a–b | Fałsz: 1 ma jeden dzielnik; fałsz: 2 jest parzysta i pierwsza |
| 15 | Tak, 70 = 6 + 8×8 |
| 16 | 25 = 4 + 7×3 |
| 17 | Pierwsze między 40 a 50: 41,43,47; złożone: 42,44,45,46,48,49 |

Schodki w B są **symetryczne**, z rzędami 1,3,5… i sumą n².
W F układ jest **trójkątny**, z rzędami 1,2,3… i sumą 1+2+…+n.
Liczbę „steps” z zadania 3d objaśniamy zgodnie z ciągiem 2,4,6 jako liczbę
stopni obu zewnętrznych stron. W C numeracja szafek biegnie **w dół kolumn**;
reszta 0 z dzielenia przez 4 oznacza rząd 4.

Rysowanie wzoru 7a zastępuje budowanie rzędu kwadratów przyciskami −/+.
Rysowanie 8a zastępuje zaznaczanie pól siatki (wyrównanie od lewej jest podane
jako konwencja edytora). „Circle” w zadaniu 11 realizują zaznaczane liczby.
Polecenia „Draw” i „Circle” pozostają widoczne po angielsku jak na papierze.
„Explain” i „Show your working” mają pola tekstowe, a nie wybór gotowego
uzasadnienia. Przed szkolnym sprawdzianem należy również narysować wzory
oraz zapisać angielskie uzasadnienia na kartce.

## Pliki i testy

- `public/cambridge-unit3.php`: osobna strona, nagłówki ochronne, brak sesji i bazy.
- `public/assets/unit3/core.js`: lekcje poleceń, 17 generatorów, wariant oryginalny, ocena i raport.
- `public/assets/unit3/ui.js`: widoki, odpowiedzi w pamięci, dostępne SVG i budowanie.
- `public/assets/unit3/unit3.css`: wygląd telefonu, tabletu i komputera.
- `tests/unit3.cjs`: niezależne wyrocznie matematyczne dla 3400 zadań,
  oryginalny arkusz i klucz 1–17, angielskie polecenia, geometria, granice,
  odpowiedzi wielowariantowe, raport oraz brak automatycznej oceny uzasadnień.
- `tests/unit3-http.py`: lokalny HTTP, zasoby i nagłówki, działanie bez bazy.

```sh
node tests/unit3.cjs
python3 tests/unit3-http.py
node --check public/assets/unit3/core.js
node --check public/assets/unit3/ui.js
php -l public/cambridge-unit3.php
```

## Krótki odbiór ręczny — użytkownik

1. iPhone Safari i komputer: wejście przez ekran startowy oraz menu. Trzy duże
   opcje są czytelne. Sprawdź także iPada, jeśli jest dostępny.
2. Uczę się: rozwiń znane definicje w Ciągach, Szafkach i Dzielnikach.
   Sprawdź, czy dziecko potrafi powiedzieć, dlaczego 3 jest factor of 12,
   a 12 jest multiple of 3 oraz dlaczego 1,3,6,10 nie jest linear sequence.
   Uczę się → Ciągi: Amelka czyta „What is the term-to-term rule?” i „Write the
   next four terms”, mówi, co zrobi, potem otwiera „Co mam zrobić?”. Sprawdź
   również schodki, patyczki, trójkąty i polecenia „Explain” oraz „Show”.
3. Ćwiczę: bez kliknięcia pomocy polecenia są po angielsku. Otwórz tłumaczenie,
   zamknij je, wpisz odpowiedź, sprawdź i popraw. Regułę wpisz jako `Add 7`
   lub `+7` tam, gdzie krok rzeczywiście wynosi 7. Raport oznacza pomoc.
4. Próbny sprawdzian → A. Number sequences → Liczby z DOCX: upewnij się,
   że są tylko zadania 1–2, postęp 1/2 i 2/2, a raport dotyczy wyłącznie A.
   Powtórka z nowymi liczbami nadal ma obejmować A. Wybierz też B (1 zadanie),
   G (6 zadań) oraz cały arkusz (17). W wariancie z liczbami z DOCX: sprawdź zadanie 2 (18,25,32,39; cztery
   następne wyrazy; 74 należy do ciągu) i zadania 5–6 (poprawiony klucz).
   Wszystkie polecenia i nawigacja podczas pracy są angielskie; brak pomocy
   i oceny. Cofnij się: tekst uzasadnienia i liczby muszą pozostać.
5. Sprawdź wpisywanie bezpośrednio w lukach zadań 1, 3, 5, 6 i 8, listę
   szafek w 4 oraz komórki tabeli w 7. Oznaczenie a)/b) ma występować tylko raz
   przy danym podpunkcie. Tab przechodzi przez pola w kolejności czytania.
   Zbuduj wzór patyczków i trójkąt, uzupełnij tabelę oraz zaznacz liczby pierwsze.
   Obrót iPhone, długi tekst, klawiatura ekranowa i zoom 200% nie zasłaniają pól.
6. W ćwiczeniach zostaw jedną lukę w kwadratach, a trzy odpowiedzi wpisz
   poprawnie. Po „Check answers” oczekuj jednego czerwonego ✗ i trzech zielonych
   ✓ przy polach oraz neutralnego wyniku 3/4. Zmień jedną odpowiedź: jej ocena
   znika do ponownego sprawdzenia. Rachunki mają być w osobnych wierszach.
   W sprawdzianie przed oddaniem nie może być ocen przy polach.
   Wpisz błędną liczbę i dowolne uzasadnienie, zostaw też puste pole. Oddaj pracę:
   błędne liczby wpływają na punktację, tekst uzasadnienia nie dostaje punktów.
   Raport pokazuje 11 uzasadnień do sprawdzenia, także niewypełnione.
7. Uruchom nowy sprawdzian z nowymi liczbami. Sprawdź zmienione wartości oraz
   zachowane angielskie sformułowania i podpunkty.
8. Klawiatura/VoiceOver: Tab, Enter, wybory, etykiety pól, siatka, komunikaty,
   fokus dialogu i Escape. Sprawdź też stare quizy i logowanie. Odświeżenie
   modułu usuwa lokalne odpowiedzi, zgodnie z informacją na stronie.

## Publikacja i wycofanie

Wdrożenie wymaga osobnej decyzji. Przed nim wykonaj dotychczasowy backup SQLite
przez `.backup` i zachowaj poprzednie wydanie kodu. Opublikuj wspólnie nową
stronę, cały katalog `assets/unit3/`, zmieniony `index.php` i `app.css`.
Nie uruchamiaj inicjalizacji, migracji ani resetu bazy. Nie zeruj rankingu.
Wycofanie polega na powrocie do poprzednich plików kodu; baza nie wymaga odtwarzania,
więc nowe wyniki starych quizów nie zostaną utracone. Ręczny test po publikacji:
wejście do modułu, dostępność zasobów, jedna odpowiedź i powrót do starych quizów.
