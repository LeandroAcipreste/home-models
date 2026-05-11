import gsap from 'gsap';

const N = 7;
const EFEITO_BASE = '/public/images/models/img-efeito-backgroung';
const FAN_CARD_W  = 601;
const FAN_CARD_H  = 416;

function efeitoSrc(f) { return `${EFEITO_BASE}/${encodeURIComponent(f)}`; }

const FAN_STACK_DESKTOP = [
  { transform: 'translate3d(-72%, 0, -800px)', file: '13.jpg',                    alt: 'Campanha moda — fundo esquerdo' },
  { transform: 'translate3d(-45%, 0, -550px)', file: 'IMG_9604.PNG',              alt: 'Editorial — cartão' },
  { transform: 'translate3d(-20%, 0, -260px)', file: 'charth_ss26_lb_041.JPG',    alt: 'Campanha moda — cartão' },
  { transform: 'translate3d(0%,   0,    0px)', file: 'imgi_4_00038-alaia-spring-2026-ready-to-wear-credit-brand.jpg', alt: 'Alaia — destaque central' },
  { transform: 'translate3d(20%,  0, -260px)', file: 'imgi_3_00023-carolina-herrera-fall-2026-ready-to-wear-credit-gorunway.jpg', alt: 'Carolina Herrera — cartão' },
  { transform: 'translate3d(45%,  0, -550px)', file: 'imgi_11_FIO00370.PNG',      alt: 'Editorial — cartão' },
  { transform: 'translate3d(72%,  0, -800px)', file: 'imgi_4_ISI00346.PNG',       alt: 'Destaque moda — fundo direito' },
];

const FAN_STACK_MOBILE = [
  { transform: 'translate3d(-72%, 0, -800px)', file: 'IMG_6458.JPG',              alt: 'Editorial moda — fundo esquerdo' },
  { transform: 'translate3d(-45%, 0, -550px)', file: '13.jpg',                    alt: 'Campanha moda — cartão' },
  { transform: 'translate3d(-20%, 0, -260px)', file: 'IMG_9604.PNG',              alt: 'Editorial moda — cartão' },
  { transform: 'translate3d(0%,   0,    0px)', file: 'imgi_4_00038-alaia-spring-2026-ready-to-wear-credit-brand.jpg', alt: 'Alaia — destaque central' },
  { transform: 'translate3d(20%,  0, -260px)', file: 'imgi_3_00023-carolina-herrera-fall-2026-ready-to-wear-credit-gorunway.jpg', alt: 'Carolina Herrera — cartão' },
  { transform: 'translate3d(45%,  0, -550px)', file: 'IMG_7644.JPG',              alt: 'Editorial moda — cartão' },
  { transform: 'translate3d(72%,  0, -800px)', file: '[Iasmin Reis] for Ralph Lauren Collection Spring 2026 Runway Show in New York.jpg', alt: 'Ralph Lauren — cartão fundo direito' },
];

const FAN_POSITIONS_DESKTOP = [
  { xPercent: -72, z: -800 },
  { xPercent: -45, z: -550 },
  { xPercent: -20, z: -260 },
  { xPercent: 0,   z: 0    },
  { xPercent: 20,  z: -260 },
  { xPercent: 45,  z: -550 },
  { xPercent: 72,  z: -800 },
];

const FAN_POSITIONS_MOBILE = [
  { xPercent: -45, z: -550 }, { xPercent: -30, z: -350 }, { xPercent: -15, z: -150 },
  { xPercent: 0,  z: 0    }, { xPercent: 15,  z: -150  }, { xPercent: 30,  z: -350 },
  { xPercent: 45, z: -550  },
];

function zIdx(p) { return Math.round(1000 + p.z + p.xPercent * 0.01); }

function applyFanPose(el, positions, cardIndex, shuffleK) {
  const s = (cardIndex + shuffleK + N * 10) % N;
  const p = positions[s];
  // xPercent e yPercent são relativos ao tamanho do elemento, perfeitos para centralização sem reflow
  gsap.set(el, {
    xPercent: p.xPercent,
    yPercent: 0,
    z: p.z,
    force3D: true,
    zIndex: zIdx(p),
    autoAlpha: 1
  });
}

function buildCards(stack) {
  return stack.map((item, i) =>
    `<div class="qs-fan-card-base rounded-fan js-fan-card" data-index="${i}">
       <img src="${efeitoSrc(item.file)}" alt="${item.alt}" width="${FAN_CARD_W}" height="${FAN_CARD_H}"
            draggable="false" loading="eager" decoding="async" class="qs-fan-card-img js-fan-img"
            data-index="${i}" />
     </div>`
  ).join('');
}

export function starsPageHTML() {
  return `
    <main class="qs-page stars-page-wrapper" aria-label="Stars — Home Model">
      <div class="stars-content-layer">
        <div class="stars-fan-outer">
          <div class="qs-fan-perspective-shell">
            <div class="qs-fan-tilt-layer">
              <div class="qs-fan-layout js-fan-layout">
                ${buildCards(FAN_STACK_DESKTOP)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>`;
}

export function initStarsPage(container) {
  const isMobile   = window.matchMedia('(max-width: 767px)').matches;
  const fanStack   = isMobile ? FAN_STACK_MOBILE  : FAN_STACK_DESKTOP;
  const positions  = isMobile ? FAN_POSITIONS_MOBILE : FAN_POSITIONS_DESKTOP;

  // Re-render cards corretos para mobile/desktop
  const layout = container.querySelector('.js-fan-layout');
  layout.innerHTML = buildCards(fanStack);

  const cards      = Array.from(layout.querySelectorAll('.js-fan-card'));
  let shuffleK     = 0;
  let stackReady   = false;
  let delayCall    = null;
  let cancelled    = false;

  const runShuffleStep = () => {
    if (cancelled) return;
    shuffleK = (shuffleK + 1) % N;
    const k  = shuffleK;
    const tl = gsap.timeline({
      defaults: { force3D: true, ease: 'power2.inOut', duration: 0.8 },
      onComplete: () => { delayCall = gsap.delayedCall(1.2, runShuffleStep); },
    });
    cards.forEach((el, i) => {
      const s = (i + k + N * 10) % N;
      const p = positions[s];
      tl.to(el, {
        xPercent: p.xPercent,
        yPercent: 0,
        z: p.z,
        autoAlpha: 1,
        onStart: () => gsap.set(el, { zIndex: zIdx(p) })
      }, 0);
    });
  };

  const tryStart = () => {
    if (cancelled) return;
    // Posiciona instantaneamente
    cards.forEach((el, i) => applyFanPose(el, positions, i, 0));
    
    // Fade-in elegante para evitar o "flash" de cartas aparecendo
    gsap.fromTo(cards, 
      { autoAlpha: 0, scale: 0.8 }, 
      { autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.05, ease: 'power2.out' }
    );

    // Inicia o loop de shuffle
    delayCall = gsap.delayedCall(1.5, runShuffleStep);
  };

  // Inicia TUDO imediatamente, sem esperar imagens. 
  // O navegador carrega as imagens em paralelo enquanto o leque já está montado.
  tryStart();

  return () => {
    cancelled = true;
    delayCall?.kill();
    gsap.killTweensOf(cards);
  };
}
