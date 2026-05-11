const mobileHomeVideo = '/video/video-home-page-mobile.mp4';

/**
 * Monta o MobileHomePage no container.
 * Usa MP4 diretamente — sem HLS (streams ainda não configurados no servidor).
 * @param {HTMLElement} container
 * @param {{ onVideoFinished?: () => void }} opts
 * @returns {() => void} cleanup
 */
export function mountMobileHomePage(container, { onVideoFinished } = {}) {
  container.innerHTML = `
    <div class="mobile-home-wrapper">
      <div class="mobile-home-bg js-mobile-bg" aria-hidden="true"></div>
      <video
        class="mobile-home-video js-mobile-video"
        muted playsinline preload="auto"
        src="${mobileHomeVideo}"
      ></video>
    </div>`;

  const bg    = container.querySelector('.js-mobile-bg');
  const video = container.querySelector('.js-mobile-video');

  video.addEventListener('loadeddata', () => {
    video.classList.add('is-ready');
    bg.classList.add('is-ready');
  });

  video.addEventListener('ended', () => onVideoFinished?.());

  // Se autoplay for bloqueado, considera o vídeo terminado e avança o fluxo
  video.addEventListener('error', () => onVideoFinished?.());

  const tryPlay = () => {
    const p = video.play();
    if (p) p.catch(() => onVideoFinished?.());
  };

  if (video.readyState >= 3) {
    tryPlay();
  } else {
    video.addEventListener('canplay', tryPlay, { once: true });
  }

  return () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
  };
}
