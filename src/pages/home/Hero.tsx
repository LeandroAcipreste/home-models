import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import gsap from "gsap";
import NavigateBar from "../../components/navigate-bar/navigate-bar";
import heroVideoFallback from "../../../video/Crystal_shards_assemble_202604030618.mp4";

const HERO_STREAM = "/streams/hero-desktop/index.m3u8";
const HERO_FINAL_FRAME = "/images/backgrounds/frame_00192.webp";

export type HeroProps = {
  onReady?: () => void;
  introLiftSignal?: number;
  onHeaderNavReveal?: () => void;
  /** Quando true, pula a animação de vídeo e exibe o frame final diretamente. */
  skipIntro?: boolean;
};

function Hero({
  onReady,
  introLiftSignal = 0,
  onHeaderNavReveal,
  skipIntro = false,
}: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onHeaderNavRevealRef = useRef(onHeaderNavReveal);
  onHeaderNavRevealRef.current = onHeaderNavReveal;

  const lastLiftSignalRef = useRef(0);
  const navRevealedRef = useRef(false);
  const hlsRef = useRef<Hls | null>(null);

  const [videoPlaying, setVideoPlaying] = useState(false);

  /** Anima as entradas dos itens de nav e sinaliza o contexto pai. */
  const revealNav = useCallback(() => {
    if (navRevealedRef.current) return;
    navRevealedRef.current = true;
    onHeaderNavRevealRef.current?.();

    const navRoot = containerRef.current;
    const navItems = navRoot?.querySelectorAll<Element>(".nav-reveal-item");
    if (!navItems?.length) return;

    navItems.forEach((el) => el.classList.remove("opacity-0"));
    gsap.fromTo(
      navItems,
      { y: 32, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.6,
        ease: "power2.out",
        stagger: 0.28,
        delay: 0.4,
        clearProps: "all",
      },
    );
  }, []);

  /* ── Sinaliza a HomePage que a Hero está pronta (sem precisar baixar frames) ── */
  useEffect(() => {
    onReadyRef.current?.();
  }, []);

  /* ── Se saltou a intro, revela a nav imediatamente ── */
  useEffect(() => {
    if (!skipIntro) return;
    revealNav();
  }, [skipIntro, revealNav]);

  /* ── Configura HLS/MP4 enquanto o vídeo de abertura toca (preload silencioso) ── */
  useEffect(() => {
    if (skipIntro) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    let fallbackTimer: number | null = null;
    let usingFallback = false;

    const clearTimer = () => {
      if (fallbackTimer != null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const switchToFallback = () => {
      if (usingFallback) return;
      usingFallback = true;
      clearTimer();
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.src = heroVideoFallback;
      video.load();
    };

    fallbackTimer = window.setTimeout(() => switchToFallback(), 6000);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      clearTimer();
      video.src = HERO_STREAM;
      video.load();
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(HERO_STREAM);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => clearTimer());
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) switchToFallback();
      });
    } else {
      clearTimer();
      video.src = heroVideoFallback;
      video.load();
    }

    return () => {
      clearTimer();
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [skipIntro]);

  /* ── Quando o sinal de lift chega, dá play no vídeo da hero ── */
  useEffect(() => {
    if (skipIntro) return;
    if (introLiftSignal <= 0) return;
    if (introLiftSignal === lastLiftSignalRef.current) return;
    lastLiftSignalRef.current = introLiftSignal;

    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(console.warn);
  }, [introLiftSignal, skipIntro]);

  return (
    <main className="relative w-full min-w-0 overflow-x-clip bg-white text-zinc-900">
      <section className="relative w-full min-w-0 shrink-0 overflow-x-clip bg-white">
        <div
          ref={containerRef}
          className="sticky top-0 z-20 h-[50dvh] md:h-[70dvh] lg:h-dvh min-h-0 w-full min-w-0 p-0 m-0 overflow-hidden bg-white"
        >
          <NavigateBar />

          {/* Fundo branco para cobrir o flash antes do vídeo iniciar */}
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-white"
            aria-hidden
          />

          {skipIntro ? (
            /* Quando volta via botão home: exibe o frame final sem reproduzir o vídeo */
            <img
              src={HERO_FINAL_FRAME}
              alt=""
              fetchPriority="high"
              decoding="async"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full max-w-none object-cover"
              aria-hidden
            />
          ) : (
            /* Fluxo normal: vídeo HLS pré-carregado, play ao final da abertura */
            <video
              ref={videoRef}
              className={`pointer-events-none absolute inset-0 z-10 h-full w-full max-w-none object-cover transition-opacity duration-500 ${
                videoPlaying ? "opacity-100" : "opacity-0"
              }`}
              muted
              playsInline
              aria-hidden
              onPlay={() => setVideoPlaying(true)}
              onEnded={revealNav}
            />
          )}
        </div>
      </section>
    </main>
  );
}

export default Hero;
