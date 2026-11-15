// Testy danych zapisu i odtworzenia, bez DOM, przeglądarki ani emulacji UI.
const assert = require('node:assert/strict');
const C = require('../public/assets/unit3/core.js');
const D = require('../public/assets/unit3/draft.js');
// Opcjonalne właściwości undefined (np. visual) nie występują w JSON.
const snapshot = value => JSON.parse(JSON.stringify(value));
function memory() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function activity(mode, topic, original) {
  let seed = 42;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const questions = mode === 'exam' ? C.exam(random, original, topic) : C.practice(topic, random);
  return { mode, topic, questions, answers: questions.map(() => ({})), first: questions.map(() => null), checked: {}, helped: {}, hints: {}, translations: {}, finished: false };
}
let count = 0;
for (const mode of ['exam', 'practice', 'learn']) for (const topic of ['all', ...C.topics.map(t => t.id)]) for (const original of [false, true]) {
  const storage = memory(), store = D.create(() => storage), session = activity(mode, topic, original);
  assert.equal(store.load().status, 'empty');
  assert.equal(store.save(session, 0), true);
  for (const [position, question] of session.questions.entries()) {
    for (const field of question.fields) {
      const value = field.kind === 'grid' ? ['0,0', '0,1'] : field.kind === 'multi' ? [field.options[0]] :
        field.kind === 'sticks' ? 4 : field.kind === 'choice' ? field.options[0] : field.kind === 'written' ? 'My unfinished explanation: 2 × 7 = 14\nNext step…' : '12';
      session.answers[position][field.id] = value;
      assert.equal(store.save(session, position), true);
      // Nowy obiekt magazynu odtwarza wszystkie dane po każdej pojedynczej zmianie.
      const restored = D.create(() => storage).load();
      assert.equal(restored.status, 'saved');
      assert.equal(restored.position, position);
      assert.deepEqual(restored.session, snapshot(session));
      count++;
    }
  }
  if (mode !== 'exam') {
    session.first[0] = { answers: structuredClone(session.answers[0]), helped: true };
    session.helped[0] = true; session.hints[0] = true; session.translations[0] = true;
    session.checked[0] = C.grade(session.questions[0], session.answers[0]);
    assert.equal(store.save(session, 0), true);
    assert.deepEqual(D.create(() => storage).load().session, snapshot(session));
    session.answers[0] = {}; delete session.checked[0];
    assert.equal(store.save(session, 0), true);
    const restored = D.create(() => storage).load().session;
    assert.deepEqual(restored.answers[0], {});
    assert.deepEqual(restored.first[0], session.first[0], 'Pierwsza odpowiedź nie znika po poprawce');
  }
  session.finished = true;
  assert.equal(store.save(session, 0), true);
  const restored = D.create(() => storage).load().session;
  assert.equal(restored.finished, true);
  const answers = s => s.mode === 'exam' ? s.answers : s.first.map(f => f?.answers || {});
  assert.deepEqual(C.report(restored.questions, answers(restored)), C.report(session.questions, answers(session)));
  assert.equal(store.clear(), true);
  assert.equal(D.create(() => storage).load().status, 'empty');
}
const storage = memory(), store = D.create(() => storage), session = activity('exam', 'all', false);
assert.equal(store.save(session, 0), true);
const [key, json] = [...storage.values][0];
const invalid = [null, {}, {version:2, session, position:0}, {version:1, session, position:-1},
  {version:1, session, position:17}, {version:1, session:{...session, answers:[]}, position:0},
  {version:1, session:{...session, questions:[{}]}, position:0}];
for (const value of invalid) {
  storage.setItem(key, JSON.stringify(value)); assert.equal(store.load().status, 'invalid');
}
for (const value of ['{broken JSON', 'x'.repeat(250001)]) {
  storage.setItem(key, value); assert.equal(store.load().status, 'invalid');
}
storage.setItem(key, json);
assert.equal(store.save(session, -1), false);
assert.equal(storage.getItem(key), json, 'Błędny zapis nie zastępuje poprawnej kopii');
const blocked = D.create(() => { throw Error('Storage blocked'); });
assert.equal(blocked.load().status, 'unavailable');
assert.equal(blocked.save(session, 0), false); assert.equal(blocked.clear(), false);
const full = D.create(() => ({...storage, setItem() { throw Error('Quota exceeded'); }}));
assert.equal(full.save(session, 0), false);
assert.equal(storage.getItem(key), json, 'Błąd zapisu zachowuje ostatnią poprawną kopię');
const otherTab = D.create(memory);
assert.equal(otherTab.load().status, 'empty', 'Oddzielny magazyn karty nie otrzymuje cudzych odpowiedzi');
for (const [i, q] of session.questions.entries()) for (const f of q.fields) {
  if (f.kind === 'written') session.answers[i][f.id] = 'ą'.repeat(800);
}
assert.equal(store.save(session, 16), true, 'Pełne uzasadnienia mieszczą się w limicie zapisu');
assert.deepEqual(store.load().session.answers, session.answers);
assert.equal(store.save(activity('exam', 'sequences', true), 0), true);
assert.equal(store.load().session.questions.length, 2, 'Nowa runda zastępuje poprzednią');
console.log(`OK: ${count} zapisów i odtworzeń odpowiedzi; losowe i oryginalne zadania, pozycja, ćwiczenia, raport, czyszczenie, uszkodzenia i błędy pamięci. Bez DOM i przeglądarki.`);
