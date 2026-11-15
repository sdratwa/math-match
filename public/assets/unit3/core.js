/* Cambridge Unit 3: czysta logika matematyczna, bez DOM, sieci i danych profili. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Unit3 = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const topics = [
  {
    "id": "sequences",
    "title": "Ciągi liczbowe",
    "en": "Number sequences",
    "icon": "🔢",
    "text": [
      "Popatrz: 18, 25, 32, 39. To number sequence: liczby ustawione po kolei według reguły. Sequence może też składać się z kształtów lub rysunków. Jeden element ciągu to term — tutaj jedna liczba.",
      "Od 18 do 25 dodajemy 7. Od 25 do 32 też dodajemy 7. Sprawdź jeszcze: 32 + 7 = 39. To linear sequence: za każdym razem dodajemy tę samą liczbę.",
      "Term-to-term rule pyta: „Co robisz, żeby dostać następną liczbę?”. Tutaj odpowiedz: Add 7 each time. To znaczy: za każdym razem dodaj 7.",
      "Next four terms to cztery następne liczby. Zacznij za ostatnią podaną: 39 + 7 = 46, potem 53, 60 i 67.",
      "Is 74 in this sequence? pyta, czy dotrzemy do 74. Dopisuj liczby, dodając po 7. Po 67 dostaniesz 74, więc odpowiedź to Yes."
    ],
    "example": "Czy 75 też pasuje?\nPo 67 jest 74, a po 74 jest 81. Przeskakujemy 75, więc odpowiedź to No.\nMożesz napisać: No. The sequence goes from 74 to 81.",
    "tip": "Czasem liczby maleją. W 20, 17, 14 za każdym razem odejmujesz 3: Subtract 3.",
    "stepDiagrams": {
      "1": {
        "kind": "sequence",
        "values": [
          18,
          25,
          32,
          39
        ],
        "step": 7
      }
    },
    "check": {
      "question": "W ciągu 5, 9, 13 co dodajesz? Jaka będzie następna liczba?",
      "answer": "Dodaję 4: Add 4 each time. Następna liczba to 17."
    }
  },
  {
    "id": "stairs",
    "title": "Schodki i rosnące wzory",
    "en": "Growing patterns and staircases",
    "icon": "🪜",
    "text": [
      "Te rysunki tworzą spatial pattern. Pattern 1 oznacza tutaj pierwszy rysunek, Pattern 2 — drugi. Na pierwszym jest jeden kwadrat. Policz go.",
      "Pattern 2 ma na górze 1 kwadrat, a pod nim 3. Razem: 1 + 3 = 4. Środkowy kwadrat na dole jest dokładnie pod górnym.",
      "Pattern 3 ma rzędy po 1, 3 i 5 kwadratów. Razem: 1 + 3 + 5 = 9. Każdy nowy dolny rząd ma o 2 kwadraty więcej.",
      "Zbuduj w myślach Pattern 4: pod rzędem z 5 kwadratów dodaj rząd z 7. Było 9 kwadratów, dodajesz 7, więc jest 16.",
      "Squares to kwadraty, a steps to stopnie. Arkusz liczy stopnie po lewej i po prawej stronie razem: we wzorze 3 są 3 z lewej i 3 z prawej, czyli 6. Wzór 4 ma 4 + 4 = 8 stopni."
    ],
    "example": "Kwadraty: 1, 4, 9, 16.\nTo także wyniki: 1 × 1, 2 × 2, 3 × 3, 4 × 4. Dlatego nazywamy je square numbers.\nStopnie po obu stronach: 2, 4, 6, 8. Tutaj reguła to Add 2 each time.",
    "tip": "Przed liczeniem sprawdź słowo w pytaniu: squares czy steps? To dwie różne odpowiedzi.",
    "stepDiagrams": {
      "0": {
        "kind": "stairs",
        "n": 1
      },
      "1": {
        "kind": "stairs",
        "n": 2
      },
      "2": {
        "kind": "stairs",
        "n": 3
      },
      "3": {
        "kind": "stairs",
        "n": 4
      }
    },
    "check": {
      "question": "Wzór 3 ma 9 kwadratów. Dokładasz na dole 7. Ile kwadratów ma wzór 4?",
      "answer": "9 + 7 = 16 kwadratów. To nie liczba stopni!"
    }
  },
  {
    "id": "rows",
    "title": "Szafki w rzędach",
    "en": "Numbering in rows",
    "icon": "🗄️",
    "text": [
      "Przesuń palec w prawo po liczbach 1, 5, 9. To rząd (row). Teraz przesuń palec w dół po 1, 2, 3, 4. To kolumna (column).",
      "Tutaj najpierw numerujemy całą kolumnę w dół: 1, 2, 3, 4. Potem następną: 5, 6, 7, 8. Znajdź 14 — jest w drugim rzędzie.",
      "Idź palcem w prawo po trzecim rzędzie: 3, 7, 11, 15, 19. Numery rosną o 4, bo każda kolumna ma cztery szafki. To linear sequence, a jego term-to-term rule to Add 4 each time.",
      "Jak znaleźć szafkę 46 bez rysowania całej tabeli? 4 × 11 = 44. To koniec jedenastej kolumny, w rzędzie 4. Następna szafka, 45, wraca do rzędu 1. Szafka 46 jest tuż pod nią, w rzędzie 2.",
      "Liczba 20 kończy pełną kolumnę: 4 × 5 = 20. Dlatego jest w rzędzie 4. Nie ma rzędu 0!"
    ],
    "example": "Słowo remainder oznacza resztę, czyli to, co zostaje po odliczeniu pełnych grup.\n44 to multiple of 4, bo 4 × 11 = 44. To 44 szafki w pełnych kolumnach. Do 46 zostają jeszcze 2: 45 i 46.\nPo angielsku: 44 is at the bottom. 45 is in row 1, so 46 is in row 2.",
    "tip": "Gdy pytają o dziesięć pierwszych numerów w rzędzie, zacznij od numeru rzędu i dopisz dziewięć kolejnych, dodając po 4.",
    "stepDiagrams": {
      "0": {
        "kind": "rows",
        "rows": 4,
        "columns": 5
      }
    },
    "check": {
      "question": "W którym rzędzie jest 12? A w którym 13?",
      "answer": "12 kończy trzecią kolumnę: rząd 4. 13 zaczyna następną: rząd 1."
    }
  },
  {
    "id": "squares",
    "title": "Kwadraty liczb i potęgi",
    "en": "Squares and powers",
    "icon": "🟪",
    "text": [
      "Spójrz na mały kwadrat: ma 3 rzędy, w każdym po 3 pola. Policz: 3 + 3 + 3 = 9. Krócej zapisujemy 3 × 3 = 9.",
      "Zapis 3² oznacza właśnie 3 × 3. Czytamy go three squared. Mała dwójka mówi: pomnóż tę liczbę przez nią samą.",
      "Teraz kwadrat z 4 rzędami po 4 pola. Policz rzędy: 4 + 4 + 4 + 4 = 16. Dlatego 4² = 4 × 4 = 16.",
      "Find the value oznacza: oblicz wynik. Przy 7² zapisz 7 × 7 i policz 49. Nie mnożymy przez małą dwójkę!"
    ],
    "example": "9² means __ × __, so its value is __.\nPierwsza luka: 9. Druga luka: znowu 9. Ostatnia luka: wynik, czyli 81.\nCałe zdanie: 9² means 9 × 9, so its value is 81.",
    "tip": "Nie musisz pamiętać trudnej nazwy małej dwójki. Najważniejsze: 5² oznacza 5 × 5.",
    "stepDiagrams": {
      "0": {
        "kind": "square",
        "n": 3
      },
      "2": {
        "kind": "square",
        "n": 4
      }
    },
    "check": {
      "question": "Co wpiszesz: 6² = __ × __ = __?",
      "answer": "6 × 6 = 36."
    }
  },
  {
    "id": "sticks",
    "title": "Wzory z patyczków",
    "en": "Patterns made from sticks",
    "icon": "🧩",
    "text": [
      "Zbuduj pierwszy kwadrat. Policz jego boki: góra, dół, lewy i prawy. Potrzebujesz 4 patyczków (sticks).",
      "Dołącz drugi kwadrat z prawej. Jego lewy bok już jest — to prawy bok pierwszego kwadratu! Dodaj tylko górę, dół i nowy prawy bok: 3 patyczki. Razem 4 + 3 = 7.",
      "Dołącz trzeci kwadrat. Znowu jeden bok już jest, więc dodajesz 3. Razem 7 + 3 = 10. Niebieskie boki na rysunku są wspólne — policz każdy tylko raz.",
      "Dla czwartego kwadratu dodaj jeszcze 3: 10 + 3 = 13. Dla piątego dodaj kolejne 3: 13 + 3 = 16.",
      "What is the term-to-term rule? pyta, co robisz za każdym razem. Odpowiedz: Add 3 each time."
    ],
    "example": "How many sticks are needed for Pattern 5?\nPierwszy kwadrat ma 4 patyczki. Dołączamy jeszcze 4 kwadraty, po 3 patyczki każdy.\nMożesz policzyć: 4 + 3 + 3 + 3 + 3 = 16.\nKrótszy zapis tego samego: 4 + 4 × 3 = 16.",
    "tip": "Przy Pattern 10 pierwszy kwadrat już masz. Dołączysz jeszcze 9 kwadratów — dlatego dodajesz dziewięć razy po 3, a nie dziesięć.",
    "stepDiagrams": {
      "0": {
        "kind": "sticks",
        "n": 1
      },
      "1": {
        "kind": "sticks",
        "n": 2
      },
      "2": {
        "kind": "sticks",
        "n": 3
      }
    },
    "check": {
      "question": "Dwa połączone kwadraty mają 7 patyczków. Dokładasz trzeci kwadrat. Ile patyczków będzie razem?",
      "answer": "7 + 3 = 10. Jeden bok nowego kwadratu już był, więc dołożyliśmy tylko 3 patyczki."
    }
  },
  {
    "id": "triangles",
    "title": "Liczby trójkątne",
    "en": "Triangular number patterns",
    "icon": "🔺",
    "text": [
      "Zacznij od jednego pola. To Pattern 1. Z definicji znasz trójkąt z kropek (dots); tutaj zamiast kropek układamy małe kwadraty.",
      "Pod nim dodaj rząd z 2 polami. Razem: 1 + 2 = 3. To Pattern 2.",
      "Dodaj na dole rząd z 3 polami. Były 3 pola, dodajesz 3: razem 6. To Pattern 3.",
      "Następny rząd ma 4 pola. Było 6, dodajesz 4, więc jest 10. Potem dodasz rząd z 5 polami: 10 + 5 = 15. Liczby 1, 3, 6, 10, 15 to triangular numbers — liczą wszystkie pola w kolejnych trójkątach.",
      "Explain how the sequence grows pyta, jak rosną liczby. Nie dodajemy ciągle tej samej liczby! Dodajemy 2, potem 3, potem 4. Po angielsku: Add 2, then 3, then 4, and so on."
    ],
    "example": "Difference znaczy różnica: o ile następna liczba jest większa?\nOd 1 do 3 dodajemy 2. Możesz zapisać 3 − 1 = 2.\nOd 3 do 6 dodajemy 3. Możesz zapisać 6 − 3 = 3.",
    "tip": "Tutaj rzędy mają 1, 2, 3, 4 pola. W schodkach z poprzedniej lekcji miały 1, 3, 5, 7 — obejrzyj oba rysunki i porównaj.",
    "stepDiagrams": {
      "0": {
        "kind": "triangle",
        "n": 1
      },
      "1": {
        "kind": "triangle",
        "n": 2
      },
      "2": {
        "kind": "triangle",
        "n": 3
      },
      "3": {
        "kind": "triangle",
        "n": 4
      }
    },
    "check": {
      "question": "Wzór 4 ma 10 pól. Następny rząd ma 5. Ile pól będzie w całym wzorze 5?",
      "answer": "10 + 5 = 15 pól."
    }
  },
  {
    "id": "factors",
    "title": "Dzielniki i liczby pierwsze",
    "en": "Factors and prime numbers",
    "icon": "🔍",
    "text": [
      "Masz 12 klocków. Możesz ułożyć 3 rzędy po 4 klocki: 3 × 4 = 12. W drugą stronę: 12 ÷ 3 = 4, bez reszty. To właśnie divides exactly. Dlatego 3 jest factor of 12. Tak samo 4 jest dzielnikiem 12.",
      "Szukaj wszystkich par mnożenia dających 12: 1 × 12, 2 × 6, 3 × 4. Zbierz liczby z obu stron mnożenia. Dzielniki 12 to 1, 2, 3, 4, 6, 12. Każdą liczbę zapisz tylko raz.",
      "Teraz weź 7 klocków. Przy rzędach po 2 zostaje 1 klocek: 2 + 2 + 2 + 1. Przy rzędach po 3 też zostaje 1: 3 + 3 + 1. Sprawdź też rzędy po 4, 5 i 6 — za każdym razem coś zostaje. Bez reszty pasują tylko 1 i 7. To liczba pierwsza (prime number).",
      "Prime number ma dokładnie dwa dzielniki: 1 i samą siebie. Liczba 6 ma więcej: 1, 2, 3, 6. Nazywamy ją liczbą złożoną (composite number).",
      "Uważaj na 1 i 2. Liczba 1 ma tylko jeden dzielnik, więc nie jest pierwsza ani złożona. Liczba 2 ma dzielniki 1 i 2, więc jest pierwsza.",
      "Even to parzysta: klocki można połączyć w pary, bez zostawiania jednego. Odd to nieparzysta: jeden klocek zostaje. 2 jest parzysta i pierwsza. Każda większa liczba parzysta ma dodatkowy dzielnik 2, więc nie jest pierwsza."
    ],
    "example": "Write all the factors of 24. Szukamy par:\n1 × 24 = 24\n2 × 12 = 24\n3 × 8 = 24\n4 × 6 = 24\nZbieramy wszystkie różne liczby: 1, 2, 3, 4, 6, 8, 12, 24.",
    "tip": "Liczba nieparzysta nie zawsze jest pierwsza. Na przykład 9 jest nieparzysta, ale 3 × 3 = 9, więc ma dzielniki 1, 3 i 9.",
    "check": {
      "question": "Dzielniki 5 to 1 i 5. Dzielniki 8 to 1, 2, 4 i 8. Która liczba jest prime, a która composite?",
      "answer": "5 jest prime: ma dwa dzielniki. 8 jest composite: ma więcej niż dwa."
    }
  },
  {
    "id": "mixed",
    "title": "Wyzwanie mieszane",
    "en": "Mixed challenge",
    "icon": "⭐",
    "text": [
      "Przeczytaj polecenie i znajdź znajome słowo. Sequence? Dopisuj następne liczby. Sticks? Pierwszy kwadrat ma 4 patyczki, a każdy następny dodaje 3.",
      "Starts at 6 and increases by 8 oznacza: zacznij od 6 i dodawaj po 8. Zapisz po kolei: 6, 14, 22, 30, 38, 46, 54, 62, 70. Dotarliśmy do 70!",
      "Prime czy composite? Wypisz dzielniki. Dokładnie dwa oznaczają prime. Więcej niż dwa oznacza composite.",
      "Between 40 and 50 oznacza tutaj liczby od 41 do 49. Wybierz jedną pierwszą i jedną złożoną. Nie trzeba wypisywać wszystkich.",
      "Explain your choices oznacza: napisz, dlaczego wybrałaś te liczby. Możesz użyć krótkiego zdania i rachunku."
    ],
    "example": "Przykładowa odpowiedź:\n43 is prime. Its only factors are 1 and 43.\n44 is composite because 4 × 11 = 44.\nCzyli: 43 ma tylko dwa dzielniki. A 44 da się otrzymać przez pomnożenie dwóch liczb większych od 1.",
    "tip": "Show how you know: pokaż, jak doszłaś do odpowiedzi. Możesz wypisać ciąg albo napisać rachunek. Samo Yes lub No nie wyjaśnia sposobu.",
    "check": {
      "question": "Ciąg zaczyna się od 2. Dodawaj po 5. Czy pojawi się 17? A 18?",
      "answer": "2, 7, 12, 17, 22. Tak dla 17. Nie dla 18 — przeskakujemy ją między 17 a 22."
    }
  }
];
  const integer = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
  function shuffled(values, rng = Math.random) {
    const a = [...values];
    for (let i = a.length - 1; i > 0; i--) { const j = integer(rng, 0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function factors(n) { const a = []; for (let d = 1; d <= n; d++) if (n % d === 0) a.push(d); return a; }
  function prime(n) { if (!Number.isInteger(n) || n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; }
  const triangular = n => n * (n + 1) / 2;
  const rowOf = (n, rows) => (n - 1) % rows + 1;
  function cells(kind, n) {
    const result = [];
    for (let y = 0; y < n; y++) {
      const width = kind === 'stairs' ? 2 * y + 1 : kind === 'triangle' ? y + 1 : n;
      const offset = kind === 'stairs' ? n - y - 1 : 0;
      for (let x = 0; x < width; x++) result.push([x + offset, y]);
    }
    return result;
  }
  function stickSegments(n) {
    const result = [];
    for (let x = 0; x <= n; x++) result.push([x, 0, x, 1]);
    for (let x = 0; x < n; x++) { result.push([x, 0, x + 1, 0]); result.push([x, 1, x + 1, 1]); }
    return result;
  }
  // Definicje podane przez rodzica — zachowujemy angielskie brzmienie szkolne.
  const definitions = {
  "linear": {
    "term": "Linear sequence",
    "definition": "a number pattern which increases or decreases by the same amount each time"
  },
  "sequence": {
    "term": "Sequence",
    "definition": "an ordered set of numbers, shapes or other mathematical objects arranged according to a rule"
  },
  "term": {
    "term": "Term",
    "definition": "an item in a sequence"
  },
  "rule": {
    "term": "Term-to-term rule",
    "definition": "a rule you can use to find out how to get from one term to the next"
  },
  "spatial": {
    "term": "Spatial pattern",
    "definition": "a pattern that includes drawings"
  },
  "square": {
    "term": "Square numbers",
    "definition": "a number you get when you multiply an integer by itself"
  },
  "triangular": {
    "term": "Triangular number",
    "definition": "triangular numbers can be shown as patterns of dots arranged as a triangle. Each row contains one extra dot."
  },
  "composite": {
    "term": "Composite number",
    "definition": "a number with more than two factors"
  },
  "factor": {
    "term": "Factor",
    "definition": "a whole number that divides exactly into another number"
  },
  "multiple": {
    "term": "Multiple",
    "definition": "the result of multiplying a number by a positive whole number"
  },
  "prime": {
    "term": "Prime number",
    "definition": "a number with exactly two factors"
  }
};
  const definitionLinks = {
  "sequences": [
    [
      "sequence",
      "W tej lekcji ciąg składa się z liczb: 18, 25, 32, 39. W znanej definicji mogą to być też kształty lub inne obiekty — ważna jest kolejność i reguła."
    ],
    [
      "term",
      "18 to pierwszy term, a 25 to drugi term. W ciągu rysunków jeden cały rysunek też może być term."
    ],
    [
      "linear",
      "18, 25, 32, 39 to linear sequence: za każdym razem dodajemy tyle samo, czyli 7. W 20, 17, 14 odejmujemy po 3 — to też linear sequence."
    ],
    [
      "rule",
      "Znana definicja mówi o przejściu od jednego term do następnego. Tutaj 18 + 7 = 25, więc reguła brzmi: Add 7 each time."
    ]
  ],
  "stairs": [
    [
      "spatial",
      "Rysunki rosnących schodków tworzą spatial pattern. Policzenie kwadratów na kolejnych rysunkach daje ciąg 1, 4, 9, 16."
    ],
    [
      "square",
      "Policz kwadraty: 1, 4, 9, 16. To wyniki 1 × 1, 2 × 2, 3 × 3, 4 × 4 — dokładnie multiply an integer by itself ze znanej definicji."
    ],
    [
      "linear",
      "Liczba kwadratów 1, 4, 9, 16 nie tworzy linear sequence: dodajemy 3, potem 5, potem 7. Za to liczba stopni 2, 4, 6, 8 tworzy linear sequence: zawsze dodajemy 2."
    ]
  ],
  "rows": [
    [
      "multiple",
      "4, 8, 12, 16 to multiples of 4: wyniki 4 × 1, 4 × 2, 4 × 3, 4 × 4. W tabeli szafek te numery kończą kolumny."
    ],
    [
      "linear",
      "Trzeci rząd ma numery 3, 7, 11, 15. To linear sequence, bo dodajemy po 4. Te liczby nie są multiples of 4 — samo dodawanie po 4 nie wystarczy!"
    ]
  ],
  "squares": [
    [
      "square",
      "Multiply an integer by itself: dla 3 bierzemy 3 × 3 = 9. Zapis 3² znaczy to samo. 9 jest square number. Integer oznacza liczbę całkowitą, np. 3; w tych zadaniach używamy dodatnich liczb całkowitych."
    ]
  ],
  "sticks": [
    [
      "spatial",
      "Połączone kwadraty na kolejnych rysunkach to spatial pattern. Patrzymy, jak zmienia się rysunek, a potem liczymy jego patyczki."
    ],
    [
      "rule",
      "Liczby patyczków to 4, 7, 10, 13. Aby przejść od jednego term do następnego, dodajemy 3: Add 3 each time."
    ],
    [
      "linear",
      "Za każdym razem przybywają 3 patyczki, więc 4, 7, 10, 13 to linear sequence. Znana definicja opisuje to słowami the same amount each time."
    ]
  ],
  "triangles": [
    [
      "triangular",
      "Pamiętasz each row contains one extra dot? Rzędy mają 1, 2, 3, 4 kropki. W arkuszu kropki zastępują małe kwadraty — liczymy je tak samo. Razem we wzorze 4 jest 10."
    ],
    [
      "spatial",
      "Kolejne rysunki trójkątów tworzą spatial pattern. Liczby wszystkich pól na tych rysunkach to 1, 3, 6, 10."
    ],
    [
      "linear",
      "1, 3, 6, 10 to sequence, ale nie linear sequence. Dodajemy 2, potem 3, potem 4, a nie tę samą liczbę za każdym razem."
    ]
  ],
  "factors": [
    [
      "factor",
      "Divides exactly oznacza: dzieli bez reszty. 12 ÷ 3 = 4 i nic nie zostaje, więc 3 jest factor of 12."
    ],
    [
      "multiple",
      "Ten sam rachunek w drugą stronę: 3 × 4 = 12. Dlatego 12 jest multiple of 3. Zapamiętaj parę zdań: 3 is a factor of 12. 12 is a multiple of 3."
    ],
    [
      "prime",
      "Exactly two factors: dla 7 są to tylko 1 i 7. Dlatego 7 jest prime number. Sama nieparzystość nie wystarcza."
    ],
    [
      "composite",
      "More than two factors: dla 6 są to 1, 2, 3 i 6. Dlatego 6 jest composite number. Liczba 1 ma tylko jeden dzielnik, więc nie pasuje do żadnej z tych dwóch nazw."
    ]
  ],
  "mixed": [
    [
      "rule",
      "W poleceniu starts at 6 and increases by 8 each time reguła jest już podana: Add 8 each time. Użyj jej, aby wypisać kolejne terms."
    ],
    [
      "prime",
      "Przy wyborze prime number wróć do exactly two factors. Możesz uzasadnić: 43 has exactly two factors: 1 and 43."
    ],
    [
      "composite",
      "Przy wyborze composite number szukaj dodatkowych dzielników. Dla 44 mamy 4 × 11 = 44, więc oprócz 1 i 44 pasują też 4 i 11."
    ]
  ]
};
  const instructions = {
    sequences: [
      ['Each sequence increases by the same amount each time. Complete the missing numbers.', 'Każdy ciąg rośnie o tę samą liczbę. Uzupełnij luki. Najpierw znajdź różnicę między sąsiednimi liczbami.'],
      ['What is the term-to-term rule?', 'Jak przechodzisz od jednej liczby do następnej? Napisz np. „Add 7” (dodaj 7), a nie kolejny wyraz ciągu.'],
      ['Write the next four terms:', 'Napisz cztery kolejne wyrazy, zaczynając ZA ostatnią podaną liczbą. Term to wyraz ciągu.'],
      ['Is 74 in this sequence? Explain how you know.', 'Czy 74 należy do ciągu? Oprócz Yes/No pokaż, jak liczysz. „Yes. After 67 comes 74.” — Tak. Po 67 jest 74.']
    ],
    stairs: [
      ['How many squares will Pattern 4 have if the staircase continues in the same way?', 'Ile kwadratów będzie w czwartym wzorze, jeśli zachowamy sposób budowania? Squares to kwadraty, nie stopnie.'],
      ['What do you notice about the numbers in this sequence?', 'Co mają wspólnego te liczby? „They are square numbers.” — To liczby kwadratowe.'],
      ['Describe the rule for the number of steps.', 'Opisz regułę liczby stopni. „Add 2 each time.” — Za każdym razem dodaj 2.']
    ],
    rows: [
      ['The numbers go down each column before moving to the next column:', 'Numery biegną w dół kolumny, potem przechodzą do kolejnej. Row = poziomy rząd, column = pionowa kolumna.'],
      ['Write the first ten locker numbers in row 3:', 'Wypisz dziesięć pierwszych numerów szafek z rzędu 3. First ten oznacza dziesięć od początku.'],
      ['Explain a quick way to work it out without listing every locker.', 'Znajdź koniec pełnej kolumny blisko szukanego numeru, a potem policz dalej. Dla 46: „44 is at the bottom. 45 is in row 1, so 46 is in row 2.”'],
      ['Is the child correct? Explain.', 'Czy dziecko ma rację? Odpowiedz Yes/No i uzasadnij, podając prawidłowy rząd.']
    ],
    squares: [
      ['Find the value of each square number.', 'Oblicz każdy kwadrat liczby. 7² czytamy „seven squared”; liczymy 7 × 7.'],
      ['9² means ______ × ______, so its value is ______.', '9² oznacza __ × __, więc jego wartość to __. Wpisz dwie liczby, które mnożysz, a potem wynik. Means = oznacza, value = wartość.']
    ],
    sticks: [
      ['Each new square shares one side with the previous square.', 'Nowy kwadrat ma wspólny bok z poprzednim. Shares one side = ma jeden wspólny bok. Nie licz go drugi raz.'],
      ['Draw Pattern 5 in the space below.', 'Narysuj piąty wzór. Tutaj budujesz go przyciskami; na sprawdzianie narysuj na kartce.'],
      ['Complete the table.', 'Uzupełnij tabelę. Pattern number = numer wzoru; Number of sticks = liczba patyczków.'],
      ['How many sticks are needed for Pattern 10? Show your working.', 'Ile potrzeba patyczków? Pierwszy kwadrat ma 4. Dołącz jeszcze 9, każdy po 3 patyczki. Pokaż rachunek: „4 + 9 × 3 = 31”.']
    ],
    triangles: [
      ['Draw the next pattern (Pattern 4). Use dots or small squares.', 'Narysuj następny wzór, używając kropek lub małych kwadratów. Next = następny, dots = kropki.'],
      ['Explain how the sequence grows.', 'Wyjaśnij, jak rośnie ciąg. „Add 2, then 3, then 4, and so on.” — Dodaj 2, potem 3, potem 4 i tak dalej.'],
      ['What is the difference between the first and second terms?', 'Jaka jest różnica między pierwszym i drugim wyrazem? Odejmij pierwszy od drugiego. Difference = różnica.']
    ],
    factors: [
      ['Write all the factors of 24.', 'Wypisz WSZYSTKIE dzielniki 24. All = wszystkie; factors = dzielniki.'],
      ['Two one-digit whole numbers are both prime numbers. One is odd and one is even.', 'Szukaj dwóch liczb pierwszych zapisanych jedną cyfrą, czyli mniejszych od 10. Jedna ma być nieparzysta (odd), druga parzysta (even). Whole numbers to liczby takie jak 0, 1, 2, 3 — bez ułamków.'],
      ['Circle all the prime numbers in this list.', 'Zakreśl wszystkie liczby pierwsze. Tutaj zaznacz je dotknięciem; na papierze otocz kółkiem.'],
      ['Explain how you know that 31 is a prime number.', 'Uzasadnij: „It has exactly two factors: 1 and 31.” — Ma dokładnie dwa dzielniki.'],
      ['What is the name for a whole number greater than 1 that is not prime?', 'Jak nazywa się liczba bez ułamka, większa od 1, która nie jest pierwsza? „A composite number.” Greater than = większa niż.'],
      ['True or false? Explain your answer.', 'Prawda czy fałsz? Wybierz True/False, potem napisz dlaczego (Why?).']
    ],
    mixed: [
      ['A sequence starts at 6 and increases by 8 each time. Is 70 in the sequence? Show how you know.', 'Ciąg zaczyna się od 6 i rośnie o 8. Czy należy do niego 70? Pokaż rachunek lub wypisz wyrazy. Starts at = zaczyna się od.'],
      ['Write one prime number between 40 and 50, and one composite number between 40 and 50. Explain your choices.', 'Podaj jedną liczbę pierwszą i jedną złożoną pomiędzy 40 a 50. Uzasadnij obie. Choices = wybory. „43 has only two factors; 44 = 4 × 11.”']
    ]
  };
  const num = (label, expected) => ({ kind: 'number', label, expected });
  const written = (label, model) => ({ kind: 'written', label, model });
  const rule = (label, step) => ({ kind: 'rule', label, step, expected: `${step > 0 ? 'Add' : 'Subtract'} ${Math.abs(step)} each time.` });
  const yesno = (label, value) => ({ kind: 'choice', label, expected: value ? 'Yes' : 'No', options: ['Yes', 'No'] });
  const part = (prompt, pl, fields, visual) => ({ prompt, pl, fields, visual });
  function make(number, topic, prompt, pl, parts, hint, explanation, params = {}, visual) {
    let index = 0;
    const grouped = parts.map(p => ({ ...p, fields: p.fields.map(f => ({ ...f, label: (p.prompt.match(/^[a-z]\)/)?.[0] || '') + (p.prompt.match(/^[a-z]\)/) ? ' ' : '') + f.label, id: 'f' + index++ })) }));
    return { id: 'q' + number, number, topic, prompt, pl, parts: grouped, fields: grouped.flatMap(p => p.fields), hint, explanation, params, visual };
  }
  function memberModel(start, step, target) {
    const terms = [start];
    while (terms[terms.length - 1] < target) terms.push(terms[terms.length - 1] + step);
    const last = terms[terms.length - 1];
    return `Start at ${start}. Add ${step} each time: ${terms.join(', ')}.\n` +
      (last === target ? `Yes. I reach ${target}, so it is in the sequence.` : `No. I go from ${terms[terms.length-2]} to ${last}. I skip ${target}.`);
  }
  function rowModel(n) {
    const row = rowOf(n,4), bottom = n - row;
    if (row === 4) return `${n} = 4 × ${n/4}. It is at the bottom of a full column, in row 4.`;
    if (bottom === 0) return `The first column is 1, 2, 3, 4. Locker ${n} is in row ${row}.`;
    const next = Array.from({length:row},(_,i)=>`${bottom+i+1} is in row ${i+1}`).join(', ');
    return `${bottom} = 4 × ${bottom/4}. That is the bottom of a full column. In the next column, ${next}.`;
  }
  function sticksModel(n) {
    return `The first square uses 4 sticks. Add ${n-1} more squares, with 3 new sticks each.\n` +
      `4 + ${(Array(n-1).fill(3)).join(' + ')} = ${3*n+1}.\n` +
      `A shorter way to write it: 4 + ${n-1} × 3 = ${3*n+1}.`;
  }
  const generators = {
    q1: (rng, original) => {
      const specs = original ? [[34,9,7,[2,4,6]], [115,10,6,[0,3,5]], [7,7,6,[3,4,5]], [96,-8,6,[3,4,5]]] : [
        [integer(rng,10,40),integer(rng,3,9),7,[2,4,6]], [integer(rng,80,120),integer(rng,5,12),6,[0,3,5]],
        [integer(rng,2,12),integer(rng,2,9),6,[3,4,5]], [integer(rng,70,100),-integer(rng,3,10),6,[3,4,5]]];
      return make(1, 'sequences', 'Each sequence increases by the same amount each time. Complete the missing numbers.',
        'Każdy ciąg rośnie o tę samą liczbę. Uzupełnij brakujące liczby. Uwaga: w d) ciąg maleje — to nieścisłość arkusza.',
        specs.map(([start,step,length,missing],i) => part(`${'abcd'[i]})${i === 3 ? ' This sequence decreases by the same amount each time.' : ''}`, 'Uzupełnij luki w kolejności od lewej.',
          missing.map((j,k) => num(`Blank ${k+1}`, start+step*j)), { kind: 'sequence', values: Array.from({length},(_,j)=>missing.includes(j)?'____':start+step*j) })),
        'Sprawdź różnicę między dwiema sąsiednimi podanymi liczbami. W d) odejmuj. Jeśli brak pierwszej liczby, wykonaj działanie w drugą stronę: zamiast dodawać, odejmij.',
        specs.map(([s,d,l],i)=>`${'abcd'[i]}) ${d>0?'Add':'Subtract'} ${Math.abs(d)}: ${Array.from({length:l},(_,j)=>s+d*j).join(', ')}.`).join(' '), { specs });
    },
    q2: (rng, original) => {
      const start=original?18:integer(rng,4,25), step=original?7:integer(rng,3,9);
      const target=original?74:start+integer(rng,5,12)*step+(rng()<.5?0:1);
      return make(2,'sequences',`Look at the sequence: ${Array.from({length:4},(_,i)=>start+i*step).join(', ')}, ...`, 'Popatrz na podany ciąg.', [
        part('a) What is the term-to-term rule?', 'Jaka jest reguła przejścia między kolejnymi wyrazami?', [rule('Rule',step)]),
        part('b) Write the next four terms:', 'Napisz cztery następne wyrazy.', Array.from({length:4},(_,i)=>num(`Term ${i+1}`,start+(i+4)*step))),
        part(`c) Is ${target} in this sequence? Explain how you know.`, `Czy ${target} należy do ciągu? Uzasadnij.`, [yesno('Is it in the sequence?',(target-start)%step===0),written('Explain how you know.',memberModel(start,step,target))])
      ], 'Odejmij pierwszą liczbę od drugiej. Sprawdź, czy tyle samo dodajesz do następnej. W c) dopisuj liczby, aż dojdziesz do szukanej liczby albo ją przeskoczysz.', `Add ${step} each time. Next four terms: ${[4,5,6,7].map(i=>start+i*step).join(', ')}. ${memberModel(start,step,target)}`, {start,step,target});
    },
    q3: (rng, original) => {
      const n=original?4:integer(rng,4,7);
      return make(3,'stairs','A staircase is built in layers. Pattern 1 has 1 square. Pattern 2 has 4 squares (3 on the bottom row and 1 above the middle). Pattern 3 has 9 squares (5 on the bottom row, 3 above and 1 at the top).',
        'Schodki budujemy warstwami: wzór 1 ma 1 kwadrat; wzór 2 ma 3 na dole i 1 nad środkiem; wzór 3 ma rzędy 5, 3 i 1.', [
          part(`a) How many squares will Pattern ${n} have if the staircase continues in the same way?`, `Ile kwadratów będzie we wzorze ${n}?`, [num('Number of squares',n*n)]),
          part('b) Complete the sequence of square numbers: 1, 4, 9, ______, ______, ______', 'Uzupełnij ciąg liczb kwadratowych.', [4,5,6].map((v,i)=>num(`Blank ${i+1}`,v*v))),
          part('c) What do you notice about the numbers in this sequence?', 'Jaką własność tych liczb zauważasz?', [written('What do you notice?', 'They are square numbers: 1 × 1, 2 × 2, 3 × 3, and so on.')]),
          part('d) The number of steps in the staircases is: 2, 4, 6, ... Write the next three terms:', 'Liczba stopni to 2, 4, 6… Napisz trzy następne wyrazy.', [8,10,12].map((v,i)=>num(`Term ${i+1}`,v))),
          part('e) Describe the rule for the number of steps.', 'Opisz regułę liczby stopni.', [rule('Rule for steps',2)])
        ], 'Squares to kwadraty: licz rzędy po 1, 3, 5 i dalej, dodając po 2 do długości rzędu. Steps to stopnie: policz je z lewej i z prawej strony razem.', `Pattern ${n} has rows of ${Array.from({length:n},(_,i)=>2*i+1).join(', ')} squares.\nAdd the rows: ${Array.from({length:n},(_,i)=>2*i+1).join(' + ')} = ${n*n}.\nYou can also write ${n} × ${n} = ${n*n}.\nNext square numbers: 16, 25, 36.\nSteps on both sides: 8, 10, 12. Add 2 each time.`, {n}, {kind:'patterns',shape:'stairs',ns:[1,2,3]});
    },
    q4: (rng, original) => {
      const a=original?14:integer(rng,6,24), row=original?3:integer(rng,1,4), c=original?46:integer(rng,25,80), d=original?57:integer(rng,25,80), claim=original?2:integer(rng,1,4);
      return make(4,'rows','Lockers are arranged in four rows. The numbers go down each column before moving to the next column:', 'Szafki stoją w czterech rzędach. Numeracja biegnie w dół każdej kolumny, potem do następnej.', [
        part(`a) Locker ${a} is in which row?`, `W którym rzędzie jest szafka ${a}?`, [num('Row',rowOf(a,4))]),
        part(`b) Write the first ten locker numbers in row ${row}:`, `Napisz pierwszych dziesięć numerów w rzędzie ${row}.`, Array.from({length:10},(_,i)=>num(`Locker ${i+1}`,row+4*i))),
        part(`c) In which row would locker ${c} be? Explain a quick way to work it out without listing every locker.`, `W którym rzędzie jest szafka ${c}? Wyjaśnij szybki sposób bez wypisywania wszystkich szafek.`, [num('Row',rowOf(c,4)),written('Explain a quick way.',rowModel(c))]),
        part(`d) A child says locker ${d} is in row ${claim}. Is the child correct? Explain.`, `Dziecko mówi, że szafka ${d} jest w rzędzie ${claim}. Czy ma rację? Wyjaśnij.`, [yesno('Is the child correct?',rowOf(d,4)===claim),written('Explain.',rowModel(d))])
      ], 'W jednym rzędzie dodajemy 4. Numery 4, 8, 12 i dalej co 4 kończą kolumnę w rzędzie 4. Po każdym z nich następny numer wraca do rzędu 1.', `a) ${rowModel(a)}\nb) Row ${row}: ${Array.from({length:10},(_,i)=>row+4*i).join(', ')}. Add 4 each time.\nc) ${rowModel(c)}\nd) ${rowModel(d)}`, {a,row,c,d,claim}, {kind:'rows',rows:4,columns:5});
    },
    q5: (rng, original) => {
      const ns=original?[6,8,7,10]:shuffled([3,4,5,6,7,8,9,10,11,12],rng).slice(0,4);
      return make(5,'squares','Find the value of each square number.', 'Oblicz wartość każdego kwadratu liczby.', ns.map((n,i)=>part(`${'abcd'[i]}) ${n}² = ______`, 'Oblicz kwadrat liczby.', [num(`${n}²`,n*n)])), 'Squared oznacza liczbę pomnożoną przez nią samą, nie przez 2.', ns.map(n=>`${n}² = ${n} × ${n} = ${n*n}`).join('; '), {ns});
    },
    q6: (rng, original) => {
      const ns=original?[9,4]:shuffled([3,4,5,6,7,8,9,10],rng).slice(0,2);
      return make(6,'squares','Complete the sentences.', 'Uzupełnij zdania.', ns.map((n,i)=>part(`${'ab'[i]}) ${n}² means ______ × ______, so its value is ______.`, `${n}² oznacza __ × __, więc jego wartość to __.`, [num('First factor',n),num('Second factor',n),num('Value',n*n)])), 'Means = oznacza. Wpisz liczbę razy tę samą liczbę, potem wynik.', ns.map(n=>`${n}² means ${n} × ${n}, so its value is ${n*n}.`).join(' '), {ns});
    },
    q7: (rng, original) => {
      const build=original?5:integer(rng,5,7), far=original?10:integer(rng,8,15);
      return make(7,'sticks','A row of joined squares is made from matchsticks. Each new square shares one side with the previous square.', 'Rząd połączonych kwadratów jest zbudowany z patyczków. Każdy nowy kwadrat ma wspólny bok z poprzednim.', [
        part(`a) Draw Pattern ${build} in the space below.`, `Narysuj wzór ${build}. Tutaj zbuduj go przyciskami.`, [{kind:'sticks',label:'Build the pattern using − and +.',expected:build}]),
        part('b) Complete the table.', 'Uzupełnij tabelę: numer wzoru → liczba patyczków.', [1,2,3,4].map(n=>num(`Pattern ${n}`,3*n+1)), {kind:'answer-table'}),
        part('c) What is the term-to-term rule?', 'Jaka jest reguła przejścia?', [rule('Rule',3)]),
        part(`d) How many sticks are needed for Pattern ${far}? Show your working.`, `Ile patyczków potrzeba do wzoru ${far}? Pokaż rachunek.`, [num('Number of sticks',3*far+1),written('Show your working.',sticksModel(far))])
      ], 'Shared side to wspólny bok. Pierwszy kwadrat ma 4 patyczki, kolejne dodają po 3.', `Table: 4, 7, 10, 13. Add 3 each time.\n${sticksModel(far)}`, {build,far}, {kind:'patterns',shape:'sticks',ns:[1,2,3,4]});
    },
    q8: () => make(8,'triangles','These patterns are made from squares. The number sequence starts 1, 3, 6, ...', 'Wzory składają się z kwadratów. Ciąg zaczyna się od 1, 3, 6…', [
      part('a) Draw the next pattern (Pattern 4). Use dots or small squares.', 'Narysuj następny wzór (4), używając kropek lub kwadratów.', [{kind:'grid',label:'Draw the pattern by selecting squares. Start each row on the left.',size:4,expected:cells('triangle',4).map(p=>p.join(','))}]),
      part('b) Write the next three numbers: 1, 3, 6, ______, ______, ______', 'Wpisz trzy następne liczby.', [10,15,21].map((n,i)=>num(`Blank ${i+1}`,n))),
      part('c) Explain how the sequence grows.', 'Wyjaśnij, jak rośnie ciąg.', [written('Explain how the sequence grows.','Add 2, then 3, then 4, and so on. Each new row has one more square than the previous row.')]),
      part('d) What is the difference between the first and second terms?', 'Jaka jest różnica między pierwszym i drugim wyrazem?', [num('Difference',2)]),
      part('What is the difference between the second and third terms?', 'Jaka jest różnica między drugim i trzecim wyrazem?', [num('Difference',3)])
    ], 'Kolejne rzędy mają 1, 2, 3… pola. W następnym wzorze dodaj cały kolejny rząd.', 'Pattern 4: 1 + 2 + 3 + 4 = 10 squares. Next numbers: 10, 15, 21. Differences: 3 − 1 = 2; 6 − 3 = 3.', {}, {kind:'patterns',shape:'triangle',ns:[1,2,3]}),
    q9: (rng, original) => {
      const n=original?24:[12,18,20,24,28,30,36][integer(rng,0,6)];
      return make(9,'factors',`Write all the factors of ${n}.`, `Wypisz wszystkie dzielniki ${n}.`, [part('', '', [{kind:'set',label:'Factors',expected:factors(n)}])], 'All to wszystkie. Szukaj dwóch liczb, które po pomnożeniu dają liczbę z pytania. Zapisuj obie. Spróbuj kolejno: 1 × ?, 2 × ?, 3 × ?.', `Pairs that multiply to ${n}:\n${factors(n).filter(d=>d*d<=n).map(d=>`${d} × ${n/d} = ${n}`).join('\n')}\nCollect the numbers from the pairs. Factors of ${n}: ${factors(n).join(', ')}.`, {n});
    },
    q10: (rng, original) => {
      const n=original?28:[3,5,7][integer(rng,0,2)]*[2,4,6][integer(rng,0,2)];
      return make(10,'factors',`Two one-digit whole numbers are both prime numbers. One is odd and one is even. Both are factors of ${n}. What are the two numbers?`, `Dwie jednocyfrowe liczby całkowite są pierwsze. Jedna jest nieparzysta, druga parzysta. Obie dzielą ${n}. Jakie to liczby?`,
        [part('', '', [{kind:'prime-pair',label:'The two numbers',n}])], 'One-digit = jednocyfrowa, odd = nieparzysta, even = parzysta. Jedyna parzysta liczba pierwsza to 2.', `2 and ${[3,5,7].filter(p=>n%p===0).join(' or 2 and ')}. Both numbers are prime and divide ${n} exactly.`, {n});
    },
    q11: (rng, original) => {
      const values=original?[17,21,31,33,41,51,53,57]:shuffled([...shuffled([11,13,17,19,23,29,31,37,41,43,47,53],rng).slice(0,4),...shuffled([1,9,15,21,25,27,33,35,39,49,51,57],rng).slice(0,4)],rng);
      return make(11,'factors','Circle all the prime numbers in this list.', 'Zakreśl wszystkie liczby pierwsze na liście. Tutaj zaznacz dotknięciem.', [part('', '', [{kind:'multi',label:'Select the numbers you would circle.',options:values,expected:values.filter(prime)}])], 'Liczba pierwsza ma dokładnie dwa dodatnie dzielniki. Nie każda nieparzysta jest pierwsza. 1 nie jest pierwsza.', `Prime numbers: ${values.filter(prime).join(', ')}. ${values.filter(n=>!prime(n)).map(n=>n===1?'1 has only one factor.':`${n} = ${factors(n)[1]} × ${n/factors(n)[1]}.`).join(' ')}`, {values});
    },
    q12: (rng, original) => {
      const n=original?31:[17,19,23,29,31,37,41,43,47][integer(rng,0,8)];
      return make(12,'factors',`Explain how you know that ${n} is a prime number.`, `Wyjaśnij, skąd wiesz, że ${n} jest pierwsza.`, [part('', '', [written('Explain how you know.',`The only pair of whole numbers that multiplies to ${n} is 1 × ${n}. So its only factors are 1 and ${n}. It has exactly two factors, so it is prime.`)])], 'Spróbuj znaleźć dwie liczby, które po pomnożeniu dają liczbę z pytania. Dla liczby pierwszej pasuje tylko 1 razy ta liczba. Napisz, jakie są jej dwa dzielniki.', `Try pairs of whole numbers that multiply to ${n}. Only 1 × ${n} works. The two factors are 1 and ${n}, so ${n} is prime.`, {n});
    },
    q13: () => make(13,'factors','What is the name for a whole number greater than 1 that is not prime?', 'Jak nazywa się liczba bez ułamka, większa od 1, która nie jest pierwsza?', [part('', '', [{kind:'term',label:'Name',expected:'A composite number.'}])], 'To liczba złożona. Przypomnij sobie jej angielską nazwę.', 'A composite number has more than two factors.'),
    q14: () => make(14,'factors','True or false? Explain your answer.', 'Prawda czy fałsz? Uzasadnij odpowiedź.', [
      part('a) 1 is a prime number.', '1 jest liczbą pierwszą.', [{kind:'choice',label:'True or false?',options:['True','False'],expected:'False'},written('Why?','False. 1 has only one factor, but a prime number must have exactly two.')]),
      part('b) Every even number is composite.', 'Każda liczba parzysta jest złożona.', [{kind:'choice',label:'True or false?',options:['True','False'],expected:'False'},written('Why?','False. 2 is even, but its only factors are 1 and 2. So 2 is prime, not composite.')])
    ], 'Sprawdź liczbę dzielników 1. Pomyśl o liczbie 2, zanim zgodzisz się ze słowem every (każda).', 'Both statements are false. 1 is neither prime nor composite. 2 is the only even prime number.'),
    q15: (rng, original) => {
      const start=original?6:integer(rng,3,20), step=original?8:integer(rng,3,9), target=original?70:start+integer(rng,5,12)*step+(rng()<.5?0:1);
      return make(15,'mixed',`A sequence starts at ${start} and increases by ${step} each time. Is ${target} in the sequence? Show how you know.`, `Ciąg zaczyna się od ${start} i rośnie o ${step}. Czy ${target} do niego należy? Pokaż, skąd wiesz.`, [part('', '', [yesno('Is it in the sequence?',(target-start)%step===0),written('Show how you know.',memberModel(start,step,target))])], 'Zacznij od pierwszej liczby i dodawaj tyle, ile mówi polecenie. Dopisuj liczby, aż dojdziesz do szukanej albo ją przeskoczysz.', memberModel(start,step,target), {start,step,target});
    },
    q16: (rng, original) => {
      const n=original?8:integer(rng,6,15);
      return make(16,'mixed',`A pattern has 4 sticks in Pattern 1. Each new pattern uses 3 more sticks than the previous one. How many sticks are in Pattern ${n}?`, `Wzór 1 ma 4 patyczki. Każdy następny ma o 3 więcej. Ile jest we wzorze ${n}?`, [part('', '', [num('Number of sticks',3*n+1)])], 'Zapisz: wzór 1 ma 4 patyczki, wzór 2 ma 7, wzór 3 ma 10. Dodawaj po 3, aż dojdziesz do numeru wzoru z pytania.', sticksModel(n), {n});
    },
    q17: (rng, original) => {
      const min=original?40:[20,30,40,50][integer(rng,0,3)], max=min+10, ps=Array.from({length:9},(_,i)=>min+i+1).filter(prime);
      return make(17,'mixed',`Write one prime number between ${min} and ${max}, and one composite number between ${min} and ${max}. Explain your choices.`, `Napisz jedną liczbę pierwszą i jedną złożoną między ${min} a ${max}. Uzasadnij oba wybory.`, [part('', '', [
        {kind:'range',label:'Prime number',min,max,prime:true}, {kind:'range',label:'Composite number',min,max,prime:false},
        written('Explain your choices.',`For example: ${ps[0]} has only two factors, 1 and ${ps[0]}. ${min+2} = 2 × ${(min+2)/2}, so it is composite. Other valid choices and explanations are accepted.`)
      ])], 'Wybierz liczby większe od pierwszej liczby w pytaniu i mniejsze od drugiej. Dla prime wypisz dwa dzielniki. Dla composite pokaż mnożenie, w którym obie liczby są większe od 1.', `Possible prime numbers: ${ps.join(', ')}. One possible composite number: ${min+2} = 2 × ${(min+2)/2}.`, {min,max});
    }
  };
  const ids = Object.keys(generators);
  const topicIds = ['sequences','sequences','stairs','rows','squares','squares','sticks','triangles','factors','factors','factors','factors','factors','factors','mixed','mixed','mixed'];
  function generate(id, rng = Math.random, original = false) {
    if (!Object.hasOwn(generators,id)) throw new Error('Nieznany rodzaj zadania.');
    return generators[id](rng,original);
  }
  function practice(topic, rng = Math.random, count = 3) {
    const pool = ids.filter((id,i)=>topicIds[i]===topic);
    if (topic === 'all') return topics.map(t=>generate(shuffled(ids.filter((id,i)=>topicIds[i]===t.id),rng)[0],rng));
    if (!pool.length) throw new Error('Nieznany temat.');
    const selected=[];
    // Wszystkie warianty działu przynajmniej raz; krótsze działy: trzy pełne zadania.
    const length=Math.max(count,pool.length);
    while(selected.length<length) selected.push(...shuffled(pool,rng));
    return selected.slice(0,length).map(id=>generate(id,rng));
  }
  function examIds(topic = 'all') {
    if (topic === 'all') return [...ids];
    const selected = ids.filter((id,i)=>topicIds[i]===topic);
    if (!selected.length) throw new Error('Nieznana sekcja sprawdzianu.');
    return selected;
  }
  function exam(rng = Math.random, original = false, topic = 'all') {
    return examIds(topic).map(id=>generate(id,rng,original));
  }
  function parseInteger(raw) {
    if (typeof raw !== 'string' && typeof raw !== 'number') return null;
    const s=String(raw).trim();
    if (!/^[+-]?\d{1,6}$/.test(s)) return null;
    const n=Number(s); return Number.isSafeInteger(n)?n:null;
  }
  function sameSet(a,b) { return a.length===b.length && new Set(a).size===a.length && a.every(x=>b.includes(x)); }
  function evaluate(field,raw) {
    let valid=true, correct=false;
    if(field.kind==='written') return {valid:typeof raw==='string' && raw.trim().length>0 && raw.length<=800,correct:null,manual:true};
    if(['number','sticks','range'].includes(field.kind)) {
      const n=parseInteger(raw);valid=n!==null;
      if(valid) correct=field.kind==='range' ? n>field.min && n<field.max && (field.prime?prime(n):n>1&&!prime(n)) : n===field.expected;
    } else if(field.kind==='rule') {
      const s=typeof raw==='string'?raw.trim().toLowerCase().replace(/−/g,'-').replace(/[.!]$/,''):'';
      valid=s.length>0&&s.length<=100;
      // Jawnie ograniczony kontrakt, bez oceny swobodnego języka i bez AI.
      const m=s.match(/^(add|subtract|increase by|decrease by)\s+(\d+)(?:\s+(?:each time|every time|to get the next term))?$/);
      const signed=s.match(/^([+-])\s*(\d+)$/);
      correct=valid && (m ? Number(m[2])*(/^(subtract|decrease)/.test(m[1])?-1:1)===field.step : signed ? Number(signed[2])*(signed[1]==='-'?-1:1)===field.step : false);
    } else if(field.kind==='term') {
      const s=typeof raw==='string'?raw.trim().toLowerCase().replace(/−/g,'-').replace(/[.!]$/,''):'';
      valid=s.length>0&&s.length<=100;correct=valid&&/^(?:a )?composite(?: number)?$/.test(s);
    } else if(field.kind==='choice') {valid=field.options.includes(raw);correct=valid&&raw===field.expected;}
    else if(field.kind==='set'||field.kind==='prime-pair') {
      const s=typeof raw==='string'?raw.trim():'';
      const values=s?s.split(/[\s,;]+/).map(parseInteger):[];
      valid=s.length<=180 && values.length>0 && values.length<=100 && !values.includes(null);
      correct=valid&&(field.kind==='set'?sameSet(values,field.expected):values.length===2&&values.includes(2)&&values.some(n=>n<10&&n%2===1&&prime(n)&&field.n%n===0));
    } else if(field.kind==='multi') { valid=Array.isArray(raw)&&raw.every(v=>field.options.includes(v));correct=valid&&sameSet(raw,field.expected); }
    else if(field.kind==='grid') {
      valid=Array.isArray(raw)&&raw.length<=field.size*field.size&&raw.every(v=>typeof v==='string'&&/^\d,\d$/.test(v)&&v.split(',').every(n=>Number(n)<field.size));
      correct=valid&&sameSet(raw,field.expected);
    } else valid=false;
    return {valid,correct,manual:false};
  }
  function grade(question,answers={}) {
    const fields=question.fields.map(f=>({id:f.id,...evaluate(f,answers[f.id])}));
    const auto=fields.filter(f=>!f.manual), manual=fields.filter(f=>f.manual).length;
    const autoCorrect=auto.length>0&&auto.every(f=>f.correct);
    return {fields,correct:manual?null:autoCorrect,autoCorrect,points:auto.filter(f=>f.correct).length,total:auto.length,manual};
  }
  function expectedText(f) {
    if(f.kind==='written') return f.model;
    if(f.kind==='range') return `Any ${f.prime?'prime':'composite'} number greater than ${f.min} and less than ${f.max}`;
    if(f.kind==='prime-pair') return [3,5,7].filter(n=>f.n%n===0).map(n=>`2, ${n}`).join(' or ');
    if(f.kind==='grid') return 'Rows from the left: '+Array.from({length:f.size},(_,i)=>i+1).join(', ')+' squares';
    return Array.isArray(f.expected)?f.expected.slice().sort((a,b)=>a-b).join(', '):String(f.expected);
  }
  // Powiązania luk z polami, niezależne od DOM i wartości odpowiedzi.
  function inlineAnswers(part) {
    const fields = part.fields;
    const text = value => ({ text: String(value) });
    const slot = field => ({ fieldId: field.id });
    const scalar = f => ['number','rule','term','set','prime-pair','range'].includes(f.kind);
    if (part.visual?.kind === 'answer-table') return null;
    if (part.visual?.kind === 'sequence') {
      const values = part.visual.values;
      if (values.filter(v => /^_+$/.test(String(v))).length !== fields.length) return null;
      let i = 0;
      return [text(part.prompt + ' '), ...values.flatMap((v,j) => [
        ...(j ? [text(', ')] : []), /^_+$/.test(String(v)) ? slot(fields[i++]) : text(v)
      ])];
    }
    const gaps = part.prompt.split(/_{2,}/);
    if (gaps.length > 1 && gaps.length === fields.length + 1 && fields.every(scalar)) {
      return gaps.flatMap((value,i) => [text(value), ...(i < fields.length ? [slot(fields[i])] : [])]);
    }
    // Dwie liczby o różnym znaczeniu: pola przy odpowiednich fragmentach zdania.
    if (fields.length === 3 && fields[0].kind === 'range' && fields[1].kind === 'range' && fields[2].kind === 'written') {
      const pieces = part.prompt.split(/(one (?:prime|composite) number between \d+ and \d+)/);
      if (pieces.length === 5) return [text(pieces[0]),text(pieces[1]),slot(fields[0]),text(pieces[2]),text(pieces[3]),slot(fields[1]),text(pieces[4])];
    }
    if (fields.length === 2 && scalar(fields[0]) && fields[1].kind === 'written') {
      const split = part.prompt.search(/ (?:Explain|Show) /);
      if (split >= 0) return [text(part.prompt.slice(0,split) + ' '),slot(fields[0]),text(part.prompt.slice(split))];
    }
    if (fields.every(scalar) && (fields.length === 1 || fields.every(f=>f.kind==='number'))) {
      return [text(part.prompt + ' '), ...fields.flatMap((f,i)=>[...(i ? [text(', ')] : []),slot(f)])];
    }
    return null;
  }
  function report(questions,answers) {
    return topics.map(topic=>{
      const entries=questions.map((q,i)=>({q,i})).filter(e=>e.q.topic===topic.id);
      const results=entries.map(({q,i})=>grade(q,answers[i]));
      return {topic:topic.id,count:entries.length,correct:results.filter(r=>r.correct===true).length,
        points:results.reduce((s,r)=>s+r.points,0),total:results.reduce((s,r)=>s+r.total,0),manual:results.reduce((s,r)=>s+r.manual,0)};
    }).filter(r=>r.count);
  }
  return {definitions,definitionLinks,examIds,inlineAnswers,topics,instructions,ids,generate,practice,exam,grade,report,expectedText,factors,prime,triangular,rowOf,cells,stickSegments,parseInteger};
});
