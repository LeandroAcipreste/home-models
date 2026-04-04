import { useCallback, useEffect, useRef, useState } from "react";
import introVideoMobile from "../../../video/entrance-mobile.mp4";
import introVideoDesktop from "../../../video/video-de-entrada.mp4";

/** Alinhado ao breakpoint `md` do Tailwind (768px): abaixo = mobile, a partir de tablet */
const INTRO_VIDEO_MOBILE_MQ = "(max-width: 767px)";

function getIntroVideoSrcForViewport(): string {
  if (typeof window === "undefined") return introVideoDesktop;
  return window.matchMedia(INTRO_VIDEO_MOBILE_MQ).matches
    ? introVideoMobile
    : introVideoDesktop;
}

/** Fallback se a amostragem do canvas falhar (CORS / tainted) */
const INTRO_BG_FALLBACK = "#ffffff";

type IntroductionVideoProps = {
  /** Chamado quando o painel terminou de subir e a intro pode desmontar */
  onFinish?: () => void;
  readyToReveal: boolean;
  /**
   * Chamado ~400ms antes do painel branco começar a subir (após flush do DOM) —
   * dispara a Fase 2 da Hero.
   */
  onLiftStart?: () => void;
};

/** Média dos cantos de um thumbnail do frame para aproximar a cor de fundo do vídeo */
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
  const [introSrc, setIntroSrc] = useState<string>(() =>
    getIntroVideoSrcForViewport(),
  );
  /** Evita chamar onFinish duas vezes (transitionend + fallback) */
  const finishFiredRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /** Mantém o ficheiro de vídeo alinhado ao viewport (mobile vs tablet/desktop) */
  useEffect(() => {
    const mq = window.matchMedia(INTRO_VIDEO_MOBILE_MQ);
    const sync = () => {
      setIntroSrc(mq.matches ? introVideoMobile : introVideoDesktop);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** Força o autoplay no mobile lidando com as restrições do Safari/Chrome */
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.defaultMuted = true;
      video.muted = true;
      video.play().catch((err) => {
        console.warn("Autoplay bloqueado pelo navegador:", err);
      });
    }
  }, [introSrc]);

  const applyBackgroundFromVideo = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const sampled = sampleVideoBackground(el);
    if (sampled) setPanelBg(sampled);
  }, []);

  /**
   * Quando vídeo acabou e a Hero está pronta: após um respiro para o DOM pintar o canvas,
   * avisa o pai e aplica a classe que inicia o translateY (transition CSS 1000ms).
   */
  useEffect(() => {
    if (!videoFinished || !readyToReveal || isLifting) {
      return;
    }
    // 400ms garante que o layout do Canvas na Hero esteja 100% renderizado e pronto pro GSAP
    const timerId = setTimeout(() => {
      onLiftStart?.();
      setIsLifting(true);
    }, 400);
    return () => clearTimeout(timerId);
  }, [videoFinished, readyToReveal, isLifting, onLiftStart]);

  /** Fallback se `transitionend` não disparar (reduced-motion / edge cases) */
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
    <main className="fixed inset-0 z-50 h-dvh w-full max-w-full overflow-hidden bg-transparent m-0 p-0">
      <div
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-in-out w-full m-0 p-0 ${
          isLifting ? "-translate-y-full" : "translate-y-0"
        }`}
        style={{ backgroundColor: panelBg }}
        onTransitionEnd={handleLiftPanelTransitionEnd}
      >
        <video
          key={introSrc}
          ref={videoRef}
          className="absolute inset-0 z-0 h-full w-full min-h-0 object-cover"
          autoPlay
          muted
          defaultMuted
          playsInline
          onLoadedMetadata={() => {
            requestAnimationFrame(() => applyBackgroundFromVideo());
          }}
          onLoadedData={applyBackgroundFromVideo}
          onEnded={() => setVideoFinished(true)}
          onError={() => setVideoFinished(true)}
        >
          <source src={introSrc} type="video/mp4" />
        </video>
      </div>
    </main>
  );
}

export default IntroductionVideo;
