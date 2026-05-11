
console.log('[Main] App starting...');
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { defineRoutes, setOutlet, startRouter } from './router.js';

// Componentes persistentes (shell)
import { mountBottomNav } from './components/bottom-nav/bottom-nav.js';
import { mountLoginModal } from './components/login-modal/login-modal.js';
import { mountFixedHomeButton } from './components/fixed-home-button/fixed-home-button.js';

// Páginas
import { homePageHTML, initHomePage } from './pages/home/home.js';
import { quemSomosHTML, initQuemSomos } from './pages/quemSomos/quem-somos.js';
import { starsPageHTML, initStarsPage } from './pages/stars/stars.js';
import { femaleModelsHTML, initFemaleModels } from './pages/femaleModels/female-models.js';
import { maleModelsHTML,   initMaleModels }   from './pages/maleModels/male-models.js';
import { modelProfileHTML, initModelProfile }  from './pages/modelProfile/model-profile.js';
import { cadastroPageHTML, initCadastroPage } from './pages/cadastro/cadastro.js';
import { sectionPageHTML }                   from './pages/section/section.js';

// ─── GSAP ─────────────────────────────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

// ─── Lenis (scroll suave) ────────────────────────────────────────────────────
const lenis = new Lenis({
  autoRaf: false,
  duration: 1.2,
  smoothWheel: true,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.4,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

// Sincroniza Lenis com GSAP ticker
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Avisa o ScrollTrigger quando o Lenis scrolla (sem proxy — evita desync com video scrub)
lenis.on('scroll', ScrollTrigger.update);

// ─── Histórico de scroll ─────────────────────────────────────────────────────
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch { }
window.scrollTo(0, 0);
document.documentElement.scrollTop = 0;

const forceTop = () => {
  window.scrollTo(0, 0);
  lenis.scrollTo(0, { immediate: true });
  requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
};
window.addEventListener('pageshow', e => { if (e.persisted) forceTop(); });

import { setState } from './state.js';

// ─── Rotas ────────────────────────────────────────────────────────────────────
const showNav = () => setState('homeBottomNavHidden', false);

defineRoutes({
  '/': (state) => ({
    html: homePageHTML(),
    init: (container) => { forceTop(); return initHomePage(container, state); },
  }),
  '/quem-somos': () => ({
    html: quemSomosHTML(),
    init: (c) => { forceTop(); showNav(); return initQuemSomos(c); },
  }),
  '/stars': () => ({
    html: starsPageHTML(),
    init: (c) => { forceTop(); showNav(); return initStarsPage(c); },
  }),
  '/feminino': () => ({
    html: femaleModelsHTML(),
    init: (c) => { forceTop(); showNav(); return initFemaleModels(c); },
  }),
  '/masculino': () => ({
    html: maleModelsHTML(),
    init: (c) => { forceTop(); showNav(); return initMaleModels(c); },
  }),
  '/fashion-school': () => ({
    html: sectionPageHTML('Fashion School'),
    init: () => { forceTop(); showNav(); },
  }),
  '/cadastro': () => ({
    html: cadastroPageHTML(),
    init: (c) => { forceTop(); return initCadastroPage(c); },
  }),
  '/model/:id': (state) => ({
    html: modelProfileHTML(state),
    init: (c) => { forceTop(); showNav(); return initModelProfile(c, state); },
  }),
  '*': () => ({
    html: sectionPageHTML('Página não encontrada'),
    init: () => { forceTop(); showNav(); },
  }),
});

// ─── Monta shell persistente ─────────────────────────────────────────────────
const cleanupBtn = mountFixedHomeButton(document.getElementById('fixed-home-btn-root'));
const cleanupNav = mountBottomNav(document.getElementById('bottom-nav-root'));
const cleanupModal = mountLoginModal(document.getElementById('login-modal-root'));

// ─── Inicia o router ──────────────────────────────────────────────────────────
const outlet = document.getElementById('page-root');
if (outlet) {
  setOutlet(outlet);
  console.log('[Main] Router starting...');
  startRouter();
} else {
  console.error('[Main] #page-root not found!');
}

// ─── CSS da borda arredondada dos cards de fan ────────────────────────────────
// (classe inline que o Tailwind cobria com rounded-[20px])
const style = document.createElement('style');
style.textContent = '.rounded-fan { border-radius: 20px; }';
document.head.appendChild(style);
