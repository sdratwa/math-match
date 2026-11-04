(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const state = {
    quizzes: [], admin: false, adminConfigured: false, canCreate: true, csrf: '',
    activeQuiz: null, activePairs: [], matched: new Set(), selected: null,
    checking: false, gameNonce: 0, sound: true, editorId: null, busy: false,
  };
  const views = ['libraryView', 'gameView', 'editorView', 'profileView', 'welcomeView', 'guestComparisonView'];
  const cards = ['🧩', '🔢', '🌈', '📚', '🚀', '⭐', '🦊'];

  function show(view) {
    if(view==='libraryView'&&!state.profile&&!state.guest)view='welcomeView';
    testVisible = false;
    state.gameNonce++;
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
    if((state.profile?.id??null)!==(data.profile?.id??null)) resetPlayerState();
    state.profile = data.profile;
    state.guest = !!data.guest;
    $('guestNotice').hidden = !state.guest;
    if(state.profile)state.sound=!!state.profile.sound;
    $('soundToggle').textContent=state.sound?'🔊':'🔇';
    $('soundToggle').setAttribute('aria-pressed',String(state.sound));
    $('soundToggle').setAttribute('aria-label',state.sound?'Wyłącz dźwięk':'Włącz dźwięk');
    renderNavigation();
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
      const play = el('button', 'btn btn-primary', '▶ Nauka');
      play.type = 'button';
      play.addEventListener('click', () => startGame(quiz.id));
      actions.append(play);
      actions.append(actionButton('Test', () => startAttempt(quiz.id, 'test')), actionButton('Ranking', () => ranking(quiz.id)));
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
  function startGame(id, restored = null) {
    if(!state.profile&&!state.guest){guestComparison();return;}
    if (state.profile && !restored) { startAttempt(id, 'learn'); return; }
    state.attempt = restored;
    const quiz = state.quizzes.find((q) => q.id === id) || (restored ? {id, title:restored.title,pairs:restored.pairs}:null);
    if (!quiz) return;
    state.gameNonce++;
    state.activeQuiz = quiz;
    state.activePairs = (restored?.pairs || quiz.pairs).map((p, i) => ({ ...p, matchId: i }));
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
    if (restored) {
      state.matched = new Set(state.activePairs.filter(p => restored.matched.includes(p.id)).map(p => p.matchId));
      for (const b of document.querySelectorAll('#gameColumns .choice')) if(state.matched.has(Number(b.dataset.match))) { b.disabled=true; b.classList.add('vanish'); }
      updateProgress();
    }
  }
  function makeChoice(pair, side) {
    const button = el('button', 'choice', side === 'term' ? pair.term : pair.description);
    button.type = 'button';
    button.dataset.match = String(pair.matchId);
    button.dataset.side = side;
    button.addEventListener('click', () => choose(button));
    return button;
  }
  async function choose(button) {
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
    let correct = id === state.selected.id;
    if (state.attempt) {
      const term = state.activePairs[state.selected.id].id, definition = state.activePairs[id].id;
      const pending = state.pendingAnswer;
      const event_key = pending && pending.term === term && pending.definition === definition ? pending.event_key : crypto.randomUUID();
      state.pendingAnswer = {term, definition, event_key};
      try { correct = (await api('attempt.answer', {attempt_id:state.attempt.id,...state.pendingAnswer})).correct; state.pendingAnswer=null; if(nonce!==state.gameNonce)return; }
      catch(error) { setFeedback(error.message,'bad');state.checking=false;return; }
    }
    if (correct) {
      left.classList.remove('chosen');
      left.classList.add('correct');
      button.classList.add('correct');
      setFeedback('Brawo! Poprawna para! 🎉', 'good');
      playTone();
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
      const result = await api(state.editorId === null ? 'create' : 'update', { ...data, ...(state.editorId === null ? {} : { id: state.editorId, revision: state.quizzes.find(q=>q.id===state.editorId)?.revision }) });
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
      await api('delete', { id: state.editorId, revision: state.quizzes.find(q=>q.id===state.editorId)?.revision });
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

  function actionButton(label, fn) {
    const b=el('button','btn',label);b.type='button';b.addEventListener('click',async()=>{b.disabled=true;try{await fn();}catch(e){alertBanner(e.message);}finally{b.disabled=false;}});return b;
  }
  const panel=el('section','editor-panel');panel.id='profileView';panel.hidden=true;
  $('libraryView').before(panel);
  const nav=el('nav','topactions');nav.setAttribute('aria-label','Nawigacja gracza');$('banner').before(nav);
  function resetPlayerState() {
    currentTest=null; pendingPause=false; state.pendingStart=null; state.pendingAnswer=null; state.attempt=null;
    panel.replaceChildren();
    state.activeQuiz=null; state.activePairs=[]; state.selected=null; state.matched=new Set();
    state.gameNonce++; state.sound=true;
    $('terms').replaceChildren(); $('descriptions').replaceChildren();
  }
  function welcomeScreen() {
    show('welcomeView'); $('welcomeHeading').focus({preventScroll:true});
  }
  function guestComparison() {
    show('guestComparisonView'); $('guestHeading').focus({preventScroll:true});
  }
  function renderNavigation(){
    nav.replaceChildren();
    if(state.profile||state.guest)nav.append(actionButton('Biblioteka',()=>show('libraryView')));
    if(state.profile){
      nav.append(actionButton(`${state.profile.avatar} ${state.profile.nickname}`,profileScreen),
        actionButton('Moje postępy i testy',()=>dashboard()),actionButton('Wznów naukę lub test',resumeList));
    } else {
      if(state.guest)nav.append(el('span','pill','🙂 Gość'));
      nav.append(actionButton('Utwórz profil',()=>profileScreen('register')),actionButton('Zaloguj się',()=>profileScreen('login')));
      if(state.guest&&currentTest?.guest&&currentTest.status!=='finished')nav.append(actionButton('Wróć do bieżącego testu',async()=>{
        const result=await api('guest.get',{attempt_id:currentTest.id});testScreen(result.attempt);
      }));
    }
    if(state.admin)nav.append(actionButton('Statystyki administratora',adminScreen));
  }
  function screen(title,focusHeading=true){show('profileView');const heading=el('h2','',title);heading.tabIndex=-1;panel.replaceChildren(heading);if(focusHeading)heading.focus({preventScroll:true});return panel;}
  function input(form,label,name,type='text',value='') {
    const l=el('label','fieldlabel',label),i=el('input','field');i.name=name;i.type=type;i.value=value;l.append(i);form.append(l);return i;
  }
  function profileForm(parent,existing=null){
    const f=el('form');input(f,'Ksywka','nickname','text',existing?.nickname||'').maxLength=40;
    const l=el('label','fieldlabel','Avatar'),a=el('select','field');a.name='avatar';for(const v of ['🦊','🐼','🐸','🦁','🐱','🚀','⭐']){const o=el('option','',v);o.value=v;a.append(o);}a.value=existing?.avatar||'🦊';l.append(a);f.append(l);
    if(!existing){for(const name of ['pin','pin_repeat']){const i=input(f,name==='pin'?'PIN — sześć cyfr':'Powtórz PIN',name,'password');i.inputMode='numeric';i.pattern='[0-9]{6}';i.maxLength=6;i.autocomplete='new-password';}input(f,'Zapamiętaj to urządzenie (HTTPS)','remember','checkbox');}
    const c=input(f,'Decyzja rodzica/opiekuna: zgadzam się na wyświetlanie ksywki i wyników w rankingu','consent','checkbox');c.checked=!!existing?.consent;
    f.append(el('p','muted','Ranking jest widoczny dla zalogowanych graczy. Zaznaczenie nie potwierdza tożsamości osoby dorosłej.'));
    const submit=el('button','btn btn-primary',existing?'Zapisz profil':'Utwórz profil');submit.type='submit';f.append(submit);
    f.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;try{const d=Object.fromEntries(new FormData(f));d.consent=c.checked;d.remember=!!f.elements.remember?.checked;await api(existing?'profile.update':'profile.register',d);await refresh();profileScreen();}catch(e){alertBanner(e.message);}finally{submit.disabled=false;}});parent.append(f);return f;
  }
  function profileScreen(kind='login'){
    const root=screen('Twój profil');
    if(state.profile){
      root.append(el('p','pill',`Kod gracza: ${state.profile.code}`),el('p','','Poproś rodzica o zapisanie kodu gracza. Kod i PIN umożliwiają powrót na innym urządzeniu.'));
      profileForm(root,state.profile);
      root.append(actionButton('Kod do przeniesienia profilu',async()=>{const d=await api('profile.pair',{});root.append(el('p','pill',`Jednorazowy kod (10 minut): ${d.code}`));}),actionButton('Wyloguj i zapomnij urządzenie',async()=>{await api('profile.logout',{});await refresh();welcomeScreen();}),actionButton('Unieważnij wszystkie sesje i urządzenia',async()=>{if(!confirm('Wylogować wszystkie urządzenia?'))return;await api('profile.revoke',{});await refresh();welcomeScreen();}));return;
    }
    root.append(actionButton(state.guest?'← Biblioteka quizów':'← Ekran startowy',()=>state.guest?show('libraryView'):welcomeScreen()));
    if(kind==='register') {
      root.append(el('h3','','Utwórz profil'));profileForm(root);
      root.append(actionButton('Mam już profil — zaloguj się',()=>profileScreen('login')));return;
    }
    root.append(el('h3','','Zaloguj się'));
    const f=el('form');input(f,'Kod gracza','code').maxLength=12;const pin=input(f,'PIN','pin','password');pin.inputMode='numeric';pin.maxLength=6;input(f,'Zapamiętaj urządzenie (HTTPS)','remember','checkbox');
    const login=el('button','btn btn-primary','Zaloguj');login.type='submit';f.append(login);f.addEventListener('submit',async e=>{e.preventDefault();login.disabled=true;try{await api('profile.login',{code:f.elements.code.value,pin:pin.value,remember:f.elements.remember.checked});await refresh();profileScreen();}catch(e){alertBanner(e.message);}finally{login.disabled=false;}});root.append(f);
    root.append(actionButton('Mam jednorazowy kod parowania',async()=>{const code=prompt('Kod z zalogowanego urządzenia');if(!code)return;await api('profile.pair-use',{code});await refresh();profileScreen();}));
    root.append(actionButton('Utwórz profil',()=>profileScreen('register')));
  }
  async function startAttempt(id,mode){
    if(!state.profile&&!state.guest){guestComparison();return;}
    if(!state.profile&&mode==='learn'){startGame(id);return;}
    if(state.starting)return;state.starting=true;
    try{
      const pending=state.pendingStart;
      const request_key=pending?.id===id&&pending.mode===mode?pending.request_key:crypto.randomUUID();state.pendingStart={id,mode,request_key};
      const identity=state.profile?.id??'guest';
      const d=await api(state.profile?'attempt.start':'guest.start',{id,mode,request_key});
      if(identity!==(state.profile?.id??'guest'))return;state.pendingStart=null;
      if(mode==='learn')startGame(id,d.attempt);else testScreen(d.attempt);
    }catch(e){alertBanner(e.message);}finally{state.starting=false;}
  }
  async function resumeList(){const d=await api('attempt.list',{});const root=screen('Niedokończone sesje');root.append(el('p','','Wznowiony test zachowa wynik w historii, ale nie wejdzie do rankingu.'));for(const s of d.attempts)root.append(actionButton(`${s.title} — ${s.mode==='learn'?'Nauka':'Test'}: kontynuuj`,async()=>{const d=await api('attempt.get',{attempt_id:s.id});if(s.mode==='learn')startGame(d.attempt.quiz_id,d.attempt);else testScreen(d.attempt);}));}
  let currentTest=null,testBusy=false,testVisible=false,pendingPause=false;
  const duration=n=>`${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`;
  async function testCommand(action,answers){
    if(!currentTest)return;if(testBusy){if(action==='pause')pendingPause=true;return;}testBusy=true;const attemptId=currentTest.id;
    try{const d=await api(`${currentTest.guest?'guest':'attempt'}.${action}`,{attempt_id:currentTest.id,revision:currentTest.revision,...(answers?{answers}:{})});if(currentTest?.id!==attemptId)return;currentTest=d.attempt;if(action==='pause')pendingPause=false;state.timerReceipt=Date.now();
      if(testVisible&&(action!=='heartbeat' || currentTest.status!=='active'))testScreen(currentTest);}
    catch(e){if(action==='pause')pendingPause=true;alertBanner(e.message+(currentTest?.guest?' Wybierz „Wróć do bieżącego testu” lub rozpocznij nowy.':' W razie konfliktu wybierz „Wznów naukę lub test”.'));}
    finally{testBusy=false;if(pendingPause&&action!=='pause'&&currentTest?.status==='active')queueMicrotask(()=>testCommand('pause'));}
  }
  function testScreen(s){
    if(currentTest?.id!==s.id)pendingPause=false;currentTest=s;const root=screen(`Test: ${s.title}`,false);testVisible=true;state.timerReceipt=Date.now();const timer=el('p','pill',`Czas aktywny: ${duration(s.active_seconds)}${s.guest?' · Gość':s.paused?' · poza rankingiem':''}`);timer.id='testTimer';root.append(timer);renderNavigation();
    if(s.status==='finished'){
      if(s.guest)root.append(el('p','muted','Świetna robota! Chcesz zapisywać swoje wyniki i obserwować postępy? Utwórz profil!'),actionButton('Utwórz profil',()=>profileScreen('register')));
      root.append(el('h3','',`${s.score} / ${s.pairs.length} poprawnych — dobra praca!`));
      for(const p of s.pairs)root.append(el('p','',`${s.answers[p.id]===p.id?'✓':'Do powtórki:'} ${p.term} → ${p.description}`));
      root.append(actionButton('Ponów test',()=>startAttempt(s.quiz_id,'test')),actionButton(s.guest?'Przejdź do Nauki':'Ćwicz błędne odpowiedzi',async()=>{
        if(s.guest){startGame(s.quiz_id);return;}
        const result=await api('attempt.start',{id:s.quiz_id,mode:'learn',request_key:crypto.randomUUID()});
        const wrong=new Set(s.pairs.filter(p=>s.answers[p.id]!==p.id).map(p=>p.id));
        let pairs=result.attempt.pairs.filter(p=>wrong.has(p.id));
        if(pairs.length===1)pairs.push(result.attempt.pairs.find(p=>p.id!==pairs[0].id));
        if(pairs.length>=2)result.attempt.pairs=pairs;
        startGame(s.quiz_id,result.attempt);
      }));return;
    }
    if(s.status==='paused'){root.append(el('p','',s.guest?'Test zapauzowany. Możesz kontynuować bieżącą grę. Wynik nie trafi do historii ani rankingu.':'Test zapauzowany. Odpowiedzi są zapisane. Ta próba pozostanie poza rankingiem.'),actionButton('Kontynuuj',()=>testCommand('resume')));return;}
    root.append(el('p','muted',s.guest?'Możesz pauzować i kontynuować bieżący test. Wyniki Gościa nie są zapisywane.':'Pauza, ukrycie strony lub wznowienie po przerwie wykluczają próbę z rankingu. Wynik pozostaje w Twojej historii.'));
    root.append(actionButton('Pauza',async()=>{if(s.guest||s.paused||confirm('Pauza trwale wyklucza tę próbę z rankingu. Kontynuować?'))await testCommand('pause');}));
    root.append(el('h3','','Połączone odpowiedzi'));
    const answers={...s.answers};
    for(const p of s.pairs){if(!answers[p.id])continue;const row=el('div','connected-pair');row.append(el('span','',`${p.term} — ${s.pairs.find(d=>d.id===answers[p.id]).description}`),actionButton('Rozłącz',()=>{delete answers[p.id];return testCommand('save',answers);}));root.append(row);}
    const columns=el('div','columns'),left=el('div','choices'),right=el('div','choices');columns.append(left,right);let selected=null;
    const feedback=el('p','feedback','Wybierz pojęcie, potem definicję. Poprawność poznasz po zakończeniu.');feedback.setAttribute('aria-live','polite');root.append(feedback,columns);
    for(const p of shuffle(s.pairs.filter(p=>!answers[p.id])))left.append(actionButton(p.term,()=>{selected=p.id;feedback.textContent=`Wybrano: ${p.term}. Wybierz definicję.`;}));
    for(const p of shuffle(s.pairs.filter(p=>!Object.values(answers).includes(p.id))))right.append(actionButton(p.description,async()=>{if(testBusy)return;if(!selected){feedback.textContent='Najpierw wybierz pojęcie.';return;}answers[selected]=p.id;await testCommand('save',answers);}));
    const finish=actionButton('Zakończ test',()=>testCommand('finish',answers));finish.disabled=Object.keys(answers).length!==s.pairs.length;root.append(finish);
    (finish.disabled?left.querySelector('button'):finish)?.focus({preventScroll:true});
  }
  setInterval(()=>{if(currentTest?.status==='active'&&testVisible&&!document.hidden&&!testBusy)testCommand(pendingPause?'pause':'heartbeat');},15000);
  setInterval(()=>{const timer=$('testTimer');if(timer&&testVisible&&currentTest?.status==='active')timer.textContent=`Czas aktywny: ${duration(currentTest.active_seconds+Math.floor((Date.now()-state.timerReceipt)/1000))}${currentTest.guest?' · Gość':currentTest.paused?' · poza rankingiem':''}`;},1000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&testVisible&&currentTest?.status==='active')testCommand('pause');});
  window.addEventListener('offline',()=>{if(currentTest?.status==='active')alertBanner(currentTest.guest?'Brak połączenia. Po powrocie internetu możesz wrócić do bieżącego testu.':'Brak połączenia. Wznowienie testu wyłączy kwalifikację do rankingu.');});
  async function ranking(id){if(!state.profile){const root=screen('Leaderboard');root.append(el('p','','Ranking jest dostępny dla zalogowanych profili. Jako Gość możesz dalej korzystać z Nauki i Testu.'),actionButton('Zaloguj się',()=>profileScreen('login')),actionButton('Biblioteka',()=>show('libraryView')));return;}const d=await api('leaderboard',{id});const root=screen('Leaderboard — aktualna wersja');d.ranking.forEach((r,i)=>root.append(el('p','',`${i+1}. ${r.avatar} ${r.nickname}: ${r.score}/${r.total} · ${duration(r.active_seconds)}`)));if(!d.ranking.length)root.append(el('p','','Brak wyników ze zgodą na udział.'));}
  const statusNames={new:'Nowe',learning:'W trakcie nauki',mastered:'Opanowane',review:'Do powtórki'};
  async function dashboard(id=null){
    const d=await api(id?'admin.stats':'stats',id?{id}:{});const root=screen(id?'Postępy gracza':'Moje postępy i testy');
    root.append(el('p','',`Poznane pojęcia: ${d.progress.length} · opanowane: ${d.progress.filter(p=>p.status==='mastered').length} · do powtórki: ${d.progress.filter(p=>p.status==='review').length}`));
    root.append(el('p','',`Sesje nauki: ${d.summary.learning_sessions||0} · Testy: ${d.summary.tests||0} · Średni wynik: ${Math.round(d.summary.average||0)}%`));
    for(const q of state.quizzes){
      const records=d.progress.filter(p=>p.quiz_id===q.id),mastered=records.filter(p=>p.status==='mastered').length;
      const best=d.best.find(b=>b.quiz_id===q.id);if(best)root.append(el('p','',`Najlepszy wynik: ${best.score}/${best.total} · ${duration(best.active_seconds)}`));
      root.append(el('h3','',`${q.title} — ${mastered}/${q.pairs.length} opanowanych (${Math.round(100*mastered/q.pairs.length)}%)`));
      const bar=el('progress');bar.max=q.pairs.length;bar.value=mastered;bar.setAttribute('aria-label',`Opanowanie ${q.title}`);root.append(bar);
      for(const pair of q.pairs){const p=records.find(p=>p.pair_id===pair.id);root.append(el('p','',`${pair.term}: ${statusNames[p?.status||'new']} · błędy: ${p?.errors||0}${p?' · '+new Date(p.last_seen*1000).toLocaleDateString('pl'):''}`));}
      if(!id)root.append(actionButton('Ćwicz trudne pojęcia',async()=>{
        const difficult=q.pairs.filter(p=>!records.some(r=>r.pair_id===p.id&&r.status==='mastered'));
        if(difficult.length<2){alertBanner('Powtórka wymaga co najmniej dwóch trudnych pojęć. Możesz uruchomić cały zestaw.');return;}
        // Sesja obejmuje pełną wersję; pozostałe pary pozostają do późniejszego wznowienia.
        const result=await api('attempt.start',{id:q.id,mode:'learn',request_key:crypto.randomUUID()});result.attempt.pairs=difficult;startGame(q.id,result.attempt);
      }));
    }
    root.append(el('h3','','Zmiana wyników w czasie (ostatnie testy)'));
    for(const h of d.history.filter(h=>h.mode==='test'&&h.status==='finished').slice(0,20).reverse()){
      const label=el('label','',`${new Date(h.finished*1000).toLocaleDateString('pl')} · ${h.title}: ${h.score}/${h.total}`),bar=el('progress');bar.max=h.total;bar.value=h.score;label.append(bar);root.append(label);
    }
    root.append(el('h3','','Ostatnie odpowiedzi w nauce'));
    for(const event of d.events){const p=JSON.parse(event.pairs_json).find(p=>p.id===event.pair_id);root.append(el('p','',`${event.title} · ${p?.term||''} · ${event.correct?'Poprawnie':'Błędnie'}${event.first_try?' · pierwsza próba':''} · ${new Date(event.created*1000).toLocaleString('pl')}`));}
    root.append(el('h3','','Historia (ostatnie 100 sesji)'));
    for(const h of d.history){root.append(el('p','',`${new Date(h.started*1000).toLocaleString('pl')} · ${h.title} v${h.version} · ${h.mode==='test'?'Test':'Nauka'} · ${h.score===null?h.status:`${h.score}/${h.total} · ${duration(h.active_seconds)}${h.paused?' · poza rankingiem':''}`}`));if(!id&&h.mode==='test'&&h.status==='finished')root.append(actionButton('Zobacz odpowiedzi',async()=>{const r=await api('attempt.get',{attempt_id:h.id});testScreen(r.attempt);}));}
  }
  async function adminScreen(search='',offset=0,sort='activity'){
    const d=await api('admin.list',{search,offset,sort});const root=screen('Gracze — administrator');
    const f=el('form'),i=input(f,'Ksywka lub kod','search','text',search),b=el('button','btn','Szukaj');b.type='submit';f.append(b);f.addEventListener('submit',e=>{e.preventDefault();adminScreen(i.value).catch(e=>alertBanner(e.message));});root.append(f,actionButton('Sortuj po ksywce',()=>adminScreen(search,0,'name')));
    for(const p of d.profiles){const card=el('article','quiz-card');card.append(el('h3','',`${p.avatar} ${p.nickname} · ${p.code}`),el('p','',`Testy: ${p.tests} · opanowane: ${p.mastered} · średnio: ${Math.round(p.average||0)}% · ranking: ${p.consent?'tak':'nie'}`),el('p','',`Utworzono: ${new Date(p.created_at*1000).toLocaleDateString('pl')} · aktywność: ${new Date(p.last_active*1000).toLocaleString('pl')}`));
      card.append(actionButton('Postępy',()=>dashboard(p.id)),actionButton('Reset PIN',async()=>{const pin=prompt('Nowy sześciocyfrowy PIN');if(pin)await api('admin.pin',{id:p.id,pin});}),actionButton('Unieważnij sesje',()=>api('admin.revoke',{id:p.id})),actionButton('Edytuj profil',()=>{const target=screen('Edycja profilu');const form=profileForm(target,p);form.replaceWith(form.cloneNode(true));const fresh=target.querySelector('form');fresh.addEventListener('submit',async e=>{e.preventDefault();try{await api('admin.update',{id:p.id,nickname:fresh.elements.nickname.value,avatar:fresh.elements.avatar.value,consent:fresh.elements.consent.checked});await adminScreen();}catch(e){alertBanner(e.message);}});}),actionButton('Usuń profil',async()=>{if(confirm(`Usunąć profil ${p.nickname} i całą jego historię?`)){await api('admin.delete',{id:p.id,confirm:true});await adminScreen(search,offset,sort);}}));root.append(card);
    }
    if(offset)root.append(actionButton('Poprzednia strona',()=>adminScreen(search,offset-50,sort)));
    if(d.profiles.length===50)root.append(actionButton('Następna strona',()=>adminScreen(search,offset+50,sort)));
  }
  function playTone(){if(!state.sound)return;try{const C=window.AudioContext||window.webkitAudioContext,c=new C();c.resume().then(()=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=660;g.gain.value=.05;o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.15);o.onended=()=>c.close();}).catch(()=>c.close());}catch{}}
  $('chooseGuest').addEventListener('click',guestComparison);
  $('guestBack').addEventListener('click',welcomeScreen);
  for(const id of ['chooseLogin','guestLogin'])$(id).addEventListener('click',()=>profileScreen('login'));
  for(const id of ['chooseRegister','guestRegister'])$(id).addEventListener('click',()=>profileScreen('register'));
  $('confirmGuest').addEventListener('click',async()=>{
    const button=$('confirmGuest');button.disabled=true;
    try{await api('guest.enter',{confirm:true});await refresh();show('libraryView');}
    catch(e){alertBanner(e.message);}finally{button.disabled=false;}
  });

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
    if(state.profile)api('profile.preferences',{sound:state.sound}).catch(e=>alertBanner(e.message));
    $('soundToggle').textContent = state.sound ? '🔊' : '🔇';
    $('soundToggle').setAttribute('aria-pressed', String(state.sound));
    $('soundToggle').setAttribute('aria-label', state.sound ? 'Wyłącz dźwięk' : 'Włącz dźwięk');
  });
  $('addPair').addEventListener('click', () => appendPair());
  $('editorForm').addEventListener('submit', saveEditor);
  $('deleteQuiz').addEventListener('click', deleteEditor);
  for (const id of ['cancelEdit', 'cancelEditTop']) $(id).addEventListener('click', () => show('libraryView'));

  refresh().then(()=>{if(state.profile||state.guest)show('libraryView');else welcomeScreen();}).catch((error) => { alertBanner(`Nie udało się pobrać quizów: ${error.message}`); });
})();
