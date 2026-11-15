// Czyste testy danych i matematyki. Bez DOM, przeglądarki i automatyzacji UI.
const assert = require('node:assert/strict');
const C = require('../public/assets/unit3/core.js');
function rng(seed) { let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;}; }
function range(a,b) {return Array.from({length:b-a+1},(_,i)=>a+i);}
// Wyrocznie niezależne od wzorów generatora: tabliczka mnożenia, dodawanie i zbiory odcinków.
function divisors(n) {const out=new Set();for(let a=1;a<=n;a++)for(let b=1;b<=n;b++)if(a*b===n){out.add(a);out.add(b);}return [...out].sort((a,b)=>a-b);}
const isPrime=n=>Number.isInteger(n)&&n>1&&divisors(n).length===2;
const triangle=n=>range(1,n).reduce((a,b)=>a+b,0);
function nth(start,step,index) {let value=start;for(let i=0;i<index;i++)value+=step;return value;}
function row(n) {let r=1;for(let i=1;i<n;i++)r=r===4?1:r+1;return r;}
function sticks(n) {const segments=new Set();for(let i=0;i<n;i++){segments.add(`v${i}`);segments.add(`v${i+1}`);segments.add(`t${i}`);segments.add(`b${i}`);}return segments.size;}
const square=n=>Array(n).fill(n).reduce((a,b)=>a+b,0);
const member=(s,d,t)=>{let n=s;while(n<t)n+=d;return n===t?'Yes':'No';};
function oracle(q) {
  const p=q.params;
  switch(q.id) {
    case 'q1':return p.specs.flatMap(([s,d,l,gaps])=>gaps.map(i=>nth(s,d,i)));
    case 'q2':return [`Add ${p.step}`,...[4,5,6,7].map(i=>nth(p.start,p.step,i)),member(p.start,p.step,p.target)];
    case 'q3':return [range(0,p.n-1).reduce((s,i)=>s+2*i+1,0),...range(4,6).map(square),8,10,12,'Add 2'];
    case 'q4':return [row(p.a),...range(0,9).map(i=>nth(p.row,4,i)),row(p.c),row(p.d)===p.claim?'Yes':'No'];
    case 'q5':return p.ns.map(square);
    case 'q6':return p.ns.flatMap(n=>[n,n,square(n)]);
    case 'q7':return [p.build,...range(1,4).map(sticks),'Add 3',sticks(p.far)];
    case 'q8':{const coords=[];for(let y=0;y<4;y++)for(let x=0;x<=y;x++)coords.push(`${x},${y}`);return [coords,...range(4,6).map(triangle),triangle(2)-triangle(1),triangle(3)-triangle(2)];}
    case 'q9':return [divisors(p.n).join(', ')];
    case 'q10':return [`2, ${divisors(p.n).find(n=>n<10&&n%2===1&&isPrime(n))}`];
    case 'q11':return [p.values.filter(isPrime)];
    case 'q12':return [];
    case 'q13':return ['A composite number'];
    case 'q14':return ['False','False'];
    case 'q15':return [member(p.start,p.step,p.target)];
    case 'q16':return [sticks(p.n)];
    case 'q17':return [range(p.min+1,p.max-1).find(isPrime),range(p.min+1,p.max-1).find(n=>!isPrime(n))];
    default:throw Error('Missing oracle: '+q.id);
  }
}
function answers(q) {const values=oracle(q);let i=0;return Object.fromEntries(q.fields.map(f=>[f.id,f.kind==='written'?'My explanation for adult review.':values[i++]]));}
let checked=0;
for(let seed=1;seed<=200;seed++) {
  const test=C.exam(rng(seed));assert.equal(test.length,17);assert.equal(new Set(test.map(q=>q.id)).size,17);
  assert.deepEqual(test.map(q=>q.number),range(1,17));assert.equal(new Set(test.map(q=>q.topic)).size,8);
  const responses=[];
  for(const q of test) {
    assert(q.hint&&q.explanation&&q.prompt&&q.pl);
    assert.deepEqual(q.parts.flatMap(p=>p.fields),q.fields);
    assert.equal(new Set(q.fields.map(f=>f.id)).size,q.fields.length);
    // W ćwiczeniu domyślnym i sprawdzianie żadnych polskich poleceń, etykiet ani opcji.
    for(const text of [q.prompt,q.explanation,...q.parts.map(p=>p.prompt),...q.fields.flatMap(f=>[f.label,...(f.options||[]),f.model||''])]) {
      assert(!/[ąćęłńóśźż]/i.test(String(text)),`${q.id}: Polish content in exercise: ${text}`);
    }
    const a=answers(q);responses.push(a);const r=C.grade(q,a);
    assert.equal(r.points,r.total,`${seed}: ${q.id}`);
    assert.equal(r.autoCorrect,r.total>0);
    assert.equal(r.correct,r.manual?null:true);
    assert.equal(r.manual,q.fields.filter(f=>f.kind==='written').length);
    assert.equal(C.grade(q,{}).points,0);
    for(const [i,f] of q.fields.entries()) {
      assert(C.expectedText(f).length>0);
      if(f.kind==='written') {
        for(const text of ['', 'wrong mathematics', '<script>alert(1)</script>']) {
          const result=C.grade(q,{...a,[f.id]:text});assert.equal(result.fields[i].correct,null);assert.equal(result.points,r.points);
        }
        assert.equal(C.grade(q,{...a,[f.id]:'x'.repeat(801)}).fields[i].valid,false);
        continue;
      }
      const bad=f.kind==='multi'?[999]:f.kind==='grid'?['99,99']:'invalid';
      const result=C.grade(q,{...a,[f.id]:bad});assert.equal(result.fields[i].correct,false);assert.equal(result.points,r.points-1);
    }
    if(q.id==='q10') for(let n=1;n<=10;n++) for(const value of [`2, ${n}`,`${n} 2`]) {
      assert.equal(C.grade(q,{f0:value}).fields[0].correct,n<10&&n%2===1&&isPrime(n)&&pDiv(q.params.n,n));
    }
    if(q.id==='q17') for(const n of range(q.params.min-1,q.params.max+1)) for(let i=0;i<2;i++) {
      const f=q.fields[i];assert.equal(C.grade(q,{...a,[f.id]:String(n)}).fields[i].correct,n>q.params.min&&n<q.params.max&&(i===0?isPrime(n):n>1&&!isPrime(n)));
    }
    if(['q9','q11','q8'].includes(q.id)) {
      const f=q.fields[0],raw=a[f.id],duplicate=Array.isArray(raw)?[...raw,raw[0]]:raw+', 1';
      assert.equal(C.grade(q,{...a,[f.id]:duplicate}).fields[0].correct,false);
    }
    checked++;
  }
  const report=C.report(test,responses);assert(report.every(r=>r.points===r.total));
  const blanks=C.report(test,test.map(()=>({})));assert(blanks.every(r=>r.points===0&&r.correct===0));
  assert.equal(report.reduce((s,r)=>s+r.count,0),17);
  assert.equal(report.reduce((s,r)=>s+r.manual,0),11);
}
function pDiv(n,d){return n%d===0;}
// Oryginalne liczby i sformułowania DOCX są dostępne obok wariantów losowych.
const original=C.exam(rng(1),true);
assert.deepEqual(original,C.exam(rng(99),true));
assert.equal(original[0].prompt,'Each sequence increases by the same amount each time. Complete the missing numbers.');
assert.equal(original[1].prompt,'Look at the sequence: 18, 25, 32, 39, ...');
assert.deepEqual(original[1].parts.map(p=>p.prompt),['a) What is the term-to-term rule?','b) Write the next four terms:','c) Is 74 in this sequence? Explain how you know.']);
assert.deepEqual(original[1].parts[1].fields.map(f=>f.expected),[46,53,60,67]);
assert.equal(original[1].parts[2].fields[0].expected,'Yes');
assert.equal(original[1].parts[2].fields[1].kind,'written');
assert.deepEqual(original[4].fields.map(f=>f.expected),[36,64,49,100]);
assert.deepEqual(original[5].fields.map(f=>f.expected),[9,9,81,4,4,16]);
assert.equal(original[6].parts[3].prompt,'d) How many sticks are needed for Pattern 10? Show your working.');
assert.equal(original[11].fields[0].kind,'written');
assert.equal(C.grade(original[11],{f0:'31 is odd.'}).correct,null);
assert.equal(C.grade(original[11],{f0:'31 is odd.'}).total,0);
assert.equal(original[16].prompt,'Write one prime number between 40 and 50, and one composite number between 40 and 50. Explain your choices.');
for(const q of original)assert.equal(C.grade(q,answers(q)).points,C.grade(q,answers(q)).total);
// Kontrakt powiązania luk z odpowiedziami: czyste dane, bez DOM i testowania UI.
for (let seed=1;seed<=20;seed++) for (const q of C.exam(rng(seed))) for (const p of q.parts) {
  const effective = !p.prompt && q.parts.length===1 ? {...p,prompt:q.prompt} : p;
  const tokens=C.inlineAnswers(effective);
  if (!tokens) continue;
  const slots=tokens.filter(t=>t.fieldId).map(t=>t.fieldId);
  assert.equal(new Set(slots).size,slots.length,`${q.id}: repeated field`);
  assert(slots.every(id=>p.fields.some(f=>f.id===id)),`${q.id}: unknown field`);
  assert.deepEqual(slots,p.fields.filter(f=>f.kind!=='written').map(f=>f.id),`${q.id}: field order`);
  assert(!tokens.some(t=>t.text&&/_{2,}/.test(t.text)),`${q.id}: unfilled placeholder`);
  assert(tokens.every(t=>Object.keys(t).length===1),'No answers in layout tokens');
}
const inlineText=p=>C.inlineAnswers(p).map(t=>t.fieldId?`[${t.fieldId}]`:t.text).join('');
assert.equal(inlineText(original[4].parts[0]),'a) 6² = [f0]');
assert.equal(inlineText(original[5].parts[0]),'a) 9² means [f0] × [f1], so its value is [f2].');
assert.equal(inlineText(original[0].parts[0]),'a) 34, 43, [f0], 61, [f1], 79, [f2]');
assert.equal(inlineText(original[0].parts[1]),'b) [f3], 125, 135, [f4], 155, [f5]');
assert.equal(inlineText(original[1].parts[1]),'b) Write the next four terms: [f1], [f2], [f3], [f4]');
assert.equal(inlineText(original[2].parts[1]),'b) Complete the sequence of square numbers: 1, 4, 9, [f1], [f2], [f3]');
assert.equal(inlineText(original[7].parts[1]),'b) Write the next three numbers: 1, 3, 6, [f1], [f2], [f3]');
assert.equal(inlineText(original[3].parts[2]),'c) In which row would locker 46 be? [f11] Explain a quick way to work it out without listing every locker.');
assert.equal(C.inlineAnswers(original[6].parts[1]),null); // tabela ma własne komórki
assert.equal(C.inlineAnswers(original[7].parts[0]),null); // siatka pozostaje interaktywna
const rangePart={...original[16].parts[0],prompt:original[16].prompt};
assert.equal(inlineText(rangePart),'Write one prime number between 40 and 50[f0], and one composite number between 40 and 50[f1]. Explain your choices.');
// Reguły mają jawny, ograniczony format; nie oceniamy dowolnej angielskiej prozy.
const ruleQ=original[1];
for(const value of ['Add 7','add 7 each time.','Increase by 7','+7','+ 7','ADD 7 EVERY TIME','add 7 to get the next term'])assert.equal(C.grade(ruleQ,{f0:value}).fields[0].correct,true,value);
for(const value of ['7','add 8','multiply by 7','subtract 7','add 7 sometimes','Dodaj 7','<script>'])assert.equal(C.grade(ruleQ,{f0:value}).fields[0].correct,false,value);
for(const value of ['composite','Composite number','A composite number.'])assert.equal(C.grade(original[12],{f0:value}).correct,true);
for(const value of ['prime','złożona','composite numbers',''])assert.equal(C.grade(original[12],{f0:value}).correct,false);
for(const value of ['2, 2','2, 14','7, 2, 3','-2, 7','2.0, 7'])assert.equal(C.grade(original[9],{f0:value}).correct,false);
// Matematyka geometrii, bez renderowania ani testowania interfejsu.
for(let n=1;n<=15;n++) {
  assert.equal(C.triangular(n),triangle(n));
  for(const kind of ['stairs','triangle','square']) {
    const coords=C.cells(kind,n),expected=kind==='triangle'?triangle(n):square(n);
    assert.equal(coords.length,expected);assert.equal(new Set(coords.map(p=>p.join(','))).size,expected);
    for(let y=0;y<n;y++)assert.equal(coords.filter(p=>p[1]===y).length,kind==='stairs'?2*y+1:kind==='triangle'?y+1:n);
  }
  const seg=C.stickSegments(n);assert.equal(seg.length,sticks(n));assert.equal(new Set(seg.map(p=>p.join(','))).size,seg.length);
}
for(let n=1;n<=100;n++){assert.deepEqual(C.factors(n),divisors(n));assert.equal(C.prime(n),isPrime(n));assert.equal(C.rowOf(n,4),row(n));}
for(const invalid of ['', ' ', null, undefined, true, [], {}, '1e2', 'Infinity', 'NaN', '3.5', '3,5', '12x','1234567'])assert.equal(C.parseInteger(invalid),null);
assert.equal(C.parseInteger(' 0049 '),49);assert.equal(C.parseInteger('-8'),-8);
for(const topic of C.topics) {
  const practice=C.practice(topic.id,rng(4)),pool=C.ids.filter(id=>C.generate(id,rng(1)).topic===topic.id);
  assert.equal(practice.length,Math.max(3,pool.length));assert(practice.every(q=>q.topic===topic.id));
  assert.equal(new Set(practice.slice(0,pool.length).map(q=>q.id)).size,pool.length);
  assert(C.instructions[topic.id].length>=2);
}
assert.equal(new Set(C.practice('all',rng(4)).map(q=>q.topic)).size,8);
assert.notDeepEqual(C.exam(rng(1)).map(q=>q.params),C.exam(rng(2)).map(q=>q.params));
assert.throws(()=>C.generate('unknown'));assert.throws(()=>C.generate('toString'));assert.throws(()=>C.practice('unknown'));
// Niezależna weryfikacja całego klucza oryginalnego arkusza (zadania 1–17).
assert.deepEqual([2,4,6].map(i=>nth(34,9,i)),[52,70,88]);
assert.deepEqual([0,3,5].map(i=>nth(115,10,i)),[115,145,165]);
assert.deepEqual([3,4,5].map(i=>nth(7,7,i)),[28,35,42]);
assert.deepEqual([3,4,5].map(i=>nth(96,-8,i)),[72,64,56]);
assert.deepEqual([4,5,6,7].map(i=>nth(18,7,i)),[46,53,60,67]);
assert.equal(nth(18,7,8),74); // Klucz zawiera sprzeczne „not” i „yes”.
assert.equal(C.cells('stairs',4).length,16);
assert.deepEqual([4,5,6].map(n=>C.cells('stairs',n).length),[16,25,36]);
assert.deepEqual([4,5,6].map(n=>n+n),[8,10,12]);
assert.equal(row(14),2);assert.deepEqual(range(0,9).map(i=>nth(3,4,i)),[3,7,11,15,19,23,27,31,35,39]);assert.equal(row(46),2);assert.equal(row(57),1);
assert.deepEqual([6,8,7,10].map(n=>C.cells('square',n).length),[36,64,49,100]); // Nie 121 i 144.
assert.equal(C.cells('square',9).length,81);assert.equal(C.cells('square',4).length,16); // Nie 10×10.
assert.equal(sticks(5),16);assert.deepEqual([1,2,3,4].map(sticks),[4,7,10,13]);assert.equal(sticks(10),31);
assert.deepEqual([4,5,6].map(triangle),[10,15,21]);assert.deepEqual([triangle(2)-triangle(1),triangle(3)-triangle(2)],[2,3]);
assert.deepEqual(divisors(24),[1,2,3,4,6,8,12,24]);assert.deepEqual(divisors(28).filter(n=>n<10&&isPrime(n)),[2,7]);
assert.deepEqual([17,21,31,33,41,51,53,57].filter(isPrime),[17,31,41,53]);assert.deepEqual(divisors(31),[1,31]);
assert.equal(isPrime(1),false);assert.equal(isPrime(2),true);assert(divisors(4).length>2);
assert.equal(nth(6,8,8),70);assert.equal(sticks(8),25);assert.deepEqual(range(41,49).filter(isPrime),[41,43,47]);assert.deepEqual(divisors(44),[1,2,4,11,22,44]);
console.log(`OK: ${checked} zadań losowych + oryginalny arkusz 1–17; 8 działów; angielskie polecenia, podpunkty, ocena, 11 uzasadnień bez automatycznej oceny, geometria, raport i klucz. Bez DOM i przeglądarki.`);
