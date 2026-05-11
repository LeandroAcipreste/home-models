import Hls from 'hls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { navigateBarHTML, initNavigateBar, revealNavItems } from '../../components/navigate-bar/navigate-bar.js';

const HERO_VIDEO       = '/video/Crystal_shards_assemble_202604030618.mp4';
const HERO_STREAM      = '/public/streams/hero-desktop/index.m3u8';
const HERO_FINAL_FRAME = '/public/images/backgrounds/frame_00192.webp';

/**
 * Monta o Hero com scroll-scrub.
 *
 * Fluxo completo:
 *   1. Vídeo carrega em background enquanto a intro toca
 *   2. triggerPlay() é chamado quando a intro começa a levantar
 *   3. Vídeo do hero toca até o fim (cristais se construindo)
 *   4. Vídeo termina → TODOS os botões aparecem + scroll-scrub ativa
 *   5. Usuário faz scroll para desconstruir/reconstruir os cristais
 *
 * @param {HTMLElement} container
 * @param {{ skipIntro?, onReady?, onHeaderNavReveal? }} opts
 * @returns {{ triggerPlay, cleanup }}
 */
export function mountHero(container, {
  skipIntro = false,
  onReady,
  onHeaderNavReveal,
} = {}) {

  container.innerHTML = `
    <div class="hero-scroll-zone js-scroll-zone">
      <div class="hero-sticky-container js-hero-container">
        ${navigateBarHTML()}
        <div class="hero-bg-fill" aria-hidden="true"></div>
        ${skipIntro
          ? `<img src="${HERO_FINAL_FRAME}" alt="" fetchpriority="high" decoding="async" class="hero-final-frame" aria-hidden="true" />`
          : `<video class="hero-video js-hero-video" muted playsinline preload="auto" aria-hidden="true"></video>`
        }
      </div>
    </div>`;

  const heroContainer = container.querySelector('.js-hero-container');
  const scrollZone    = container.querySelector('.js-scroll-zone');
  const cleanupNav    = initNavigateBar(container) ?? (() => {});

  // ── Nav / botões reveal ────────────────────────────────────────────────────
  let navRevealed = false;
  const revealAllButtons = () => {
    if (navRevealed) return;
    navRevealed = true;
    console.log('[Hero] Revealing all buttons');
    onHeaderNavReveal?.();        // setState('homeBottomNavHidden', false) → mostra bottom nav
    revealNavItems(heroContainer); // anima logo + cadastre-se + login
  };

  if (skipIntro) {
    revealAllButtons();
    onReady?.();
    return { triggerPlay: () => {}, cleanup: cleanupNav };
  }

  // ── Carrega o vídeo ────────────────────────────────────────────────────────
  const video = container.querySelector('.js-hero-video');
  let hls     = null;
  let st      = null;

  const loadFallback = () => {
    hls?.destroy(); hls = null;
    video.src     = HERO_VIDEO;
    video.preload = 'auto';
    video.load();
  };

  // Tenta HLS; se falhar em 1.5s vai direto para o MP4
  let hlsTimer = null;
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = HERO_STREAM;
    video.load();
    hlsTimer = setTimeout(loadFallback, 1500);
    video.addEventListener('loadedmetadata', () => clearTimeout(hlsTimer), { once: true });
  } else if (Hls.isSupported()) {
    hls = new Hls({ enableWorker: false });
    hls.loadSource(HERO_STREAM);
    hls.attachMedia(video);
    hlsTimer = setTimeout(loadFallback, 1500);
    hls.on(Hls.Events.MANIFEST_PARSED, () => clearTimeout(hlsTimer));
    hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) { clearTimeout(hlsTimer); loadFallback(); } });
  } else {
    loadFallback();
  }

  // Sinaliza ao home.js que o hero já está pronto para a intro levantar
  // rAF garante que introCtrl já foi atribuído no home.js
  requestAnimationFrame(() => onReady?.());

  // ── Finalização do Vídeo ───────────────────────────────────────────────────
  const finalizeHero = () => {
    video.pause();
    // No fim do vídeo, paramos no último frame
    if (!isNaN(video.duration)) video.currentTime = video.duration;
    revealAllButtons();
  };

  // ── triggerPlay: chamado quando a intro começa a levantar ─────────────────
  const triggerPlay = () => {
    console.log('[Hero] triggerPlay called');
    video.classList.add('is-playing');

    video.addEventListener('ended', () => {
      console.log('[Hero] Video ended — revealing buttons');
      finalizeHero();
    }, { once: true });

    video.play().catch(() => {
      console.warn('[Hero] Autoplay blocked, revealing buttons');
      finalizeHero();
    });
  };

  // ── cleanup ────────────────────────────────────────────────────────────────
  const cleanup = () => {
    clearTimeout(hlsTimer);
    hls?.destroy();
    video.pause();
    video.removeAttribute('src');
    video.load();
    cleanupNav();
  };

  return { triggerPlay, cleanup };
}
