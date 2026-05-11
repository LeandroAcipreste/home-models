/**
 * router.js — SPA router com Hash Routing e suporte a Parâmetros (:id)
 */

let _currentCleanup = null;
let _outlet = null;
const _routes = {};

export function defineRoutes(routes) {
  Object.assign(_routes, routes);
}

export function setOutlet(el) {
  _outlet = el;
}

/** 
 * Retorna o path atual limpo
 */
export function currentPath() {
  const hash = location.hash || '#/';
  let p = hash.slice(1) || '/';
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/** 
 * Tenta encontrar uma rota que case com o path, suportando parâmetros :id
 */
function _matchRoute(path) {
  // 1. Match exato
  if (_routes[path]) return { handler: _routes[path], params: {} };

  // 2. Match dinâmico (ex: /model/:id)
  for (const routePath in _routes) {
    if (!routePath.includes(':')) continue;

    const routeParts = routePath.split('/').filter(Boolean);
    const pathParts  = path.split('/').filter(Boolean);

    if (routeParts.length !== pathParts.length) continue;

    const params = {};
    const match = routeParts.every((part, i) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = pathParts[i];
        return true;
      }
      return part === pathParts[i];
    });

    if (match) return { handler: _routes[routePath], params };
  }

  // 3. Fallback 404
  return { handler: _routes['*'], params: {} };
}

export function navigate(path) {
  const target = path.startsWith('/') ? path : `/${path}`;
  location.hash = target;
}

async function _render() {
  const path = currentPath();
  const state = history.state;

  if (typeof _currentCleanup === 'function') {
    try { await _currentCleanup(); } catch {}
  }
  _currentCleanup = null;

  const { handler, params } = _matchRoute(path);
  if (!handler || !_outlet) return;

  _outlet.classList.remove('route-transition-enter');
  void _outlet.offsetWidth;

  try {
    // Passamos os params para o handler
    const { html, init } = await handler({ ...state, params });
    _outlet.innerHTML = html;
    _outlet.classList.add('route-transition-enter');
    if (typeof init === 'function') {
      _currentCleanup = init(_outlet, { ...state, params }) ?? null;
    }
  } catch (err) {
    console.error('[Router] Render error:', err);
    _outlet.innerHTML = `<div style="color:red;padding:2rem;">Erro ao carregar: ${err.message}</div>`;
  }
}

export function startRouter() {
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return;
    e.preventDefault();
    navigate(href);
  });

  window.addEventListener('hashchange', () => _render());

  if (!location.hash && location.pathname !== '/' && !location.pathname.endsWith('index.html')) {
    location.replace(`#${location.pathname}`);
  } else {
    _render();
  }
}
