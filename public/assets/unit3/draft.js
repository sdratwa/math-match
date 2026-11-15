/* Kopia bieżącej pracy w pamięci karty. Bez DOM, kont i połączeń sieciowych. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Unit3Draft = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const key = 'mathmatch.unit3.draft.v1', version = 1, maxLength = 250000;
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function valid(data) {
    const s = data?.session;
    if (data?.version !== version || !record(s) || !['exam', 'practice', 'learn'].includes(s.mode) ||
        typeof s.topic !== 'string' || typeof s.finished !== 'boolean' ||
        !Array.isArray(s.questions) || s.questions.length < 1 || s.questions.length > 17 ||
        !Number.isInteger(data.position) || data.position < 0 || data.position >= s.questions.length ||
        !Array.isArray(s.answers) || s.answers.length !== s.questions.length || !s.answers.every(record) ||
        !Array.isArray(s.first) || s.first.length !== s.questions.length ||
        !s.first.every(first => first === null || record(first) && record(first.answers) && typeof first.helped === 'boolean') ||
        !['checked', 'helped', 'hints', 'translations'].every(name => record(s[name]))) return false;
    return s.questions.every(q => record(q) && typeof q.id === 'string' && typeof q.topic === 'string' &&
      typeof q.prompt === 'string' && typeof q.explanation === 'string' && record(q.params) &&
      Array.isArray(q.fields) && q.fields.length > 0 && q.fields.every(f => record(f) && typeof f.id === 'string' && typeof f.kind === 'string') &&
      Array.isArray(q.parts) && q.parts.length > 0 && q.parts.every(p => record(p) && Array.isArray(p.fields)));
  }
  // Dostęp do sessionStorage może sam rzucić wyjątek, dlatego przekazujemy funkcję.
  function create(getStorage) {
    return {
      save(session, position) {
        try {
          const data = { version, session, position };
          if (!valid(data)) return false;
          const json = JSON.stringify(data);
          if (json.length > maxLength) return false;
          getStorage().setItem(key, json);
          return true;
        } catch { return false; }
      },
      load() {
        try {
          const json = getStorage().getItem(key);
          if (json === null) return { status: 'empty' };
          if (json.length > maxLength) return { status: 'invalid' };
          let data;
          try { data = JSON.parse(json); } catch { return { status: 'invalid' }; }
          return valid(data) ? { status: 'saved', session: data.session, position: data.position } : { status: 'invalid' };
        } catch { return { status: 'unavailable' }; }
      },
      clear() {
        try { getStorage().removeItem(key); return true; } catch { return false; }
      }
    };
  }
  return { create };
});
