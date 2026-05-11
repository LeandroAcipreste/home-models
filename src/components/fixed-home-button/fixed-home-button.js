import { rainbowBorder } from '../rainbow-border/rainbow-border.js';
import { navigate, currentPath } from '../../router.js';

const logoSrc = '/src/components/navigate-bar/logo-mode-models.jpg';

const imgInner = `<img src="${logoSrc}" alt="Home Model" width="60" height="60" decoding="async" class="fixed-home-btn-img" />`;
const rbContent = rainbowBorder({ className: 'rb-pad-sm', children: imgInner });

const HTML = `<button type="button" id="fixed-home-btn" class="fixed-home-btn" aria-label="Voltar para página inicial">${rbContent}</button>`;

export function mountFixedHomeButton(container) {
  container.innerHTML = HTML;
  const btn = container.querySelector('#fixed-home-btn');

  const sync = () => {
    const isHome = currentPath() === '/';
    btn.classList.toggle('is-visible', !isHome);
  };

  btn.addEventListener('click', () => {
    navigate('/', { state: { skipIntro: true } });
  });

  sync();
  window.addEventListener('popstate', sync);

  return () => window.removeEventListener('popstate', sync);
}
