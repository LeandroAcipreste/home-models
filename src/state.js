/**
 * state.js — Substitui os React Contexts (IntroChromeContext + LoginModalContext)
 * com um sistema de pub/sub simples baseado em módulo JS.
 */

const _state = {
  homeBottomNavHidden: true,       // começa escondido — só aparece após os vídeos
  bottomNavPermanentlyHidden: false,
  loginModalOpen: false,
};

/** @type {Record<string, Array<(value: any) => void>>} */
const _subs = {};

/** Retorna o valor atual de uma chave */
export function getState(key) {
  return _state[key];
}

/** Atualiza o estado e notifica os subscribers */
export function setState(key, value) {
  if (_state[key] === value) return;
  _state[key] = value;
  (_subs[key] ?? []).forEach(cb => cb(value));
}

/**
 * Inscreve um callback para mudanças em `key`.
 * Retorna uma função de cancelamento (unsubscribe).
 */
export function subscribe(key, callback) {
  if (!_subs[key]) _subs[key] = [];
  _subs[key].push(callback);
  return () => {
    _subs[key] = _subs[key].filter(cb => cb !== callback);
  };
}
