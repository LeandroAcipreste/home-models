import { useRef } from "react";
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

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

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
 * Fluxo: (1) intro 0→N−1 ao abrir a hero (2) scroll N−1→0 ao rolar.
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

  // Cache para evitar Layout Thrashing no drawFrame
  const dimensionsRef = useRef({ w: 0, h: 0 });

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
          idx = 0;
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

        let { w, h } = dimensionsRef.current;
        // Fallback seguro caso o ResizeObserver ainda não tenha disparado no frame 0
        if (w <= 0 || h <= 0) {
          const rect = container.getBoundingClientRect();
          w = rect.width;
          h = rect.height;
          dimensionsRef.current = { w, h };
        }
        if (w <= 0 || h <= 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
            scrub: 4,
            invalidateOnRefresh: true,
          },
        });

        gsap.set(scrollStateRef.current, { frame: fc - 1 });

        scrollTimelineRef.current.to(
          scrollStateRef.current,
          {
            frame: 0,
            ease: "none",
            duration: 1,
            onUpdate: wrap(() => {
              drawFrame();
            }),
          },
          0,
        );

        const canvasEl = canvasRef.current;
        const fadeTargets = canvasEl ? [canvasEl] : [];
        if (fadeTargets.length) {
          scrollTimelineRef.current.to(
            fadeTargets,
            {
              opacity: 0,
              duration: 0.3,
              ease: "power2.inOut",
            },
            0.7,
          );
        }

        ScrollTrigger.refresh();
        const st = scrollTimelineRef.current.scrollTrigger;
        if (st) {
          scrollStateRef.current.frame = (1 - st.progress) * (fc - 1);
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
          introStateRef.current = { frame: Math.max(0, fc - 1) };
          constructionCompleteRef.current = true;
          scrollStateRef.current.frame = Math.max(0, fc - 1);
          const navRoot = containerRef.current;
          if (navRoot) {
            navRoot.querySelectorAll(".nav-reveal-item").forEach((el) => {
              el.classList.remove("opacity-0");
            });
          }
          setupScrollTimeline();
          drawFrame();
          return;
        }

        gsap.killTweensOf(introStateRef.current);

        introActiveRef.current = true;
        const lastIdx = fc - 1;
        gsap.set(introStateRef.current, { frame: 0 });
        drawFrame();

        const introOnUpdate = wrap(() => {
          drawFrame();
        });

        gsap.to(introStateRef.current, {
          frame: lastIdx,
          duration: CONSTRUCTION_DURATION_SEC,
          ease: "none",
          onUpdate: introOnUpdate,
          onComplete: wrap(() => {
            introActiveRef.current = false;
            introStateRef.current = { frame: lastIdx };
            constructionCompleteRef.current = true;
            scrollStateRef.current.frame = lastIdx;

            const navRoot = containerRef.current;
            const navItems = navRoot?.querySelectorAll(".nav-reveal-item");

            if (navItems?.length) {
              navItems.forEach((el) => {
                el.classList.remove("opacity-0");
              });

              gsap.fromTo(
                navItems,
                { y: 20, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.8,
                  ease: "power3.out",
                  stagger: 0.15,
                  clearProps: "all",
                },
              );
            }

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
        wrap((entries: ResizeObserverEntry[]) => {
          if (!entries.length) return;
          const { width, height } = entries[0].contentRect;
          // Atualiza o cache de dimensões ANTES de desenhar
          dimensionsRef.current = { w: width, h: height };
          ScrollTrigger.refresh();
          drawFrame();
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
    <main className="relative w-screen min-w-0 max-w-[100dvw] overflow-x-clip bg-white text-zinc-900">
      <section
        ref={sectionRef}
        className="relative h-[200vh] w-screen min-w-0 max-w-[100dvw] overflow-x-clip bg-white"
      >
        <div
          ref={containerRef}
          className="sticky top-0 h-[50dvh] md:h-[70dvh] lg:h-dvh w-screen min-w-0 max-w-[100dvw] p-0 m-0 overflow-hidden bg-white"
        >
          <NavigateBar />
          <img
            src={frameUrl(0)}
            alt=""
            width={1280}
            height={720}
            fetchPriority="high"
            decoding="async"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full max-w-none object-cover opacity-0"
            aria-hidden
          />

          {/* Fundo branco puro revelado ao final */}
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-white"
            aria-hidden
          />

          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 block h-full w-full min-w-0 max-w-none"
            aria-hidden
          />
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
