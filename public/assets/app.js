(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const state = {
    quizzes: [], admin: false, adminConfigured: false, canCreate: true, csrf: '',
    activeQuiz: null, activePairs: [], matched: new Set(), selected: null,
    checking: false, gameNonce: 0, sound: true, editorId: null, busy: false,
  };
  const views = ['libraryView', 'gameView', 'editorView'];
  const cards = ['🧩', '🔢', '🌈', '📚', '🚀', '⭐', '🦊'];

  function show(view) {
    views.forEach((id) => { $(id).hidden = id !== view; });
    $('banner').hidden = true;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function alertBanner(message) {
    $('banner').textContent = message;
    $('banner').hidden = false;
  }
  function el(tag, cssClass, text) {
    const node = document.createElement(tag);
    if (cssClass) node.className = cssClass;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  async function api(action, payload = undefined) {
    const init = { credentials: 'same-origin', cache: 'no-store' };
    if (payload !== undefined) {
      init.method = 'POST';
      init.headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrf };
      init.body = JSON.stringify(payload);
    }
    let response;
    try { response = await fetch(`index.php?api=${encodeURIComponent(action)}`, init); }
    catch { throw new Error('Brak połączenia z serwerem. Sprawdź internet.'); }
    const json = await response.json().catch(() => null);
    if (!json || !json.ok) throw new Error(json?.error || `Błąd serwera (${response.status}).`);
    return json;
  }
  async function refresh() {
    const data = await api('bootstrap');
    state.quizzes = data.quizzes;
    state.admin = data.admin;
    state.adminConfigured = data.adminConfigured;
    state.canCreate = data.canCreate;
    state.csrf = data.csrf;
    renderLibrary();
  }
  function renderLibrary() {
    $('adminButton').textContent = state.admin ? '🔓 Wyloguj admina' : '🔐 Admin';
    $('newQuiz').hidden = !state.canCreate;
    $('quizCount').textContent = `${state.quizzes.length} ${state.quizzes.length === 1 ? 'zestaw' : 'zestawów'}`;
    const root = $('quizGrid');
    root.replaceChildren();
    $('emptyLibrary').hidden = state.quizzes.length > 0;
    state.quizzes.forEach((quiz, idx) => {
      const card = el('article', 'quiz-card');
      const emoji = el('div', 'cardicon', cards[idx % cards.length]);
      emoji.setAttribute('aria-hidden', 'true');
      card.append(emoji, el('h3', '', quiz.title), el('p', 'cardmeta', `${quiz.pairs.length} par do dopasowania`));
      const actions = el('div', 'cardactions');
      const play = el('button', 'btn btn-primary', '▶ Graj');
      play.type = 'button';
      play.addEventListener('click', () => startGame(quiz.id));
      actions.append(play);
      if (state.admin) {
        const edit = el('button', 'btn', '✎ Edytuj');
        edit.type = 'button';
        edit.addEventListener('click', () => openEditor(quiz.id));
        actions.append(edit);
      }
      card.append(actions);
      root.append(card);
    });
  }
  function setFeedback(message, type = '') {
    const node = $('feedback');
    node.className = 'feedback' + (type ? ` ${type}` : '');
    node.textContent = message;
  }
  function startGame(id) {
    const quiz = state.quizzes.find((q) => q.id === id);
    if (!quiz) return;
    state.gameNonce++;
    state.activeQuiz = quiz;
    state.activePairs = quiz.pairs.map((p, i) => ({ ...p, matchId: i }));
    state.selected = null;
    state.matched = new Set();
    state.checking = false;
    $('gameTitle').textContent = quiz.title;
    $('gameColumns').hidden = false;
    $('finish').hidden = true;
    const left = $('terms');
    const right = $('descriptions');
    left.replaceChildren();
    right.replaceChildren();
    const leftPairs = shuffle(state.activePairs);
    let rightPairs = shuffle(state.activePairs);
    // Ensure the two columns are not trivially aligned in exactly the same order.
    if (rightPairs.length > 1 && rightPairs.every((p, idx) => p.matchId === leftPairs[idx].matchId)) {
      rightPairs = [...rightPairs.slice(1), rightPairs[0]];
    }
    for (const pair of leftPairs) left.append(makeChoice(pair, 'term'));
    for (const pair of rightPairs) right.append(makeChoice(pair, 'description'));
    updateProgress();
    setFeedback('Wybierz nazwę po lewej 👈');
    show('gameView');
  }
  function makeChoice(pair, side) {
    const button = el('button', 'choice', side === 'term' ? pair.term : pair.description);
    button.type = 'button';
    button.dataset.match = String(pair.matchId);
    button.dataset.side = side;
    button.addEventListener('click', () => choose(button));
    return button;
  }
  function choose(button) {
    if (state.checking || button.classList.contains('vanish')) return;
    const id = Number(button.dataset.match);
    const side = button.dataset.side;
    if (side === 'term') {
      $('terms').querySelectorAll('.choice').forEach((b) => b.classList.remove('chosen'));
      button.classList.add('chosen');
      state.selected = { id, button };
      setFeedback('Teraz wybierz odpowiedni opis 👉');
      return;
    }
    if (!state.selected) {
      setFeedback('Najpierw wybierz nazwę z lewej strony 👈');
      return;
    }
    const left = state.selected.button;
    state.checking = true;
    const nonce = state.gameNonce;
    if (id === state.selected.id) {
      left.classList.remove('chosen');
      left.classList.add('correct');
      button.classList.add('correct');
      setFeedback('Brawo! Poprawna para! 🎉', 'good');
      state.matched.add(id);
      updateProgress();
      setTimeout(() => {
        if (nonce !== state.gameNonce) return;
        left.classList.add('vanish');
        button.classList.add('vanish');
        left.disabled = true;
        button.disabled = true;
        state.selected = null;
        state.checking = false;
        if (state.matched.size === state.activePairs.length) {
          $('gameColumns').hidden = true;
          $('finish').hidden = false;
          setFeedback('Wszystko dopasowane! 🌟', 'good');
        } else {
          setFeedback('Świetnie! Znajdź kolejną parę ✨');
        }
      }, 430);
    } else {
      left.classList.add('wrong');
      button.classList.add('wrong');
      setFeedback('Buuu! ❌ To nie ta para. Spróbuj jeszcze raz!', 'bad');
      playBoo();
      setTimeout(() => {
        if (nonce !== state.gameNonce) return;
        left.classList.remove('wrong', 'chosen');
        button.classList.remove('wrong');
        state.selected = null;
        state.checking = false;
      }, 700);
    }
  }
  function updateProgress() {
    const total = state.activePairs.length;
    const correct = state.matched.size;
    const percentage = total ? Math.round((correct / total) * 100) : 0;
    $('gameCounter').textContent = `${correct} / ${total}`;
    $('progressFill').style.width = `${percentage}%`;
    $('progressBar').setAttribute('aria-valuenow', String(percentage));
  }
  function playBoo() {
    if (!state.sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ctx.resume().then(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(92, ctx.currentTime + 0.42);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.10, ctx.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.49);
        osc.connect(gain).connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.51);
        osc.onended = () => ctx.close();
      }).catch(() => ctx.close());
    } catch { /* In silent/private iOS contexts the red warning is still visible. */ }
  }
  function leaveGame() { state.gameNonce++; show('libraryView'); }

  function updatePairCount() {
    $('pairCount').textContent = `${$('editorPairs').children.length} / 40`;
    $('addPair').disabled = $('editorPairs').children.length >= 40;
  }
  function appendPair(term = '', description = '') {
    if ($('editorPairs').children.length >= 40) return;
    const row = el('div', 'editpair');
    const termWrap = el('div');
    const termLabel = el('label', '', 'Nazwa / pojęcie');
    const termInput = el('textarea', 'field');
    termInput.classList.add('pair-term'); termInput.maxLength = 140; termInput.rows = 2;
    termInput.placeholder = 'Np. Linear sequence'; termInput.value = term;
    const descWrap = el('div');
    const descLabel = el('label', '', 'Opis / definicja');
    const descInput = el('textarea', 'field');
    descInput.classList.add('pair-description'); descInput.maxLength = 700; descInput.rows = 3;
    descInput.placeholder = 'A number pattern which…'; descInput.value = description;
    termLabel.append(termInput); descLabel.append(descInput);
    termWrap.append(termLabel); descWrap.append(descLabel);
    const remove = el('button', 'remove-pair', '×');
    remove.type = 'button'; remove.setAttribute('aria-label', 'Usuń parę');
    remove.addEventListener('click', () => { row.remove(); updatePairCount(); });
    row.append(termWrap, descWrap, remove);
    $('editorPairs').append(row);
    updatePairCount();
  }
  function openEditor(id = null) {
    if (id !== null && !state.admin) return;
    if (id === null && !state.canCreate) return;
    const quiz = id === null ? null : state.quizzes.find((q) => q.id === id);
    if (id !== null && !quiz) return;
    state.editorId = id;
    $('editorHeading').textContent = quiz ? `Edytuj: ${quiz.title}` : 'Nowy quiz';
    $('quizTitle').value = quiz ? quiz.title : '';
    $('editorPairs').replaceChildren();
    (quiz ? quiz.pairs : [{ term: '', description: '' }, { term: '', description: '' }]).forEach((p) => appendPair(p.term, p.description));
    $('editorError').textContent = '';
    $('deleteQuiz').hidden = !quiz;
    show('editorView');
    $('quizTitle').focus({ preventScroll: true });
  }
  function readQuizForm() {
    const title = $('quizTitle').value.trim();
    const pairs = [...$('editorPairs').children].map((row) => ({
      term: row.querySelector('.pair-term').value.trim(),
      description: row.querySelector('.pair-description').value.trim(),
    }));
    if (title.length < 2 || title.length > 100) throw new Error('Nazwa zestawu: od 2 do 100 znaków.');
    if (pairs.length < 2 || pairs.length > 40) throw new Error('Dodaj od 2 do 40 par.');
    for (let i = 0; i < pairs.length; i++) {
      if (!pairs[i].term || !pairs[i].description) throw new Error(`Uzupełnij nazwę i opis w parze numer ${i + 1}.`);
    }
    return { title, pairs };
  }
  async function saveEditor(event) {
    event.preventDefault();
    if (state.busy) return;
    let data;
    try { data = readQuizForm(); } catch (error) { $('editorError').textContent = error.message; return; }
    state.busy = true;
    $('saveQuiz').disabled = true;
    $('editorError').textContent = '';
    try {
      const result = await api(state.editorId === null ? 'create' : 'update', { ...data, ...(state.editorId === null ? {} : { id: state.editorId }) });
      await refresh();
      startGame(result.id);
    } catch (error) { $('editorError').textContent = error.message; }
    finally { state.busy = false; $('saveQuiz').disabled = false; }
  }
  async function deleteEditor() {
    if (!state.admin || state.editorId === null || state.busy) return;
    const quiz = state.quizzes.find((q) => q.id === state.editorId);
    if (!window.confirm(`Na pewno usunąć zestaw „${quiz?.title ?? ''}”? Nie da się tego cofnąć.`)) return;
    state.busy = true;
    try {
      await api('delete', { id: state.editorId });
      await refresh(); show('libraryView');
    } catch (error) { $('editorError').textContent = error.message; }
    finally { state.busy = false; }
  }
  async function toggleAdmin() {
    if (state.admin) {
      if (!window.confirm('Wylogować administratora?')) return;
      try { const result = await api('logout', {}); state.csrf = result.csrf; await refresh(); show('libraryView'); }
      catch (error) { alertBanner(error.message); }
      return;
    }
    $('loginError').textContent = '';
    $('adminPassword').value = '';
    if (!state.adminConfigured) $('loginError').textContent = 'Administrator musi najpierw ustawić hasło na serwerze (patrz README).';
    $('adminDialog').showModal();
  }
  async function login(event) {
    event.preventDefault();
    $('loginSubmit').disabled = true;
    $('loginError').textContent = '';
    try {
      const result = await api('login', { password: $('adminPassword').value });
      state.csrf = result.csrf;
      await refresh();
      $('adminDialog').close();
      $('adminPassword').value = '';
    } catch (error) { $('loginError').textContent = error.message; }
    finally { $('loginSubmit').disabled = false; }
  }

  $('newQuiz').addEventListener('click', () => openEditor());
  $('adminButton').addEventListener('click', toggleAdmin);
  $('closeAdmin').addEventListener('click', () => $('adminDialog').close());
  $('loginForm').addEventListener('submit', login);
  $('backFromGame').addEventListener('click', leaveGame);
  $('finishLibrary').addEventListener('click', leaveGame);
  $('restart').addEventListener('click', () => startGame(state.activeQuiz.id));
  $('playAgain').addEventListener('click', () => startGame(state.activeQuiz.id));
  $('soundToggle').addEventListener('click', () => {
    state.sound = !state.sound;
    $('soundToggle').textContent = state.sound ? '🔊' : '🔇';
    $('soundToggle').setAttribute('aria-pressed', String(state.sound));
    $('soundToggle').setAttribute('aria-label', state.sound ? 'Wyłącz dźwięk' : 'Włącz dźwięk');
  });
  $('addPair').addEventListener('click', () => appendPair());
  $('editorForm').addEventListener('submit', saveEditor);
  $('deleteQuiz').addEventListener('click', deleteEditor);
  for (const id of ['cancelEdit', 'cancelEditTop']) $(id).addEventListener('click', () => show('libraryView'));

  refresh().catch((error) => { alertBanner(`Nie udało się pobrać quizów: ${error.message}`); });
})();
