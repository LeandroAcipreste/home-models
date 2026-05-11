import { rainbowBorder } from '../rainbow-border/rainbow-border.js';
import { getState, setState, subscribe } from '../../state.js';

const logoSrc = '/src/components/navigate-bar/logo-mode-models.jpg';

function buildHTML() {
  const submitInner = rainbowBorder({
    className: 'rb-pad-login',
    children: `<span style="padding:0.65rem 1.1rem;font-size:0.875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#18181b;">Entrar</span>`,
  });

  return `
  <div class="login-modal-overlay js-modal-overlay" role="presentation">
    <div class="login-modal-card" role="dialog" aria-modal="true" aria-label="Login Home Model"
         style="--login-brand-bg:url(${logoSrc})">
      <div class="login-modal-head">
        <h2 class="login-modal-title">Acesse sua conta</h2>
        <button type="button" class="login-modal-close js-modal-close" aria-label="Fechar login">×</button>
      </div>
      <form class="login-modal-form js-login-form">
        <label class="login-modal-field">
          <span>E-mail</span>
          <input type="email" required name="email" placeholder="nome@dominio.com" autocomplete="email" />
        </label>
        <label class="login-modal-field">
          <span>Senha</span>
          <input type="password" required name="senha" autocomplete="current-password" />
        </label>
        <button type="submit" class="login-modal-submit-wrap">${submitInner}</button>
        <p class="login-modal-message js-login-msg" hidden></p>
      </form>
    </div>
  </div>`;
}

export function mountLoginModal(container) {
  let rendered = false;

  const sync = (isOpen) => {
    if (isOpen && !rendered) {
      container.innerHTML = buildHTML();
      rendered = true;
      bindEvents();
    }
    const overlay = container.querySelector('.js-modal-overlay');
    if (overlay) overlay.style.display = isOpen ? '' : 'none';
    // Keyboard ESC
    if (isOpen) {
      document.addEventListener('keydown', onKeyDown);
    } else {
      document.removeEventListener('keydown', onKeyDown);
    }
  };

  const onKeyDown = (e) => { if (e.key === 'Escape') setState('loginModalOpen', false); };

  const bindEvents = () => {
    const overlay = container.querySelector('.js-modal-overlay');
    const closeBtn = container.querySelector('.js-modal-close');
    const form = container.querySelector('.js-login-form');
    const msg = container.querySelector('.js-login-msg');

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) setState('loginModalOpen', false);
    });
    closeBtn?.addEventListener('click', () => setState('loginModalOpen', false));
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      msg.textContent = 'Login enviado. Você será redirecionado após validação.';
      msg.hidden = false;
    });
  };

  // Init
  sync(getState('loginModalOpen'));
  const unsub = subscribe('loginModalOpen', sync);

  return () => {
    unsub();
    document.removeEventListener('keydown', onKeyDown);
  };
}
