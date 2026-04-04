import { useCallback, useEffect, useRef, useState } from "react";
import introVideoMobile from "../../../video/entrance-mobile.mov";
import introVideoDesktop from "../../../video/video-de-entrada.mp4";

/** Igual ao breakpoint `md` do Tailwind — não usar `<source media>` no vídeo (suporte fraco no desktop). */
const INTRO_VIDEO_MOBILE_MQ = "(max-width: 767px)";

function introSrcForViewport(): string {
  if (typeof window === "undefined") return introVideoDesktop;
  return window.matchMedia(INTRO_VIDEO_MOBILE_MQ).matches
    ? introVideoMobile
    : introVideoDesktop;
}

/** Fallback branco puro para matar o flash escuro inicial */
const INTRO_BG_FALLBACK = "#ffffff";

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
  const [introSrc, setIntroSrc] = useState<string>(() => introSrcForViewport());

  const finishFiredRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /** Escolhe mobile vs desktop de forma fiável (Chrome ignora `media` em `<source>` do vídeo). */
  useEffect(() => {
    const mq = window.matchMedia(INTRO_VIDEO_MOBILE_MQ);
    const sync = () => {
      setIntroSrc(mq.matches ? introVideoMobile : introVideoDesktop);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setIsVideoReady(false);
  }, [introSrc]);

  /** Autoplay silencioso após o URL estar definido */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    void video.play().catch((err) => {
      console.warn("Autoplay bloqueado pelo navegador:", err);
    });
  }, [introSrc]);

  const applyBackgroundFromVideo = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const sampled = sampleVideoBackground(el);
    if (sampled) setPanelBg(sampled);
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
          key={introSrc}
          ref={videoRef}
          className={`absolute inset-0 z-0 h-full w-full min-h-0 object-cover transition-opacity duration-300 ${isVideoReady ? "opacity-100" : "opacity-0"
            }`}
          src={introSrc}
          autoPlay
          muted
          playsInline
          preload="auto"
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