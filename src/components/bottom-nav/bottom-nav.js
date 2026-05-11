import gsap from 'gsap';
import { button } from '../button/button.js';
import { getState, subscribe } from '../../state.js';
import { currentPath } from '../../router.js';

const NAV_ITEMS = [
  { to: '/quem-somos',    label: 'QUEM SOMOS' },
  { to: '/feminino',      label: 'FEMININO' },
  { to: '/masculino',     label: 'MASCULINO' },
  { to: '/stars',         label: 'STARS' },
  { to: '/fashion-school',label: 'FASHION SCHOOL' },
];

function buildHTML() {
  const items = NAV_ITEMS.map(item =>
    `<div class="bottom-nav-reveal-item">${button({ children: item.label, to: item.to, showIcon: false, className: 'bottom-nav-item' })}</div>`
  ).join('');

  return `<nav class="bottom-nav" aria-label="Navegação de seções" aria-hidden="true">
    <div class="bottom-nav__inner">${items}</div>
  </nav>`;
}

function applyReveal(nav, revealed) {
  const items = nav.querySelectorAll('.bottom-nav-reveal-item');
  if (!items.length) return;

  nav.classList.toggle('bottom-nav--revealed', revealed);
  nav.setAttribute('aria-hidden', String(!revealed));

  if (revealed) {
    gsap.to(items, { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)', stagger: 0.1, delay: 0.1, overwrite: 'auto' });
  } else {
    gsap.set(items, { opacity: 0, y: 32, overwrite: 'auto' });
  }
}

/** Monta a BottomNavBar no container e retorna cleanup */
export function mountBottomNav(container) {
  const update = () => {
    const path     = currentPath();
    const hidden   = getState('homeBottomNavHidden');
    const permHide = getState('bottomNavPermanentlyHidden');

    if (path === '/cadastro' || permHide) {
      container.innerHTML = '';
      return;
    }

    // Renderiza se ainda não tiver HTML
    if (!container.querySelector('.bottom-nav')) {
      container.innerHTML = buildHTML();
    }

    const nav = container.querySelector('.bottom-nav');
    applyReveal(nav, !hidden);
  };

  update();

  const unsub1 = subscribe('homeBottomNavHidden', update);
  const unsub2 = subscribe('bottomNavPermanentlyHidden', update);

  // Re-render ao trocar de rota
  window.addEventListener('popstate', update);

  return () => {
    unsub1();
    unsub2();
    window.removeEventListener('popstate', update);
  };
}
