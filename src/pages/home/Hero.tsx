import { useRef } from "react";
import { Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import NavigateBar from "../../components/navigate-bar/navigate-bar";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type HeroManifest = {
  frameCount: number;
};

export type HeroProps = {
  onReady?: () => void;
  introLiftSignal?: number;
};

function frameUrl(index: number) {
  const n = index + 1;
  return `/images/video/frame_${String(n).padStart(5, "0")}.webp`;
}

function createPlaceholderImage(): HTMLImageElement {
  const img = new Image();
  img.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  return img;
}

function loadSingleFrame(index: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Falha ao carregar ${frameUrl(index)}`));
    img.src = frameUrl(index);
  });
}

async function preloadFramesResilient(count: number): Promise<HTMLImageElement[]> {
  const settled = await Promise.allSettled(
    Array.from({ length: count }, (_, i) => loadSingleFrame(i)),
  );

  const images: HTMLImageElement[] = [];
  let lastGood: HTMLImageElement | null = null;
  const placeholder = createPlaceholderImage();

  for (let i = 0; i < count; i++) {
    const r = settled[i];
    if (r.status === "fulfilled") {
      const img = r.value;
      if (img.naturalWidth > 0) {
        lastGood = img;
        images.push(img);
        continue;
      }
    }
    if (lastGood) images.push(lastGood);
    else images.push(placeholder);
  }

  return images;
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

const CONSTRUCTION_DURATION_SEC = 3;

/**
 * Fluxo: (1) último frame até lift (2) gsap.to N−1→0 (3) ScrollTrigger no onComplete.
 * Estado mutável de desenho em refs para evitar stale closure com boot async / Strict Mode.
 */
function Hero({ onReady, introLiftSignal = 0 }: HeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /** Fonte única da verdade para drawFrame / tweens (sempre leitura atual) */
  const heroImagesRef = useRef<HTMLImageElement[]>([]);
  const heroFrameCountRef = useRef(0);
  const scrollTimelineRef = useRef<gsap.core.Timeline | undefined>(undefined);
  const scrollStateRef = useRef({ frame: 0 });

  const prefersReducedRef = useRef(false);
  const introStateRef = useRef({ frame: 0 });
  const introActiveRef = useRef(false);
  const pendingIntroConstructionRef = useRef(false);
  const constructionCompleteRef = useRef(false);

  const runIntroConstructionRef = useRef<(() => void) | null>(null);
  const lastDispatchedLiftRef = useRef(0);

  useGSAP(
    (_ctx, contextSafe) => {
      if (!contextSafe) return;
      const wrap = contextSafe;

      // Forçado para false: A animação TEM que rodar 100% das vezes
      prefersReducedRef.current = false;

      const section = sectionRef.current;
      const container = containerRef.current;
      const canvasEl = canvasRef.current;
      if (!section || !container || !canvasEl) return;

      let cancelled = false;

      /**
       * drawFrame sempre via wrap: leitura fresca de refs + DOM no momento da chamada.
       */
      const drawFrame = wrap(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const images = heroImagesRef.current;
        const frameCount = heroFrameCountRef.current;
        if (!images.length || !frameCount) return;

        let idx: number;
        if (introActiveRef.current) {
          idx = Math.max(
            0,
            Math.min(
              images.length - 1,
              Math.round(introStateRef.current.frame),
            ),
          );
        } else if (
          !constructionCompleteRef.current &&
          !prefersReducedRef.current
        ) {
          idx = images.length - 1;
        } else {
          idx = Math.max(
            0,
            Math.min(
              images.length - 1,
              Math.round(scrollStateRef.current.frame),
            ),
          );
        }

        const img = images[idx];
        if (!img.complete) return;

        const rect = container.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w <= 0 || h <= 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

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
      });

      const setupScrollTimeline = wrap(() => {
        const fc = heroFrameCountRef.current;
        if (scrollTimelineRef.current || !fc) return;

        scrollTimelineRef.current = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 2.75,
            invalidateOnRefresh: true,
          },
        });

        scrollTimelineRef.current.to(
          scrollStateRef.current,
          {
            frame: fc - 1,
            ease: "none",
            duration: 1,
            onUpdate: wrap(() => {
              drawFrame();
            }),
          },
          0,
        );

        ScrollTrigger.refresh();
        const st = scrollTimelineRef.current.scrollTrigger;
        if (st) {
          scrollStateRef.current.frame = st.progress * (fc - 1);
        }
        drawFrame();
      });

      const runIntroConstruction = wrap(() => {
        if (cancelled) return;

        const fc = heroFrameCountRef.current;
        if (!fc) {
          pendingIntroConstructionRef.current = true;
          return;
        }

        pendingIntroConstructionRef.current = false;

        if (prefersReducedRef.current) {
          introActiveRef.current = false;
          introStateRef.current = { frame: 0 };
          constructionCompleteRef.current = true;
          scrollStateRef.current.frame = 0;
          setupScrollTimeline();
          drawFrame();
          return;
        }

        gsap.killTweensOf(introStateRef.current);

        introActiveRef.current = true;
        const lastIdx = fc - 1;
        gsap.set(introStateRef.current, { frame: lastIdx });
        drawFrame();

        const introOnUpdate = wrap(() => {
          drawFrame();
        });

        gsap.to(introStateRef.current, {
          frame: 0,
          duration: CONSTRUCTION_DURATION_SEC,
          ease: "none",
          onUpdate: introOnUpdate,
          onComplete: wrap(() => {
            introActiveRef.current = false;
            introStateRef.current = { frame: 0 };
            constructionCompleteRef.current = true;
            setupScrollTimeline();
            drawFrame();
          }),
        });
      });

      runIntroConstructionRef.current = runIntroConstruction;

      const refreshHandler = wrap(() => {
        if (!scrollTimelineRef.current?.scrollTrigger || heroFrameCountRef.current <= 0)
          return;
        drawFrame();
      });

      const boot = async () => {
        try {
          const res = await fetch("/images/video/manifest.json");
          if (!res.ok) return;
          const manifest = (await res.json()) as HeroManifest;
          const manifestCount = manifest.frameCount;
          if (!manifestCount || cancelled) return;

          let loadedImages: HTMLImageElement[];
          try {
            loadedImages = await preloadFramesResilient(manifestCount);
          } catch {
            return;
          }

          wrap(() => {
            if (cancelled) return;
            heroImagesRef.current = loadedImages;
            heroFrameCountRef.current = manifestCount;

            if (prefersReducedRef.current) {
              constructionCompleteRef.current = true;
              setupScrollTimeline();
            }

            drawFrame();
            onReady?.();

            if (pendingIntroConstructionRef.current) {
              runIntroConstruction();
            }
          })();

          if (cancelled) return;
          ScrollTrigger.addEventListener("refresh", refreshHandler);
        } catch {
          /* manifest / rede */
        }
      };

      void boot();

      const ro = new ResizeObserver(
        wrap(() => {
          ScrollTrigger.refresh();
        }),
      );
      ro.observe(container);

      return () => {
        cancelled = true;
        scrollTimelineRef.current?.scrollTrigger?.kill();
        scrollTimelineRef.current?.kill();
        scrollTimelineRef.current = undefined;
        ro.disconnect();
        ScrollTrigger.removeEventListener("refresh", refreshHandler);
        runIntroConstructionRef.current = null;
      };
    },
    { scope: containerRef, dependencies: [onReady] },
  );

  useGSAP(
    () => {
      if (introLiftSignal <= 0) return;
      if (introLiftSignal === lastDispatchedLiftRef.current) return;

      lastDispatchedLiftRef.current = introLiftSignal;

      pendingIntroConstructionRef.current = true;
      runIntroConstructionRef.current?.();
    },
    { dependencies: [introLiftSignal] },
  );

  return (
    <main className="bg-zinc-950 text-zinc-100">
      <section ref={sectionRef} className="relative h-[420vh]">
        <div
          ref={containerRef}
          className="sticky top-0 h-screen overflow-hidden bg-zinc-950"
        >
          <NavigateBar />
          <img
            src={frameUrl(0)}
            alt=""
            width={1280}
            height={720}
            fetchPriority="high"
            decoding="async"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-0"
            aria-hidden
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 block h-full w-full"
            aria-hidden
          />

          <div
            className="pointer-events-none absolute inset-0 z-20 bg-linear-to-b from-black/60 via-black/35 to-black/50"
            style={{ opacity: 0.55 }}
          />

          <div className="absolute inset-0 z-30 flex items-center justify-center px-6">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
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
