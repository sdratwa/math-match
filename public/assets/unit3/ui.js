/* Interfejs działa lokalnie; nie odczytuje i nie zapisuje danych profili. */
(() => {
  'use strict';
  const C = window.Unit3, app = document.getElementById('unitApp');
  let session = null, position = 0;
  function language(english) {
    document.documentElement.lang = english ? 'en' : 'pl';
    document.getElementById('unitHome').textContent = english ? 'Module home' : 'Start modułu';
    document.getElementById('confirmTitle').textContent = english ? 'Finish this activity?' : 'Zakończyć tę aktywność?';
    document.getElementById('confirmNo').textContent = english ? 'Stay' : 'Zostań';
    document.querySelector('footer').textContent = english
      ? 'Stage 5 · Unit 3. No login. Answers stay on this open page only. Refreshing deletes them.'
      : 'Przygotowanie do sprawdzianu · Stage 5 · Unit 3. Bez logowania. Odpowiedzi są tylko na tej otwartej stronie. Odświeżenie je usuwa.';
  }
  const el = (tag, className = '', text) => {
    const n = document.createElement(tag); if (className) n.className = className;
    if (text !== undefined) n.textContent = text; return n;
  };
  function button(label, fn, secondary = false) {
    const b = el('button', secondary ? 'secondary' : '', label); b.type = 'button'; b.addEventListener('click', fn); return b;
  }
  function title(text, eyebrow = '') {
    app.replaceChildren(); if (eyebrow) app.append(el('p', 'eyebrow', eyebrow));
    const h = el('h1', '', text); h.tabIndex = -1; app.append(h); h.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function confirmAction(message, label, fn) {
    const dialog = document.getElementById('unitConfirm'), opener = document.activeElement;
    document.getElementById('confirmText').textContent = message;
    const yes = document.getElementById('confirmYes'), no = document.getElementById('confirmNo');
    yes.textContent = label;
    const close = () => { dialog.close(); if (opener?.isConnected) opener.focus(); };
    yes.onclick = () => { close(); fn(); }; no.onclick = close;
    dialog.oncancel = e => { e.preventDefault(); close(); };
    dialog.showModal(); no.focus();
  }
  function leave(fn) {
    if (session && !session.finished) confirmAction('Your current answers will be lost. You can stay and finish the questions.', 'Leave', fn);
    else fn();
  }
  document.getElementById('unitHome').addEventListener('click', () => leave(home));
  document.querySelector('.brand').addEventListener('click', e => {
    if (session && !session.finished) { e.preventDefault(); leave(() => { window.location.href = 'index.php'; }); }
  });
  function home() {
    session = null; language(false);
    title('Gotowi na Unit 3?', 'CAMBRIDGE PRIMARY MATHEMATICS · STAGE 5');
    app.append(el('p', 'intro', 'Rozpoznaj angielskie polecenia z arkusza, przećwicz matematykę i spróbuj sprawdzianu po angielsku. Przygotuj kartkę i ołówek.'));
    const modes = el('div', 'mode-grid');
    for (const [icon, name, desc, fn] of [
      ['📖', 'Uczę się', 'Zrozum polecenia z arkusza po angielsku, z polskim objaśnieniem i przykładami.', () => topicsScreen('learn')],
      ['✏️', 'Ćwiczę', 'Zadania po angielsku. Tłumaczenie i podpowiedź tylko na życzenie. Sprawdzenie od razu.', () => topicsScreen('practice')],
      ['⭐', 'Próbny sprawdzian', `${C.ids.length} zadań ze wszystkich 8 działów. Bez podpowiedzi, wynik na końcu.`, examIntro]
    ]) {
      const b = button('', fn); b.className = 'mode-card'; b.append(el('span', 'mode-icon', icon), el('strong', '', name), el('span', '', desc)); modes.append(b);
    }
    app.append(modes, el('p', 'notice', 'Nie ścigamy się z czasem. Liczy się zrozumienie. Wynik nie trafia do rankingu ani na konto.'));
  }
  function topicsScreen(mode) {
    session = null; language(false); title(mode === 'learn' ? 'Czego się dziś uczymy?' : 'Co chcesz poćwiczyć?');
    app.append(el('p', 'intro', mode === 'learn' ? 'Wybierz temat. Przeczytaj przykład, obejrzyj rysunek i spróbuj samodzielnie.' : 'Polecenia i podpunkty są po angielsku, jak w arkuszu. Najpierw spróbuj bez tłumaczenia. Runda obejmuje 3–6 pełnych zadań, zależnie od działu.'));
    if (mode === 'practice') app.append(button('🎲 Po jednym zadaniu z każdego działu', () => startPractice('all')));
    const grid = el('div', 'topic-grid');
    C.topics.forEach(t => {
      const b = button('', () => mode === 'learn' ? lesson(t.id) : startPractice(t.id)); b.className = 'topic-card secondary';
      b.append(el('span', 'topic-icon', t.icon), el('strong', '', t.title)); const en = el('span', 'english', t.en); en.lang = 'en'; b.append(en); grid.append(b);
    }); app.append(grid);
  }
  function lesson(id) {
    session = null; language(false); const t = C.topics.find(t => t.id === id);
    title(`${t.icon} ${t.title}`, t.en);
    const card = el('section', 'panel'); t.text.forEach(p => card.append(el('p', '', p)));
    if (t.diagram) card.append(visual(t.diagram));
    card.append(el('h2', '', 'Popatrz na przykład'), el('p', 'worked', t.example), el('p', 'notice', t.tip));
    const guide = el('section', 'panel instruction-guide');
    guide.append(el('h2', '', 'Takie polecenia zobaczysz na sprawdzianie'), el('p', '', 'Najpierw przeczytaj zdanie po angielsku i powiedz, co masz zrobić. Dopiero potem rozwiń objaśnienie.'));
    C.instructions[id].forEach(([en, pl]) => {
      const item = el('article', 'instruction-card'), command = el('p', 'english-command', en); command.lang = 'en';
      const help = el('details'); help.append(el('summary', '', 'Co mam zrobić?'), el('p', '', pl));
      item.append(command, help); guide.append(item);
    });
    const actions = el('div', 'actions');
    actions.append(button('Spróbuję samodzielnie', () => startPractice(id, 'learn')), button('Wszystkie tematy', () => topicsScreen('learn'), true));
    app.append(card, guide, actions);
  }
  function examIntro() {
    session = null; language(false); title('Próbny sprawdzian');
    const card = el('section', 'panel');
    card.append(el('p', 'intro', `${C.ids.length} zadań. Wszystkie 8 działów arkusza. Możesz wracać do wcześniejszych pytań i poprawiać odpowiedzi.`));
    const list = el('ul');
    ['Nie ma limitu czasu — możesz pracować spokojnie.', 'Nie pokażemy podpowiedzi ani poprawnych odpowiedzi przed końcem.', 'Możesz pominąć zadanie. Puste odpowiedzi pokażemy w raporcie jako do powtórzenia.', 'Nie odświeżaj i nie zamykaj strony: odpowiedzi nie są trwale zapisywane.'].forEach(x => list.append(el('li', '', x)));
    card.append(list, el('p', 'notice', 'Cały sprawdzian jest po angielsku, z podpunktami jak w DOCX. Uzasadnienia wpisz po angielsku lub jako rachunek. Automat sprawdzi liczby i krótkie reguły; pisemne uzasadnienia porównacie z dorosłym ze wzorem po oddaniu pracy.'));
    const actions = el('div', 'actions');
    actions.append(button('Sprawdzian — nowe liczby', () => start('exam', 'all', C.exam())),
      button('Arkusz z DOCX — oryginalne liczby', () => start('exam', 'all', C.exam(Math.random, true)), true));
    card.append(actions); app.append(card);
  }
  function startPractice(topic, mode = 'practice') { start(mode, topic, C.practice(topic)); }
  function start(mode, topic, questions) {
    session = { mode, topic, questions, answers: questions.map(() => ({})), first: questions.map(() => null), checked: {}, helped: {}, hints: {}, translations: {}, finished: false };
    position = 0; questionScreen();
  }
  function visual(spec) {
    if (spec.kind === 'patterns') {
      const group = el('div', 'pattern-series');
      spec.ns.forEach(n => { const item = el('div'); item.append(el('p', 'pattern-label', `Pattern ${n}`), visual({kind:spec.shape,n})); group.append(item); });
      return group;
    }
    const figure = el('figure', 'diagram'); figure.lang = 'en';
    if (spec.kind === 'sequence') {
      const line = el('div', 'sequence');
      spec.values.forEach((v, i) => { if (i) line.append(el('span', 'sequence-arrow', '→')); line.append(el('span', 'sequence-number', String(v))); });
      figure.append(line);
      if (spec.step) figure.append(el('figcaption', '', `Each jump: +${spec.step}`));
      return figure;
    }
    if (spec.kind === 'rows') {
      const table = el('table', 'lockers'); table.append(el('caption', '', 'Numbers go down ↓, then to the next column →'));
      const head = el('tr'); const corner = el('th', '', 'Row'); corner.scope = 'col'; head.append(corner);
      for (let x = 0; x < spec.columns; x++) { const th = el('th', '', `Col. ${x + 1}`); th.scope = 'col'; head.append(th); }
      const thead = el('thead'); thead.append(head); table.append(thead); const body = el('tbody');
      for (let y = 0; y < spec.rows; y++) {
        const tr = el('tr'), th = el('th', '', String(y + 1)); th.scope = 'row'; tr.append(th);
        for (let x = 0; x < spec.columns; x++) tr.append(el('td', '', String(x * spec.rows + y + 1))); body.append(tr);
      }
      table.append(body); figure.append(table); return figure;
    }
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('role', 'img');
    const name = document.createElementNS(ns, 'title');
    const desc = spec.kind === 'sticks' ? `A row of ${spec.n} joined squares with shared sides.` : spec.kind === 'stairs' ? `Symmetrical staircase: rows of ${Array.from({ length: spec.n }, (_, i) => 2 * i + 1).join(', ')} squares from the top.` : spec.kind === 'triangle' ? `Triangle: rows of ${Array.from({ length: spec.n }, (_, i) => i + 1).join(', ')} squares from the top, aligned on the left.` : `Square: ${spec.n} rows of ${spec.n} squares.`;
    name.textContent = desc; svg.append(name); svg.setAttribute('aria-label', desc);
    if (spec.kind === 'sticks') {
      svg.setAttribute('viewBox', `0 0 ${spec.n * 44 + 20} 64`); svg.classList.add('sticks-diagram');
      C.stickSegments(spec.n).forEach(([x1, y1, x2, y2]) => {
        const line = document.createElementNS(ns, 'line');
        Object.entries({ x1: x1 * 44 + 10, y1: y1 * 44 + 10, x2: x2 * 44 + 10, y2: y2 * 44 + 10 }).forEach(([k, v]) => line.setAttribute(k, v));
        line.setAttribute('class', x1 === x2 && x1 > 0 && x1 < spec.n ? 'shared-stick' : 'stick'); svg.append(line);
      });
    } else {
      const width = spec.kind === 'stairs' ? 2 * spec.n - 1 : spec.n;
      svg.setAttribute('viewBox', `0 0 ${width * 28 + 8} ${spec.n * 28 + 8}`);
      C.cells(spec.kind, spec.n).forEach(([x, y]) => {
        const rect = document.createElementNS(ns, 'rect');
        Object.entries({ x: x * 28 + 4, y: y * 28 + 4, width: 25, height: 25, rx: 3 }).forEach(([k, v]) => rect.setAttribute(k, v));
        rect.setAttribute('class', y % 2 ? 'tile alternate' : 'tile'); svg.append(rect);
      });
    }
    figure.append(svg, el('figcaption', '', desc)); return figure;
  }
  function answerField(field, saved, set, { inline = false, hideLabel = false } = {}) {
    const group = el(inline ? 'span' : 'fieldset', inline ? `inline-answer kind-${field.kind}` : 'answer-field');
    if (!inline) group.append(el('legend', hideLabel ? 'sr-only' : '', hideLabel ? field.label : field.label.replace(/^[a-z]\)\s*/, '')));
    if (field.kind === 'choice' || field.kind === 'multi') {
      const list = el('div', 'options');
      field.options.forEach((option, index) => {
        const label = el('label', 'option'), input = el('input'); input.type = field.kind === 'choice' ? 'radio' : 'checkbox';
        input.name = field.id; input.value = String(option); input.id = `${field.id}-option-${index}`;
        input.checked = field.kind === 'choice' ? saved === option : Array.isArray(saved) && saved.includes(option);
        input.addEventListener('change', () => {
          if (field.kind === 'choice') set(option);
          else set(field.options.filter((_, i) => list.querySelectorAll('input')[i].checked));
        });
        label.append(input, el('span', '', String(option))); list.append(label);
      }); group.append(list);
    } else if (field.kind === 'grid') {
      const grid = el('div', `build-grid size-${field.size}`), selected = new Set(Array.isArray(saved) ? saved : []);
      const count = el('p', 'small', `Selected squares: ${selected.size}`); count.setAttribute('aria-live', 'polite');
      for (let y = 0; y < field.size; y++) for (let x = 0; x < field.size; x++) {
        const key = `${x},${y}`, b = button('', () => {
          if (selected.has(key)) selected.delete(key); else selected.add(key);
          b.setAttribute('aria-pressed', String(selected.has(key))); b.textContent = selected.has(key) ? '●' : '';
          count.textContent = `Selected squares: ${selected.size}`; set([...selected]);
        });
        b.className = 'grid-cell'; b.setAttribute('aria-label', `Row ${y + 1}, column ${x + 1}`); b.setAttribute('aria-pressed', String(selected.has(key))); b.textContent = selected.has(key) ? '●' : ''; grid.append(b);
      }
      group.append(el('p', 'small', 'Tap a square to select it. Tap again to clear it.'), grid, count);
    } else if (field.kind === 'sticks') {
      let n = Number.isInteger(saved) ? saved : 0;
      const preview = el('div'), controls = el('div', 'actions'), count = el('output', 'builder-count'); count.setAttribute('aria-live', 'polite');
      const minus = button('−', () => update(n - 1), true), plus = button('+', () => update(n + 1), true);
      minus.setAttribute('aria-label', 'Remove one square'); plus.setAttribute('aria-label', 'Add one square');
      function draw() { count.textContent = `${n} squares`; minus.disabled = n === 0; plus.disabled = n === 9; preview.replaceChildren(n ? visual({ kind: 'sticks', n }) : el('p', 'small', 'Use + to add the first square.')); }
      function update(value) { n = Math.max(0, Math.min(9, value)); set(n); draw(); }
      controls.append(minus, count, plus); group.append(controls, preview); draw();
    } else if (field.kind === 'written') {
      const input = el('textarea', 'written-input'); input.id = field.id; input.rows = 3; input.maxLength = 800;
      input.lang = 'en'; input.spellcheck = false; input.autocomplete = 'off'; input.setAttribute('aria-label', field.label);
      input.value = typeof saved === 'string' ? saved : '';
      input.addEventListener('input', () => set(input.value));
      group.append(input, el('p', 'small', 'Write in English. You can include calculations. Your explanation will be compared with a model answer after checking or finishing.'));
    } else {
      const input = el('input', 'number-input'); input.type = 'text'; input.id = field.id; input.autocomplete = 'off'; input.spellcheck = false;
      const text = ['set','prime-pair','rule','term'].includes(field.kind);
      input.inputMode = text ? 'text' : 'numeric'; input.maxLength = text ? (['rule','term'].includes(field.kind) ? 100 : 180) : 7;
      input.value = typeof saved === 'string' || typeof saved === 'number' ? saved : '';
      input.setAttribute('aria-label', field.label);
      input.addEventListener('input', () => set(input.value)); group.append(input);
      if (!inline && ['set','prime-pair'].includes(field.kind)) group.append(el('p', 'small', 'Separate numbers with commas or spaces. Order does not matter. Do not repeat numbers.'));
      if (!inline && field.kind === 'rule') group.append(el('p', 'small', 'Answer format: Add … / Subtract … / +… / −… (use a number in place of …).'));
    }
    return group;
  }
  function workedSolution(q) {
    const box = el('section', 'worked-solution'); box.lang = 'en';
    box.append(el('h3', '', 'How to work it out'));
    const lines = q.id === 'q6'
      ? q.params.ns.map((n,i) => `${'ab'[i]}) ${n}² means ${n} × ${n}, so its value is ${n*n}.`)
      : q.explanation.split(/;\s+|\n+|\s+(?=[a-d]\) )/);
    lines.forEach((text,i) => box.append(el('p', 'solution-step', q.id === 'q5' ? `${'abcd'[i]}) ${text}` : text)));
    return box;
  }
  function questionScreen() {
    language(true);
    const s = session, q = s.questions[position], test = s.mode === 'exam', topic = C.topics.find(t => t.id === q.topic);
    title(topic.en, `${test ? 'PRACTICE TEST' : 'PRACTICE'} · QUESTION ${position + 1} OF ${s.questions.length} · WORKBOOK ${q.number}`);
    const progress = el('progress'); progress.max = s.questions.length; progress.value = position + 1; progress.setAttribute('aria-label', 'Question position'); app.append(progress);
    if (test) app.append(el('p', 'notice', 'Read each question carefully. Show your working where you can. Use the space provided. Answers will be shown after you finish.'));
    const card = el('section', 'panel');
    const mainInline = q.parts.length === 1 && !q.parts[0].prompt && !q.visual && C.inlineAnswers({ ...q.parts[0], prompt: q.prompt });
    if (!mainInline) card.append(el('h2', 'question', q.prompt));
    if (q.visual) card.append(visual(q.visual));
    const form = el('form'); form.noValidate = true;
    const feedback = el('div', 'feedback'); feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
    const fieldViews = new Map();
    function clearFieldResult(id) {
      const view = fieldViews.get(id);
      if (!view) return;
      view.group.classList.remove('answer-correct', 'answer-incorrect', 'answer-review');
      view.badge.hidden = true; view.message.hidden = true;
      view.group.removeAttribute('aria-describedby');
      view.group.querySelectorAll('input, textarea').forEach(input => {
        input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby');
      });
    }
    function showFieldResult(f, result) {
      const view = fieldViews.get(f.id); clearFieldResult(f.id);
      const state = result.manual ? 'review' : result.correct ? 'correct' : 'incorrect';
      const label = result.manual ? 'Compare with an adult' : result.correct ? 'Correct' : 'Not correct yet';
      const symbol = result.manual ? '✎' : result.correct ? '✓' : '✗';
      view.group.classList.add(`answer-${state}`);
      view.badge.replaceChildren(el('span', 'result-symbol', symbol), el('span', 'sr-only', label));
      view.badge.firstChild.setAttribute('aria-hidden', 'true'); view.badge.hidden = false;
      view.badge.title = label;
      if (!result.manual && !result.correct) {
        const raw = s.answers[position][f.id];
        const blank = raw == null || String(raw).trim() === '' || Array.isArray(raw) && !raw.length || f.kind === 'sticks' && raw === 0;
        view.message.textContent = `${blank ? 'No answer yet. ' : !result.valid ? 'Check the answer format. ' : ''}Correct answer: ${C.expectedText(f)}`;
        view.message.hidden = false;
      }
      view.group.setAttribute('aria-describedby', view.badge.id + (view.message.hidden ? '' : ' ' + view.message.id));
      view.group.querySelectorAll('input, textarea').forEach(input => {
        if (!result.manual) input.setAttribute('aria-invalid', String(!result.correct));
        input.setAttribute('aria-describedby', view.badge.id + (view.message.hidden ? '' : ' ' + view.message.id));
      });
    }
    function renderField(f, options) {
      const group = answerField(f, s.answers[position][f.id], value => {
        s.answers[position][f.id] = value;
        if (!test) {
          clearFieldResult(f.id);
          feedback.replaceChildren(); delete s.checked[position]; next.disabled = true;
        }
      }, options);
      const badge = el('span', 'answer-result'), message = el('span', 'answer-correction');
      badge.id = `${f.id}-result`; message.id = `${f.id}-correction`;
      badge.hidden = true; message.hidden = true;
      group.append(badge, message); fieldViews.set(f.id, {group,badge,message});
      return group;
    }
    q.parts.forEach(originalPart => {
      const p = mainInline ? { ...originalPart, prompt: q.prompt } : originalPart;
      const section = el('section', mainInline || !p.prompt ? 'question-part unheaded' : 'question-part');
      const tokens = C.inlineAnswers(p), placed = new Set();
      if (tokens) {
        const line = el('div', mainInline ? 'answer-sentence question' : 'answer-sentence');
        tokens.forEach(token => {
          if (token.fieldId) {
            const f = p.fields.find(f => f.id === token.fieldId);
            line.append(renderField(f, { inline: true })); placed.add(f.id);
          } else line.append(document.createTextNode(token.text));
        });
        section.append(line);
        if (p.fields.some(f=>placed.has(f.id) && f.kind==='rule')) section.append(el('p', 'small', 'Answer format: Add … / Subtract … / +… / −… (use a number in place of …).'));
        if (p.fields.some(f=>placed.has(f.id) && ['set','prime-pair'].includes(f.kind))) section.append(el('p', 'small', 'Separate numbers with commas or spaces. Order does not matter. Do not repeat numbers.'));
      } else if (p.prompt) section.append(el('h3', '', p.prompt));
      if (p.visual?.kind === 'answer-table') {
        const table = el('table', 'answer-table'), thead = el('thead'), head = el('tr');
        ['Pattern number','Number of sticks'].forEach(label => { const th = el('th', '', label); th.scope = 'col'; head.append(th); });
        thead.append(head); table.append(thead); const body = el('tbody');
        p.fields.forEach((f,i) => { const tr=el('tr'), th=el('th','',String(i+1)), td=el('td'); th.scope='row'; td.append(renderField(f, { inline: true })); tr.append(th,td); body.append(tr); });
        table.append(body); section.append(table);
      } else {
        if (p.visual && !tokens) section.append(visual(p.visual));
        p.fields.filter(f=>!placed.has(f.id)).forEach(f => {
          const label = f.label.replace(/^[a-z]\)\s*/, '');
          // Kontekst pozostaje dostępny czytnikom; na ekranie nie powtarzamy polecenia.
          const hideLabel = ['choice','multi'].includes(f.kind) ||
            f.kind === 'written' && label !== 'Why?';
          section.append(renderField(f, { hideLabel }));
        });
      }
      form.append(section);
    });
    if (!test) {
      const actions = el('div', 'actions'), check = el('button', '', 'Check answers'); check.type = 'submit';
      const hintBox = el('p', 'hint', q.hint); hintBox.lang = 'pl'; hintBox.hidden = !s.hints[position];
      const hint = button('Hint / Podpowiedź', () => { s.helped[position] = true; s.hints[position] = true; hintBox.hidden = false; }, true);
      const translationBox = el('section', 'translation'); translationBox.lang = 'pl'; translationBox.hidden = !s.translations[position];
      translationBox.append(el('h3', '', 'Znaczenie polecenia'), el('p', '', q.pl));
      q.parts.filter(p=>p.pl).forEach(p=>translationBox.append(el('p', '', p.pl)));
      const translation = button('Translate / Tłumaczenie', () => {
        s.helped[position] = true; s.translations[position] = !s.translations[position];
        translationBox.hidden = !s.translations[position]; translation.setAttribute('aria-expanded', String(!translationBox.hidden));
      }, true);
      translation.setAttribute('aria-expanded', String(!translationBox.hidden));
      actions.append(check, translation, hint); form.append(actions, translationBox, hintBox);
    }
    form.append(feedback); card.append(form); app.append(card);
    const navigation = el('div', 'actions navigation');
    const previous = button('← Previous', () => { position--; questionScreen(); }, true); previous.disabled = position === 0;
    const next = button(position === s.questions.length - 1 ? 'Finish' : 'Next →', () => {
      if (position === s.questions.length - 1) finish(); else { position++; questionScreen(); }
    });
    next.disabled = !test && !s.checked[position]; navigation.append(previous, next); app.append(navigation);
    if (test) {
      const jump = el('nav', 'question-nav'); jump.setAttribute('aria-label', 'Go to question');
      s.questions.forEach((_, i) => {
        const b = button(String(i + 1), () => { position = i; questionScreen(); }, true);
        b.setAttribute('aria-label', `Question ${i + 1}`); if (i === position) b.setAttribute('aria-current', 'step'); jump.append(b);
      });
      app.append(jump, button('Finish test', finish, true));
    }
    function checkAnswer() {
      const r = C.grade(q, s.answers[position]);
      if (!s.first[position]) s.first[position] = { answers: JSON.parse(JSON.stringify(s.answers[position])), helped: !!s.helped[position] };
      s.checked[position] = r; feedback.replaceChildren();
      feedback.className = 'feedback feedback-neutral';
      feedback.append(el('h3', '', r.total ? `${r.points} / ${r.total} answers correct` : 'Compare your explanation'));
      q.fields.forEach((f, i) => {
        showFieldResult(f, r.fields[i]);
        if (r.fields[i].manual) {
          feedback.append(el('p', 'manual-review', `${f.label} — ${r.fields[i].valid ? 'Not automatically graded.' : 'No explanation entered.'} Model answer: ${C.expectedText(f)}`));
        }
      });
      feedback.append(workedSolution(q));
      if (r.manual) feedback.append(el('p', 'notice', 'Compare the meaning of your explanation with the model answer, with an adult. Different words or valid calculations can be correct. Written explanations have not been graded.'));
      feedback.append(el('p', 'small', 'You can change your answer and check again. The report keeps your first attempt.'));
      next.disabled = false;
    }
    form.addEventListener('submit', e => { e.preventDefault(); if (!test) checkAnswer(); });
    if (!test && s.checked[position]) checkAnswer();
  }
  function answered(q, a) {
    return q.fields.every(f => {
      const v = a[f.id];
      if (f.kind === 'grid' || f.kind === 'multi') return Array.isArray(v) && v.length > 0;
      if (f.kind === 'sticks') return typeof v === 'number' && v > 0;
      return v !== undefined && String(v).trim() !== '';
    });
  }
  function finish() {
    const s = session;
    const missing = s.questions.filter((q, i) => !answered(q, s.answers[i])).length;
    const done = () => { s.finished = true; summary(); };
    if (s.mode === 'exam') confirmAction(missing ? `${missing} questions have unanswered parts. Stay to complete them, or finish to see your report.` : 'Ready to hand in your test? Your results and model answers will be shown next.', 'Show results', done);
    else done();
  }
  function summary() {
    language(false);
    const s = session, test = s.mode === 'exam';
    const answers = test ? s.answers : s.first.map(first => first?.answers || {});
    const rows = C.report(s.questions, answers), points = rows.reduce((n, r) => n + r.points, 0), total = rows.reduce((n, r) => n + r.total, 0), manual = rows.reduce((n, r) => n + r.manual, 0);
    const helpedTopics = new Set(s.questions.filter((q, i) => s.first[i]?.helped).map(q => q.topic));
    title('Dobra praca! Zobacz, co już umiesz.', test ? 'WYNIK PRÓBNEGO SPRAWDZIANU' : 'PODSUMOWANIE ĆWICZEŃ');
    app.append(el('p', 'result-score', `${points} / ${total} odpowiedzi sprawdzanych automatycznie`), el('p', 'intro', test ? 'Wynik obejmuje liczby, wybory, rysunki i krótkie reguły. Nie jest pełną oceną sprawdzianu: uzasadnienia trzeba sprawdzić z dorosłym.' : 'Raport pokazuje pierwsze odpowiedzi. Poprawianie błędów też jest nauką! Tłumaczenia i podpowiedzi oznaczamy osobno.'));
    app.append(el('p', 'notice', `${manual} pisemnych uzasadnień do sprawdzenia z dorosłym. Ich poprawności automat nie ocenia — także wtedy, gdy pole jest puste. Rozwiń odpowiedzi i porównaj ich sens z angielskim wzorem.`));
    const root = el('div', 'report-grid');
    for (const row of rows) {
      const t = C.topics.find(t => t.id === row.topic), needsReview = row.points < row.total || (!test && helpedTopics.has(t.id));
      const card = el('section', 'panel report-card');
      card.append(el('h2', '', `${t.icon} ${t.title}`), el('p', needsReview ? 'review-label' : 'good-label', needsReview ? '↻ Warto powtórzyć' : row.manual ? '✎ Sprawdź uzasadnienia' : '✓ Dobrze Ci poszło'),
        el('p', '', `Poprawne odpowiedzi automatyczne: ${row.points}/${row.total}. Uzasadnienia do sprawdzenia: ${row.manual}.`));
      if (!test && helpedTopics.has(t.id)) card.append(el('p', 'small', 'Przed pierwszą odpowiedzią użyto tłumaczenia lub podpowiedzi.'));
      card.append(button('Powtórz ten temat', () => lesson(t.id), true)); root.append(card);
    }
    app.append(root, el('h2', '', 'Twoje odpowiedzi i wyjaśnienia'));
    s.questions.forEach((q, i) => {
      const result = C.grade(q, answers[i]), details = el('details', 'solution'); details.append(el('summary', '', `${result.correct === true ? '✓' : result.autoCorrect || !result.total ? '✎' : '↻'} ${i + 1}. ${q.prompt}`));
      q.fields.forEach((f, j) => {
        const raw = answers[i][f.id];
        const value = raw === undefined || raw === '' || Array.isArray(raw) && !raw.length ? 'no answer' : f.kind === 'grid' ? `${raw.length} squares selected` : Array.isArray(raw) ? raw.join(', ') : String(raw);
        const status = result.fields[j], line = el('div', 'review-answer'); line.lang = 'en';
        const label = status.manual ? 'For adult review' : status.correct ? 'Correct' : 'Not correct';
        const answer = el('p', status.manual ? 'review-manual' : status.correct ? 'review-correct' : 'review-incorrect',
          `${status.manual ? '✎' : status.correct ? '✓' : '✗'} ${f.label} — Your answer: ${value}. ${label}.`);
        line.append(answer, el('p', '', `${status.manual ? 'Model answer' : 'Correct answer'}: ${C.expectedText(f)}`)); details.append(line);
        if (f.kind === 'grid') details.append(visual({ kind: 'triangle', n: f.size }));
      });
      details.append(workedSolution(q)); app.append(details);
    });
    const actions = el('div', 'actions'); actions.append(button(test ? 'Nowy próbny sprawdzian' : 'Nowe liczby — kolejna runda', () => test ? start('exam', 'all', C.exam()) : startPractice(s.topic, s.mode)), button('Start modułu', home, true)); app.append(actions);
  }
  home();
})();
