import { useLayoutEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type HeroManifest = {
  frameCount: number;
};

type HeroProps = {
  onReady?: () => void;
};

function frameUrl(index: number) {
  const n = index + 1;
  return `/images/video/frame_${String(n).padStart(5, "0")}.webp`;
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number,
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;

  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function preloadFrames(count: number) {
  return Promise.all(
    Array.from({ length: count }, (_, i) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error(`Falha ao carregar ${frameUrl(i)}`));
        img.src = frameUrl(i);
      });
    }),
  );
}

function Hero({ onReady }: HeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const content = contentRef.current;

    if (!section || !container || !canvas || !overlay || !content) return;

    let cancelled = false;
    let timeline: gsap.core.Timeline | undefined;
    const state = { frame: 0 };
    let frameCount = 0;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let images: HTMLImageElement[] = [];

    const drawFrame = (frameIndex: number) => {
      if (!images.length) return;
      const idx = Math.max(
        0,
        Math.min(images.length - 1, Math.round(frameIndex)),
      );
      const img = images[idx];
      if (!img.complete) return;

      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.floor(w * dpr);
      const targetH = Math.floor(h * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawImageCover(ctx, img, w, h);
    };

    const refreshHandler = () => {
      if (!timeline?.scrollTrigger || frameCount <= 0) return;
      const p = timeline.scrollTrigger.progress;
      state.frame = p * (frameCount - 1);
      drawFrame(state.frame);
    };

    const boot = async () => {
      const res = await fetch("/images/video/manifest.json");
      if (!res.ok) return;
      const manifest = (await res.json()) as HeroManifest;
      frameCount = manifest.frameCount;
      if (!frameCount || cancelled) return;

      images = await preloadFrames(frameCount);
      if (cancelled) return;

      drawFrame(0);
      onReady?.();
      if (cancelled) return;

      timeline?.scrollTrigger?.kill();
      timeline?.kill();

      timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 2.75,
          invalidateOnRefresh: true,
        },
      });

      timeline.to(
        state,
        {
          frame: frameCount - 1,
          ease: "none",
          duration: 1,
          onUpdate: () => {
            drawFrame(state.frame);
          },
        },
        0,
      );

      timeline.fromTo(
        overlay,
        { opacity: 0.55 },
        { opacity: 0.25, ease: "none", duration: 1 },
        0,
      );

      timeline.fromTo(
        content,
        { yPercent: 10, opacity: 0.75, scale: 0.98 },
        { yPercent: -8, opacity: 1, scale: 1, ease: "none", duration: 1 },
        0,
      );

      if (cancelled) {
        timeline?.scrollTrigger?.kill();
        timeline?.kill();
        return;
      }
      ScrollTrigger.addEventListener("refresh", refreshHandler);
    };

    void boot();

    const ro = new ResizeObserver(() => {
      ScrollTrigger.refresh();
    });
    ro.observe(container);

    return () => {
      cancelled = true;
      ro.disconnect();
      ScrollTrigger.removeEventListener("refresh", refreshHandler);
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
    };
  }, [onReady]);

  return (
    <main className="bg-zinc-950 text-zinc-100">
      <section ref={sectionRef} className="relative h-[420vh]">
        <div
          ref={containerRef}
          className="sticky top-0 h-screen overflow-hidden bg-zinc-950"
        >
          <img
            src={frameUrl(0)}
            alt=""
            width={1280}
            height={720}
            fetchPriority="high"
            decoding="async"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
            aria-hidden
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 block h-full w-full"
            aria-hidden
          />

          <div
            ref={overlayRef}
            className="pointer-events-none absolute inset-0 z-20 bg-linear-to-b from-black/60 via-black/35 to-black/50"
          />

          <div className="absolute inset-0 z-30 flex items-center justify-center px-6">
            <div
              ref={contentRef}
              className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-4 py-2 text-sm backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                Home Model
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Conteudo visual guiado pelo scroll
              </h1>
              <p className="max-w-xl text-zinc-200">
                Role a pagina para controlar a animacao do background da hero.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 px-6 py-20 text-center text-zinc-200">
        <p className="mx-auto max-w-3xl">
          Proxima secao apos a hero para continuar a narrativa do site.
        </p>
      </section>
    </main>
  );
}

export default Hero;
