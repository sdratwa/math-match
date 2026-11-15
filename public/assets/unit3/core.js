/* Cambridge Unit 3: czysta logika matematyczna, bez DOM, sieci i danych profili. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Unit3 = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const topics = [
    { id: 'sequences', title: 'Ciągi liczbowe', en: 'Number sequences', icon: '🔢',
      text: ['Ciąg (sequence) to liczby zapisane w ustalonej kolejności. Każda liczba to wyraz (term).', 'Reguła przejścia (term-to-term rule) mówi, co robisz, aby otrzymać następny wyraz. Sprawdź różnicę między sąsiednimi liczbami. Ciąg może rosnąć albo maleć.'],
      example: '18, 25, 32, 39… Dodajemy 7. Dalej: 46, 53, 60, 67, 74. Liczba 74 należy do tego ciągu: od 18 wykonujemy 8 skoków po 7.',
      tip: 'Nie sprawdzaj tylko, czy liczba dzieli się przez krok. Najpierw odejmij pierwszy wyraz.', diagram: { kind: 'sequence', values: [18, 25, 32, 39], step: 7 } },
    { id: 'stairs', title: 'Schodki i rosnące wzory', en: 'Growing patterns and staircases', icon: '🪜',
      text: ['W tym arkuszu schodki są symetryczne: na górze 1 kwadrat, pod nim 3, potem 5 i tak dalej.', 'Wzór numer 3 ma 1 + 3 + 5 = 9 kwadratów. Wzór numer n ma n × n kwadratów — to liczba kwadratowa (square number).', 'Arkusz liczy stopnie po obu zewnętrznych stronach: 2, 4, 6… We wzorze numer n jest 2 × n takich stopni. Nie myl stopni z liczbą kwadratów!'],
      example: 'Wzór 4: 1 + 3 + 5 + 7 = 16 kwadratów i 8 zewnętrznych stopni. Kolejne liczby kwadratów: 1, 4, 9, 16, 25, 36.',
      tip: 'Każda nowa warstwa ma o 2 kwadraty więcej niż poprzednia.', diagram: { kind: 'stairs', n: 4 } },
    { id: 'rows', title: 'Szafki w rzędach', en: 'Numbering in rows', icon: '🗄️',
      text: ['Rząd (row) jest poziomy, a kolumna (column) pionowa. Tutaj numerujemy W DÓŁ kolumny, a potem przechodzimy w prawo.', 'Przy 4 rzędach w każdym rzędzie dodajemy 4: rząd 3 to 3, 7, 11, 15…', 'Reszta (remainder) z dzielenia przez 4 wskazuje rząd. Uwaga: reszta 0 oznacza ostatni, czyli czwarty rząd.'],
      example: '46 = 11 × 4 + 2 → rząd 2. 57 = 14 × 4 + 1 → rząd 1. 20 = 5 × 4 → rząd 4.',
      tip: 'Możesz wykreślać pełne kolumny po 4 szafki i sprawdzić, ile zostaje.', diagram: { kind: 'rows', rows: 4, columns: 5 } },
    { id: 'squares', title: 'Kwadraty liczb i potęgi', en: 'Squares and powers', icon: '🟪',
      text: ['Kwadrat liczby (square) oznacza pomnożenie liczby przez nią samą. Mała dwójka to wykładnik (exponent).', '7² czytamy „seven squared”. To 7 × 7 = 49, a nie 7 × 2.', 'Kwadrat z 4 rzędami i 4 kolumnami ma 4 × 4 = 16 małych pól.'],
      example: '6² = 36, 8² = 64, 7² = 49, 10² = 100. 9² = 9 × 9 = 81. 4² = 4 × 4 = 16.',
      tip: 'Zapisz mnożenie, zanim policzysz wynik potęgi.', diagram: { kind: 'square', n: 4 } },
    { id: 'sticks', title: 'Wzory z patyczków', en: 'Patterns made from sticks', icon: '🧩',
      text: ['Pierwszy kwadrat potrzebuje 4 patyczków (sticks). Każdy dołączony kwadrat ma jeden wspólny bok (shared side) z poprzednim.', 'Dodajemy więc tylko 3 nowe patyczki. Kolejne liczby: 4, 7, 10, 13…', 'Dla n kwadratów: 4 + (n − 1) × 3. Odejmujemy 1, bo pierwszy kwadrat już policzyliśmy.'],
      example: 'Wzór 10: 4 + 9 × 3 = 31 patyczków. Wzór 8: 4 + 7 × 3 = 25.',
      tip: 'Nie mnożymy liczby połączonych kwadratów przez 4 — wspólnych boków nie liczymy dwa razy.', diagram: { kind: 'sticks', n: 4 } },
    { id: 'triangles', title: 'Liczby trójkątne', en: 'Triangular number patterns', icon: '🔺',
      text: ['Układ trójkątny ma rzędy długości 1, 2, 3 i tak dalej. To inny wzór niż symetryczne schodki!', 'Liczby trójkątne (triangular numbers) to 1, 3, 6, 10, 15, 21…', 'Dodajemy kolejno 2, potem 3, potem 4… Przyrost nie jest stały.'],
      example: 'Wzór 4 ma 1 + 2 + 3 + 4 = 10 pól. Różnica 3 − 1 = 2, a 6 − 3 = 3.',
      tip: 'Aby otrzymać następny wzór, dodaj cały nowy rząd.', diagram: { kind: 'triangle', n: 4 } },
    { id: 'factors', title: 'Dzielniki i liczby pierwsze', en: 'Factors and prime numbers', icon: '🔍',
      text: ['Dzielnik (factor) dzieli liczbę bez reszty. Szukaj par: 24 = 1 × 24 = 2 × 12 = 3 × 8 = 4 × 6.', 'Liczba pierwsza (prime number) ma dokładnie dwa dodatnie dzielniki: 1 i siebie. Liczba złożona (composite number) jest większa od 1 i ma więcej niż dwa dzielniki.', '1 nie jest ani pierwsza, ani złożona. 2 jest jedyną parzystą liczbą pierwszą.'],
      example: 'Dzielniki 24: 1, 2, 3, 4, 6, 8, 12, 24. Pierwsze dzielniki 28 to 2 i 7. 31 jest pierwsza: nie dzieli się przez 2, 3 ani 5; większy najmniejszy dzielnik nie jest potrzebny, bo 6 × 6 > 31.',
      tip: 'Sama nieparzystość nie wystarcza: 21 = 3 × 7 jest liczbą złożoną.' },
    { id: 'mixed', title: 'Wyzwanie mieszane', en: 'Mixed challenge', icon: '⭐',
      text: ['Przeczytaj polecenie i wybierz sposób: skoki w ciągu, wspólne boki czy dzielniki?', 'Sprawdź wynik innym sposobem. Możesz zapisać rachunki na kartce.', 'W odpowiedziach otwartych może być kilka dobrych liczb. Każda spełniająca warunki jest poprawna.'],
      example: '6, 14, 22… zawiera 70, bo 70 − 6 = 64 = 8 × 8. Między 40 a 50 liczby pierwsze to 41, 43, 47; np. 44 jest złożona, bo 44 = 4 × 11.',
      tip: 'Przy liczbach pierwszych znajdź dzielniki, a przy ciągu sprawdź pierwszy wyraz i wielkość skoku.' }
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
  const instructions = {
    sequences: [
      ['Each sequence increases by the same amount each time. Complete the missing numbers.', 'Każdy ciąg rośnie o tę samą liczbę. Uzupełnij luki. Najpierw znajdź różnicę między sąsiednimi liczbami.'],
      ['What is the term-to-term rule?', 'Jak przechodzisz od jednej liczby do następnej? Napisz np. „Add 7” (dodaj 7), a nie kolejny wyraz ciągu.'],
      ['Write the next four terms:', 'Napisz cztery kolejne wyrazy, zaczynając ZA ostatnią podaną liczbą. Term to wyraz ciągu.'],
      ['Is 74 in this sequence? Explain how you know.', 'Czy 74 należy do ciągu? Oprócz Yes/No podaj rachunek lub wyjaśnienie. „Yes, because 74 = 18 + 8 × 7.”']
    ],
    stairs: [
      ['How many squares will Pattern 4 have if the staircase continues in the same way?', 'Ile kwadratów będzie w czwartym wzorze, jeśli zachowamy sposób budowania? Squares to kwadraty, nie stopnie.'],
      ['What do you notice about the numbers in this sequence?', 'Jaką własność widzisz? „They are square numbers.” — To liczby kwadratowe.'],
      ['Describe the rule for the number of steps.', 'Opisz regułę liczby stopni. „Add 2 each time.” — Za każdym razem dodaj 2.']
    ],
    rows: [
      ['The numbers go down each column before moving to the next column:', 'Numery biegną w dół kolumny, potem przechodzą do kolejnej. Row = poziomy rząd, column = pionowa kolumna.'],
      ['Write the first ten locker numbers in row 3:', 'Wypisz dziesięć pierwszych numerów szafek z rzędu 3. First ten oznacza dziesięć od początku.'],
      ['Explain a quick way to work it out without listing every locker.', 'Wyjaśnij szybki sposób bez wypisywania wszystkich szafek. „Divide by 4. The remainder tells me the row.” Remainder = reszta.'],
      ['Is the child correct? Explain.', 'Czy dziecko ma rację? Odpowiedz Yes/No i uzasadnij, podając prawidłowy rząd.']
    ],
    squares: [
      ['Find the value of each square number.', 'Oblicz każdy kwadrat liczby. 7² czytamy „seven squared”; liczymy 7 × 7.'],
      ['9² means ______ × ______, so its value is ______.', '9² oznacza __ × __, więc jego wartość to __. Wpisz dwa czynniki oraz wynik. Means = oznacza, value = wartość.']
    ],
    sticks: [
      ['Each new square shares one side with the previous square.', 'Nowy kwadrat ma wspólny bok z poprzednim. Shares one side = ma jeden wspólny bok. Nie licz go drugi raz.'],
      ['Draw Pattern 5 in the space below.', 'Narysuj piąty wzór. Tutaj budujesz go przyciskami; na sprawdzianie narysuj na kartce.'],
      ['Complete the table.', 'Uzupełnij tabelę. Pattern number = numer wzoru; Number of sticks = liczba patyczków.'],
      ['How many sticks are needed for Pattern 10? Show your working.', 'Ile potrzeba patyczków? Pokaż rachunek, np. „4 + 9 × 3 = 31”. Sama liczba nie wystarczy.']
    ],
    triangles: [
      ['Draw the next pattern (Pattern 4). Use dots or small squares.', 'Narysuj następny wzór, używając kropek lub małych kwadratów. Next = następny, dots = kropki.'],
      ['Explain how the sequence grows.', 'Wyjaśnij, jak rośnie ciąg. „Add 2, then 3, then 4, and so on.” — Dodaj 2, potem 3, potem 4 i tak dalej.'],
      ['What is the difference between the first and second terms?', 'Jaka jest różnica między pierwszym i drugim wyrazem? Odejmij pierwszy od drugiego. Difference = różnica.']
    ],
    factors: [
      ['Write all the factors of 24.', 'Wypisz WSZYSTKIE dzielniki 24. All = wszystkie; factors = dzielniki.'],
      ['Two one-digit whole numbers are both prime numbers. One is odd and one is even.', 'Dwie jednocyfrowe liczby całkowite są pierwsze. Jedna jest nieparzysta (odd), druga parzysta (even). One-digit = jednocyfrowa.'],
      ['Circle all the prime numbers in this list.', 'Zakreśl wszystkie liczby pierwsze. Tutaj zaznacz je dotknięciem; na papierze otocz kółkiem.'],
      ['Explain how you know that 31 is a prime number.', 'Uzasadnij: „It has exactly two factors: 1 and 31.” — Ma dokładnie dwa dzielniki.'],
      ['What is the name for a whole number greater than 1 that is not prime?', 'Jak nazywa się liczba całkowita większa od 1, która nie jest pierwsza? „A composite number.” Greater than = większa niż.'],
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
    const delta = target - start;
    return delta % step === 0 ? `Yes. ${target} = ${start} + ${delta / step} × ${step}, so I reach it after ${delta / step} jumps.` : `No. ${target} − ${start} = ${delta}, which is not a multiple of ${step}. It falls between ${start + Math.floor(delta / step) * step} and ${start + Math.ceil(delta / step) * step}.`;
  }
  function rowModel(n) { return `${n} ÷ 4 leaves remainder ${n % 4}. ${n % 4 === 0 ? 'Remainder 0 means row 4.' : `So it is in row ${n % 4}.`}`; }
  const generators = {
    q1: (rng, original) => {
      const specs = original ? [[34,9,7,[2,4,6]], [115,10,6,[0,3,5]], [7,7,6,[3,4,5]], [96,-8,6,[3,4,5]]] : [
        [integer(rng,10,40),integer(rng,3,9),7,[2,4,6]], [integer(rng,80,120),integer(rng,5,12),6,[0,3,5]],
        [integer(rng,2,12),integer(rng,2,9),6,[3,4,5]], [integer(rng,70,100),-integer(rng,3,10),6,[3,4,5]]];
      return make(1, 'sequences', 'Each sequence increases by the same amount each time. Complete the missing numbers.',
        'Każdy ciąg rośnie o tę samą liczbę. Uzupełnij brakujące liczby. Uwaga: w d) ciąg maleje — to nieścisłość arkusza.',
        specs.map(([start,step,length,missing],i) => part(`${'abcd'[i]})${i === 3 ? ' This sequence decreases by the same amount each time.' : ''}`, 'Uzupełnij luki w kolejności od lewej.',
          missing.map((j,k) => num(`Blank ${k+1}`, start+step*j)), { kind: 'sequence', values: Array.from({length},(_,j)=>missing.includes(j)?'____':start+step*j) })),
        'Sprawdź różnicę między dwiema sąsiednimi podanymi liczbami. W d) odejmuj. Brak pierwszego wyrazu wymaga cofnięcia się o krok.',
        specs.map(([s,d,l],i)=>`${'abcd'[i]}) ${d>0?'Add':'Subtract'} ${Math.abs(d)}: ${Array.from({length:l},(_,j)=>s+d*j).join(', ')}.`).join(' '), { specs });
    },
    q2: (rng, original) => {
      const start=original?18:integer(rng,4,25), step=original?7:integer(rng,3,9);
      const target=original?74:start+integer(rng,5,12)*step+(rng()<.5?0:1);
      return make(2,'sequences',`Look at the sequence: ${Array.from({length:4},(_,i)=>start+i*step).join(', ')}, ...`, 'Popatrz na podany ciąg.', [
        part('a) What is the term-to-term rule?', 'Jaka jest reguła przejścia między kolejnymi wyrazami?', [rule('Rule',step)]),
        part('b) Write the next four terms:', 'Napisz cztery następne wyrazy.', Array.from({length:4},(_,i)=>num(`Term ${i+1}`,start+(i+4)*step))),
        part(`c) Is ${target} in this sequence? Explain how you know.`, `Czy ${target} należy do ciągu? Uzasadnij.`, [yesno('Is it in the sequence?',(target-start)%step===0),written('Explain how you know.',memberModel(start,step,target))])
      ], 'Term-to-term rule opisuje zmianę, np. „Add …”. Sprawdź różnicę. Dla c) odejmij początek od szukanej liczby i sprawdź podzielność przez krok.', `Add ${step} each time. Next four terms: ${[4,5,6,7].map(i=>start+i*step).join(', ')}. ${memberModel(start,step,target)}`, {start,step,target});
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
        ], 'Squares to kwadraty, steps to stopnie obu zewnętrznych stron. Kwadraty liczymy n × n, stopnie 2 × n.', `Pattern ${n}: ${n} × ${n} = ${n*n} squares. Square numbers: 16, 25, 36. Steps: 8, 10, 12; add 2 each time.`, {n}, {kind:'patterns',shape:'stairs',ns:[1,2,3]});
    },
    q4: (rng, original) => {
      const a=original?14:integer(rng,6,24), row=original?3:integer(rng,1,4), c=original?46:integer(rng,25,80), d=original?57:integer(rng,25,80), claim=original?2:integer(rng,1,4);
      return make(4,'rows','Lockers are arranged in four rows. The numbers go down each column before moving to the next column:', 'Szafki stoją w czterech rzędach. Numeracja biegnie w dół każdej kolumny, potem do następnej.', [
        part(`a) Locker ${a} is in which row?`, `W którym rzędzie jest szafka ${a}?`, [num('Row',rowOf(a,4))]),
        part(`b) Write the first ten locker numbers in row ${row}:`, `Napisz pierwszych dziesięć numerów w rzędzie ${row}.`, Array.from({length:10},(_,i)=>num(`Locker ${i+1}`,row+4*i))),
        part(`c) In which row would locker ${c} be? Explain a quick way to work it out without listing every locker.`, `W którym rzędzie jest szafka ${c}? Wyjaśnij szybki sposób bez wypisywania wszystkich szafek.`, [num('Row',rowOf(c,4)),written('Explain a quick way.',rowModel(c))]),
        part(`d) A child says locker ${d} is in row ${claim}. Is the child correct? Explain.`, `Dziecko mówi, że szafka ${d} jest w rzędzie ${claim}. Czy ma rację? Wyjaśnij.`, [yesno('Is the child correct?',rowOf(d,4)===claim),written('Explain.',rowModel(d))])
      ], 'W jednym rzędzie dodajemy 4. Reszta z dzielenia numeru przez 4 wskazuje rząd; reszta 0 oznacza rząd 4.', `${rowModel(a)} Row ${row}: ${Array.from({length:10},(_,i)=>row+4*i).join(', ')}. ${rowModel(c)} ${rowModel(d)}`, {a,row,c,d,claim}, {kind:'rows',rows:4,columns:5});
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
        part(`d) How many sticks are needed for Pattern ${far}? Show your working.`, `Ile patyczków potrzeba do wzoru ${far}? Pokaż rachunek.`, [num('Number of sticks',3*far+1),written('Show your working.',`4 + (${far} − 1) × 3 = ${3*far+1}.`)])
      ], 'Shared side to wspólny bok. Pierwszy kwadrat ma 4 patyczki, kolejne dodają po 3.', `Table: 4, 7, 10, 13. Add 3 each time. Pattern ${far}: 4 + ${far-1} × 3 = ${3*far+1} sticks.`, {build,far}, {kind:'patterns',shape:'sticks',ns:[1,2,3,4]});
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
      return make(9,'factors',`Write all the factors of ${n}.`, `Wypisz wszystkie dzielniki ${n}.`, [part('', '', [{kind:'set',label:'Factors',expected:factors(n)}])], 'All to wszystkie. Szukaj par mnożenia, zaczynając od 1 i samej liczby.', `Factors of ${n}: ${factors(n).join(', ')}.`, {n});
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
      return make(12,'factors',`Explain how you know that ${n} is a prime number.`, `Wyjaśnij, skąd wiesz, że ${n} jest pierwsza.`, [part('', '', [written('Explain how you know.',`${n} has exactly two factors: 1 and ${n}. It is not divisible by 2, 3 or 5; 7 × 7 is greater than ${n}.`)])], 'Nie wystarczy napisać, że liczba jest nieparzysta. Uzasadnij liczbą dzielników.', `Prime means exactly two factors: 1 and the number itself. For ${n}, check divisibility by 2, 3 and 5.`, {n});
    },
    q13: () => make(13,'factors','What is the name for a whole number greater than 1 that is not prime?', 'Jak nazywa się liczba całkowita większa od 1, która nie jest pierwsza?', [part('', '', [{kind:'term',label:'Name',expected:'A composite number.'}])], 'To liczba złożona. Przypomnij sobie jej angielską nazwę.', 'A composite number has more than two factors.'),
    q14: () => make(14,'factors','True or false? Explain your answer.', 'Prawda czy fałsz? Uzasadnij odpowiedź.', [
      part('a) 1 is a prime number.', '1 jest liczbą pierwszą.', [{kind:'choice',label:'True or false?',options:['True','False'],expected:'False'},written('Why?','False. 1 has only one factor, but a prime number must have exactly two.')]),
      part('b) Every even number is composite.', 'Każda liczba parzysta jest złożona.', [{kind:'choice',label:'True or false?',options:['True','False'],expected:'False'},written('Why?','False. 2 is even and prime, so it is a counterexample.')])
    ], 'Sprawdź liczbę dzielników 1. Pomyśl o liczbie 2, zanim zgodzisz się ze słowem every (każda).', 'Both statements are false. 1 is neither prime nor composite. 2 is the only even prime number.'),
    q15: (rng, original) => {
      const start=original?6:integer(rng,3,20), step=original?8:integer(rng,3,9), target=original?70:start+integer(rng,5,12)*step+(rng()<.5?0:1);
      return make(15,'mixed',`A sequence starts at ${start} and increases by ${step} each time. Is ${target} in the sequence? Show how you know.`, `Ciąg zaczyna się od ${start} i rośnie o ${step}. Czy ${target} do niego należy? Pokaż, skąd wiesz.`, [part('', '', [yesno('Is it in the sequence?',(target-start)%step===0),written('Show how you know.',memberModel(start,step,target))])], 'Odejmij pierwszy wyraz od szukanej liczby i sprawdź, czy wynik jest wielokrotnością kroku.', memberModel(start,step,target), {start,step,target});
    },
    q16: (rng, original) => {
      const n=original?8:integer(rng,6,15);
      return make(16,'mixed',`A pattern has 4 sticks in Pattern 1. Each new pattern uses 3 more sticks than the previous one. How many sticks are in Pattern ${n}?`, `Wzór 1 ma 4 patyczki. Każdy następny ma o 3 więcej. Ile jest we wzorze ${n}?`, [part('', '', [num('Number of sticks',3*n+1)])], 'Pierwszy wzór już ma 4 patyczki. Do wzoru n wykonujesz n − 1 skoków.', `4 + (${n} − 1) × 3 = ${3*n+1}.`, {n});
    },
    q17: (rng, original) => {
      const min=original?40:[20,30,40,50][integer(rng,0,3)], max=min+10, ps=Array.from({length:9},(_,i)=>min+i+1).filter(prime);
      return make(17,'mixed',`Write one prime number between ${min} and ${max}, and one composite number between ${min} and ${max}. Explain your choices.`, `Napisz jedną liczbę pierwszą i jedną złożoną między ${min} a ${max}. Uzasadnij oba wybory.`, [part('', '', [
        {kind:'range',label:'Prime number',min,max,prime:true}, {kind:'range',label:'Composite number',min,max,prime:false},
        written('Explain your choices.',`For example: ${ps[0]} has only two factors, 1 and ${ps[0]}. ${min+2} = 2 × ${(min+2)/2}, so it is composite. Other valid choices and explanations are accepted.`)
      ])], 'Between oznacza tutaj pomiędzy granicami. Dla pierwszej podaj dwa dzielniki, dla złożonej mnożenie liczb większych od 1.', `Possible prime numbers: ${ps.join(', ')}. One possible composite number: ${min+2} = 2 × ${(min+2)/2}.`, {min,max});
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
  function exam(rng = Math.random, original = false) { return ids.map(id=>generate(id,rng,original)); }
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
  return {inlineAnswers,topics,instructions,ids,generate,practice,exam,grade,report,expectedText,factors,prime,triangular,rowOf,cells,stickSegments,parseInteger};
});
