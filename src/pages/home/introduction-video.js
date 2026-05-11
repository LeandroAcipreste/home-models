import Hls from 'hls.js';

const introVideoDesktop = '/video/video-de-entrada.mp4';
const introVideoMobile  = '/video/video-de-entrada.mp4';

function sourceForViewport() {
  return { fallback: introVideoDesktop };
}

/**
 * Monta o overlay de intro e retorna { setReady, cleanup }.
 * @param {HTMLElement} container
 * @param {{ readyToReveal?, onFinish?, onLiftStart? }} opts
 */
export function mountIntroductionVideo(container, {
  readyToReveal = false,
  onFinish,
  onLiftStart,
} = {}) {
  container.innerHTML = `
    <main class="intro-overlay" aria-hidden="true">
      <div class="intro-lift-panel js-lift-panel">
        <video
          class="intro-video-el js-intro-video"
          autoplay muted playsinline preload="auto"
        ></video>
      </div>
    </main>`;

  const panel = container.querySelector('.js-lift-panel');
  const video = container.querySelector('.js-intro-video');

  let lifting     = false;
  let videoDone   = false;
  let finishFired = false;
  let readyState  = readyToReveal;

  const fireFinish = () => {
    if (finishFired) return;
    finishFired = true;
    onFinish?.();
  };

  const doLift = () => {
    if (lifting) return;
    lifting = true;
    onLiftStart?.();
    panel.classList.add('is-lifting');
    // transitionend como primário, setTimeout como fallback
    const tid = setTimeout(fireFinish, 1100);
    panel.addEventListener('transitionend', (e) => {
      if (e.target === panel && e.propertyName === 'transform') {
        clearTimeout(tid);
        fireFinish();
      }
    }, { once: true });
  };

  const tryLift = () => {
    if (videoDone && readyState && !lifting) {
      setTimeout(doLift, 380);
    }
  };

  // Safety net: se o vídeo travar, levanta de qualquer forma em 30s
  const safetyTimer = setTimeout(() => { videoDone = true; readyState = true; tryLift(); }, 30000);

  video.addEventListener('ended', () => { videoDone = true; tryLift(); });
  video.addEventListener('error', () => { videoDone = true; tryLift(); });

  video.addEventListener('loadeddata', () => {
    video.classList.add('is-ready');
    // Colore o painel com cor amostrada do vídeo
    try {
      const canvas = Object.assign(document.createElement('canvas'), { width: 8, height: 8 });
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 8, 8);
      const d = ctx.getImageData(0, 0, 8, 8).data;
      const avg = (i) => (d[i] + d[i+32] + d[i+192] + d[i+224]) / 4;
      const luma = (0.299*avg(0) + 0.587*avg(1) + 0.114*avg(2)) / 255;
      if (luma > 0.14) panel.style.backgroundColor = `rgb(${Math.round(avg(0))},${Math.round(avg(1))},${Math.round(avg(2))})`;
    } catch {}
  });

  // Carrega o vídeo — usa diretamente o MP4 (sem HLS para o intro, que é sempre um MP4)
  const { fallback } = sourceForViewport();
  video.src = fallback;
  video.load();

  const tryPlay = () => {
    const p = video.play();
    if (p) p.catch(() => {
      // Autoplay bloqueado — levanta a intro sem o vídeo tocar
      videoDone = true;
      tryLift();
    });
  };

  if (video.readyState >= 3) {
    tryPlay();
  } else {
    video.addEventListener('canplay', tryPlay, { once: true });
  }

  const setReady = () => {
    readyState = true;
    tryLift();
  };

  if (readyToReveal) setReady();

  const cleanup = () => {
    clearTimeout(safetyTimer);
    video.pause();
    video.removeAttribute('src');
    video.load();
  };

  return { setReady, cleanup };
}
