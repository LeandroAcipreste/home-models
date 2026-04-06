import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import NavigateBar from "../../components/navigate-bar/navigate-bar";

gsap.registerPlugin(useGSAP);

type HeroManifest = {
  frameCount: number;
};

export type HeroProps = {
  onReady?: () => void;
  introLiftSignal?: number;
  /** Chamado no mesmo instante em que os botões do header entram (após a construção ou fallback) */
  onHeaderNavReveal?: () => void;
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

    img.onload = () => {
      img
        .decode()
        .then(() => resolve(img))
        .catch(() => resolve(img));
    };

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

const CONSTRUCTION_DURATION_SEC = 5.5;

/** Fluxo: animação de construção 0→N−1; depois o último frame permanece (sem scrub no scroll). */
function Hero({ onReady, introLiftSignal = 0, onHeaderNavReveal }: HeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onHeaderNavRevealRef = useRef(onHeaderNavReveal);
  onHeaderNavRevealRef.current = onHeaderNavReveal;

  const heroImagesRef = useRef<HTMLImageElement[]>([]);
  const heroFrameCountRef = useRef(0);
  const scrollStateRef = useRef({ frame: 0 });

  const prefersReducedRef = useRef(false);
  const introStateRef = useRef({ frame: 0 });
  const introActiveRef = useRef(false);
  const pendingIntroConstructionRef = useRef(false);
  const constructionCompleteRef = useRef(false);

  const runIntroConstructionRef = useRef<(() => void) | null>(null);
  const lastDispatchedLiftRef = useRef(0);

  const dimensionsRef = useRef({ w: 0, h: 0 });

  useGSAP(
    (_ctx, contextSafe) => {
      // CORREÇÃO 1: Fallback seguro caso o contextSafe venha undefined da lib do GSAP
      const wrap = contextSafe || ((fn: Function) => fn as any);

      prefersReducedRef.current = false;

      const section = sectionRef.current;
      const container = containerRef.current;
      const canvasEl = canvasRef.current;
      if (!section || !container || !canvasEl) return;

      let cancelled = false;
      let heroReadyNotified = false;
      let lastCanvasDraw: { idx: number; tw: number; th: number } | null = null;

      // CORREÇÃO 2: Removido o wrap() daqui! É uma função React pura, o GSAP não deve interceptar.
      const notifyHeroReady = () => {
        if (cancelled || heroReadyNotified) return;
        heroReadyNotified = true;
        console.log("🟢 [Hero] Sinal de READY enviado para a HomePage!");
        onReady?.();
      };

      const drawFrame = wrap(() => {
        const containerEl = containerRef.current;
        const canvas = canvasRef.current;
        if (!containerEl || !canvas) return;

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
        if (w <= 0 || h <= 0) {
          const rect = containerEl.getBoundingClientRect();
          w = rect.width;
          h = rect.height;
          dimensionsRef.current = { w, h };
        }
        if (w <= 0 || h <= 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const targetW = Math.floor(w * dpr);
        const targetH = Math.floor(h * dpr);

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
          canvas.style.width = `${w}px`;
          canvas.style.height = `${h}px`;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        if (
          lastCanvasDraw &&
          lastCanvasDraw.idx === idx &&
          lastCanvasDraw.tw === targetW &&
          lastCanvasDraw.th === targetH
        ) {
          return;
        }

        drawImageCover(ctx, img, w, h);
        lastCanvasDraw = { idx, tw: targetW, th: targetH };
      });

      const lockFrameToLast = wrap(() => {
        const fc = heroFrameCountRef.current;
        if (!fc) return;
        gsap.set(scrollStateRef.current, { frame: fc - 1 });
        const c = canvasRef.current;
        if (c) gsap.set(c, { opacity: 1 });
        drawFrame();
      });

      const runIntroConstruction = wrap(() => {
        if (cancelled) return;

        const fc = heroFrameCountRef.current;
        if (!fc) {
          pendingIntroConstructionRef.current = true;
          onHeaderNavRevealRef.current?.();
          return;
        }

        pendingIntroConstructionRef.current = false;

        if (prefersReducedRef.current) {
          introActiveRef.current = false;
          introStateRef.current = { frame: Math.max(0, fc - 1) };
          constructionCompleteRef.current = true;
          scrollStateRef.current.frame = Math.max(0, fc - 1);
          onHeaderNavRevealRef.current?.();
          const navRoot = containerRef.current;
          if (navRoot) {
            navRoot.querySelectorAll(".nav-reveal-item").forEach((el) => {
              el.classList.remove("opacity-0");
            });
          }
          lockFrameToLast();
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

            onHeaderNavRevealRef.current?.();

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

            lockFrameToLast();
          }),
        });
      });

      runIntroConstructionRef.current = runIntroConstruction;

      const boot = async () => {
        try {
          console.log("⏳ [Hero] Iniciando fetch do manifest.json...");
          const res = await fetch("/images/video/manifest.json");

          if (!res.ok) {
            console.warn("⚠️ [Hero] Manifest.json retornou erro:", res.status);
            notifyHeroReady();
            return;
          }

          const manifest = (await res.json()) as HeroManifest;
          const manifestCount = manifest.frameCount;

          if (cancelled) return;
          if (!manifestCount) {
            console.warn("⚠️ [Hero] Manifest sem frameCount.");
            notifyHeroReady();
            return;
          }

          console.log("✅ [Hero] Manifest carregado, avisando a Home para liberar o vídeo...");
          // Libera a intro imediatamente antes do preload longo dos frames
          notifyHeroReady();

          let loadedImages: HTMLImageElement[];
          try {
            loadedImages = await preloadFramesResilient(manifestCount);
          } catch (err) {
            console.error("❌ [Hero] Erro crítico ao carregar frames:", err);
            return;
          }

          wrap(() => {
            if (cancelled) return;
            heroImagesRef.current = loadedImages;
            heroFrameCountRef.current = manifestCount;

            if (prefersReducedRef.current) {
              constructionCompleteRef.current = true;
              lockFrameToLast();
            }

            drawFrame();

            if (pendingIntroConstructionRef.current) {
              runIntroConstruction();
            }
          })();

        } catch (err) {
          console.error("❌ [Hero] Falha geral no boot:", err);
          notifyHeroReady();
        }
      };

      void boot();

      const ro = new ResizeObserver(
        wrap((entries: ResizeObserverEntry[]) => {
          if (!entries.length) return;
          const { width, height } = entries[0].contentRect;

          const wDiff = Math.abs(dimensionsRef.current.w - width);
          const hDiff = Math.abs(dimensionsRef.current.h - height);

          if (wDiff < 2 && hDiff < 60) return;

          dimensionsRef.current = { w: width, h: height };

          requestAnimationFrame(() => {
            drawFrame();
          });
        }),
      );
      ro.observe(container);

      return () => {
        cancelled = true;
        ro.disconnect();
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
    <main className="relative w-full min-w-0 overflow-x-clip bg-white text-zinc-900">
      <section
        ref={sectionRef}
        className="relative w-full min-w-0 shrink-0 overflow-x-clip bg-white"
      >
        <div
          ref={containerRef}
          className="sticky top-0 z-20 h-[50dvh] md:h-[70dvh] lg:h-dvh min-h-0 w-full min-w-0 p-0 m-0 overflow-hidden bg-white"
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
    </main>
  );
}

export default Hero;