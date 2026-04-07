import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import introVideoMobile from "../../../video/entrance-mobile.mp4";
import introVideoDesktop from "../../../video/video-de-entrada.mp4";

/** Mobile até 639px (breakpoint `sm` do Tailwind); tablet e acima usam o vídeo desktop. */
const INTRO_VIDEO_MOBILE_MQ = "(max-width: 639px)";
const INTRO_STREAM_MOBILE = "/streams/intro-mobile/index.m3u8";
const INTRO_STREAM_DESKTOP = "/streams/intro-desktop/index.m3u8";

type IntroSource = {
  stream: string;
  fallback: string;
};

function introSourceForViewport(): IntroSource {
  if (typeof window === "undefined") {
    return { stream: INTRO_STREAM_DESKTOP, fallback: introVideoDesktop };
  }
  return window.matchMedia(INTRO_VIDEO_MOBILE_MQ).matches
    ? { stream: INTRO_STREAM_MOBILE, fallback: introVideoMobile }
    : { stream: INTRO_STREAM_DESKTOP, fallback: introVideoDesktop };
}

/** Fallback branco puro para matar o flash escuro inicial */
const INTRO_BG_FALLBACK = "#ffffff";

/** Evita painel fullscreen preto quando o vídeo tem letterbox / bordas escuras */
function isSampledBgTooDark(rgb: string): boolean {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return true;
  const r = Number(m[0]);
  const g = Number(m[1]);
  const b = Number(m[2]);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma < 0.14;
}

type IntroductionVideoProps = {
  onFinish?: () => void;
  readyToReveal: boolean;
  onLiftStart?: () => void;
};

/** Média dos cantos para aproximar a cor de fundo do vídeo (se necessário) */
function sampleVideoBackground(video: HTMLVideoElement): string | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const canvas = document.createElement("canvas");
  const w = 16;
  const h = 16;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  try {
    ctx.drawImage(video, 0, 0, vw, vh, 0, 0, w, h);
  } catch {
    return null;
  }

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, w, h);
  } catch {
    return null;
  }

  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [x, y] of corners) {
    const i = (y * w + x) * 4;
    r += data.data[i];
    g += data.data[i + 1];
    b += data.data[i + 2];
  }
  const n = corners.length;
  return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
}

function IntroductionVideo({
  onFinish,
  readyToReveal,
  onLiftStart,
}: IntroductionVideoProps) {
  const [isLifting, setIsLifting] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const [panelBg, setPanelBg] = useState(INTRO_BG_FALLBACK);

  // Estado para matar o fundo preto: o vídeo começa invisível e só aparece quando tem imagem
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [introSource, setIntroSource] = useState<IntroSource>(() =>
    introSourceForViewport(),
  );

  const finishFiredRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isVideoReadyRef = useRef(false);

  useEffect(() => {
    isVideoReadyRef.current = isVideoReady;
  }, [isVideoReady]);

  /** Último recurso: remove o overlay se algo travar a sequência normal */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (finishFiredRef.current) return;
      finishFiredRef.current = true;
      onFinish?.();
    }, 35000);
    return () => window.clearTimeout(id);
  }, [onFinish]);

  /** Escolhe mobile vs desktop de forma fiável (Chrome ignora `media` em `<source>` do vídeo). */
  useEffect(() => {
    const mq = window.matchMedia(INTRO_VIDEO_MOBILE_MQ);
    const sync = () => {
      setIntroSource(
        mq.matches
          ? { stream: INTRO_STREAM_MOBILE, fallback: introVideoMobile }
          : { stream: INTRO_STREAM_DESKTOP, fallback: introVideoDesktop },
      );
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setIsVideoReady(false);
  }, [introSource]);

  /** Anexa stream HLS com fallback MP4 e tenta autoplay sem esperar arquivo inteiro. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    let interactionPlayBound = false;
    const playOnInteraction = () => {
      void video.play().catch(() => {
        /* mantém aguardando nova interação */
      });
    };
    const bindInteractionPlay = () => {
      if (interactionPlayBound) return;
      interactionPlayBound = true;
      window.addEventListener("pointerdown", playOnInteraction, { once: true });
      window.addEventListener("keydown", playOnInteraction, { once: true });
    };

    const play = () => {
      void video.play().catch((err) => {
        console.warn("Autoplay bloqueado pelo navegador:", err);
        // Não finaliza automaticamente: tenta novamente na primeira interação.
        bindInteractionPlay();
      });
    };

    let hls: Hls | null = null;
    let fallbackTimer: number | null = null;
    let usingFallback = false;

    const clearFallbackTimer = () => {
      if (fallbackTimer == null) return;
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    };

    const switchToFallback = () => {
      if (usingFallback) return;
      usingFallback = true;
      clearFallbackTimer();
      hls?.destroy();
      hls = null;
      video.src = introSource.fallback;
      video.load();
      play();
    };

    // Alguns navegadores/dispositivos falham silenciosamente no HLS.
    fallbackTimer = window.setTimeout(() => {
      if (!isVideoReadyRef.current) {
        switchToFallback();
      }
    }, 6000);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = introSource.stream;
      video.load();
      play();
      return () => {
        clearFallbackTimer();
        window.removeEventListener("pointerdown", playOnInteraction);
        window.removeEventListener("keydown", playOnInteraction);
        video.removeAttribute("src");
        video.load();
      };
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(introSource.stream);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => play());
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        switchToFallback();
      });
      return () => {
        clearFallbackTimer();
        window.removeEventListener("pointerdown", playOnInteraction);
        window.removeEventListener("keydown", playOnInteraction);
        hls?.destroy();
      };
    }

    video.src = introSource.fallback;
    video.load();
    play();
    return () => {
      clearFallbackTimer();
      window.removeEventListener("pointerdown", playOnInteraction);
      window.removeEventListener("keydown", playOnInteraction);
      video.removeAttribute("src");
      video.load();
    };
  }, [introSource]);

  const applyBackgroundFromVideo = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const sampled = sampleVideoBackground(el);
    if (sampled && !isSampledBgTooDark(sampled)) setPanelBg(sampled);
  }, []);

  useEffect(() => {
    if (!videoFinished || !readyToReveal || isLifting) {
      return;
    }
    const timerId = setTimeout(() => {
      onLiftStart?.();
      setIsLifting(true);
    }, 400);
    return () => clearTimeout(timerId);
  }, [videoFinished, readyToReveal, isLifting, onLiftStart]);

  useEffect(() => {
    if (!isLifting) return;
    const id = window.setTimeout(() => {
      if (finishFiredRef.current) return;
      finishFiredRef.current = true;
      onFinish?.();
    }, 1100);
    return () => window.clearTimeout(id);
  }, [isLifting, onFinish]);

  const isTransformTransition = (propertyName: string) =>
    propertyName === "transform" || propertyName === "-webkit-transform";

  const handleLiftPanelTransitionEnd = (
    e: React.TransitionEvent<HTMLDivElement>,
  ) => {
    if (!isTransformTransition(e.propertyName)) return;
    if (e.target !== e.currentTarget) return;
    if (!isLifting || finishFiredRef.current) return;
    finishFiredRef.current = true;
    onFinish?.();
  };

  return (
    <main className="fixed inset-0 z-50 h-dvh w-full max-w-full overflow-hidden bg-white m-0 p-0">
      <div
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-in-out w-full m-0 p-0 ${isLifting ? "-translate-y-full" : "translate-y-0"
          }`}
        style={{ backgroundColor: panelBg }}
        onTransitionEnd={handleLiftPanelTransitionEnd}
      >
        <video
          key={introSource.stream}
          ref={videoRef}
          className={`absolute inset-0 z-0 h-full w-full min-h-0 object-cover transition-opacity duration-300 ${isVideoReady ? "opacity-100" : "opacity-0"
            }`}
          autoPlay
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => {
            setIsVideoReady(true);
            applyBackgroundFromVideo();
          }}
          onEnded={() => setVideoFinished(true)}
          onError={() => setVideoFinished(true)}
        />
      </div>
    </main>
  );
}

export default IntroductionVideo