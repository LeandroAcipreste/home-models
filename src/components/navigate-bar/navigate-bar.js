import gsap from 'gsap';
import { rainbowBorder } from '../rainbow-border/rainbow-border.js';
import { button } from '../button/button.js';
import { setState } from '../../state.js';

const logoSrc = '/src/components/navigate-bar/logo-mode-models.jpg';

export function navigateBarHTML() {
  const logo = rainbowBorder({
    className: 'rb-pad',
    children: `<img src="${logoSrc}" alt="Home Model" width="180" height="48" decoding="async" class="nav-logo-img" />`,
  });

  const btnCadastro = button({
    children: 'Cadastre-se',
    to: '/cadastro',
    showIcon: false,
    className: 'cadastre-nav-btn nav-reveal-item btn-text-xs',
  });

  const btnLogin = button({
    label: 'Login',
    showIcon: true,
    href: '#login',
    className: 'nav-reveal-item btn-text-xs js-open-login',
  });

  return `
    <header class="nav-header" role="banner">
      <div class="nav-inner">
        <a href="/" class="nav-logo-link nav-reveal-item" aria-label="Home Model — início">${logo}</a>
        <nav class="nav-actions" aria-label="Conta">
          ${btnCadastro}
          ${btnLogin}
        </nav>
      </div>
    </header>`;
}

/** Ativa o evento de login e retorna cleanup */
export function initNavigateBar(container) {
  const loginBtn = container.querySelector('.js-open-login');
  if (loginBtn) {
    const handler = (e) => {
      e.preventDefault();
      setState('loginModalOpen', true);
    };
    loginBtn.addEventListener('click', handler);
    return () => loginBtn.removeEventListener('click', handler);
  }
}

/** Anima os itens de nav com GSAP */
export function revealNavItems(container) {
  const items = container.querySelectorAll('.nav-reveal-item');
  if (!items.length) return;
  items.forEach(el => el.classList.remove('nav-reveal-item'));
  gsap.fromTo(items,
    { y: 32, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.6, ease: 'power2.out', stagger: 0.28, delay: 0.4, clearProps: 'all' }
  );
}
