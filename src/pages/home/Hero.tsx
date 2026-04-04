import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import NavigateBar from "../../components/navigate-bar/navigate-bar";
import SecondFoldCursor from "./SecondFoldCursor";

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

    // A mágica: Força a placa de vídeo a mastigar os pixels antes de liberar o frame
    img.onload = () => {
      img
        .decode()
        .then(() => resolve(img))
        .catch(() => resolve(img)); // Em caso de erro obscuro de decode, resolve silenciosamente para não quebrar a sequência
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

/** Duração da animação inicial 0→N−1 (após o lift do vídeo); mais alto = construção mais lenta e legível */
const CONSTRUCTION_DURATION_SEC = 5.5;

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
      let heroScrollTl: ReturnType<typeof gsap.timeline> | null = null;

      /**
       * Timeline de scroll (desconstrução N−1 → 0 + fade do canvas). Só faz sentido depois de
       * `lockFrameToLast()` fixar `scrollStateRef` no último frame — por isso é chamada de lá.
       */
      const setupHeroScrollTimeline = wrap(() => {
        const fc = heroFrameCountRef.current;
        if (!fc || cancelled) return;

        heroScrollTl?.kill();
        heroScrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            // Inércia / smooth scrub (segundos de lag em relação ao scroll)
            scrub: 2.5,
          },
        });

        heroScrollTl.to(
          scrollStateRef.current,
          {
            frame: 0,
            ease: "none",
            onUpdate: () => {
              if (!introActiveRef.current) {
                drawFrame();
              }
            },
          },
          0,
        );

        heroScrollTl.to(
          canvasEl,
          {
            opacity: 0,
            ease: "power2.inOut",
            duration: 0.2,
          },
          0.8,
        );
      });

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

      /** Após a animação inicial: último frame fixo até sair da hero (sem scrub por scroll). */
      const lockFrameToLast = wrap(() => {
        const fc = heroFrameCountRef.current;
        if (!fc) return;
        gsap.set(scrollStateRef.current, { frame: fc - 1 });
        const canvasEl = canvasRef.current;
        if (canvasEl) gsap.set(canvasEl, { opacity: 1 });
        drawFrame();
        // --- RESTAURAÇÃO DO SCROLL COM ALTURA ENXUTA (amarrada ao fim da section) ---
        setupHeroScrollTimeline();
        ScrollTrigger.refresh();
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

      const refreshHandler = wrap(() => {
        if (heroFrameCountRef.current <= 0) return;
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
              lockFrameToLast();
            }

            drawFrame();
            onReady?.();

            if (pendingIntroConstructionRef.current) {
              runIntroConstruction();
            }
            // Scroll timeline: criada em lockFrameToLast() quando o último frame está fixo
            // (após intro ou prefersReduced), para o scrub partir de N−1 → 0.
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

          // 1. Otimização: Ignorar mudanças minúsculas causadas pela barra de endereço do mobile
          const wDiff = Math.abs(dimensionsRef.current.w - width);
          const hDiff = Math.abs(dimensionsRef.current.h - height);

          // Só recalcula se a largura mudar (ex: girar o celular) ou se a altura mudar drasticamente
          if (wDiff < 2 && hDiff < 60) return;

          // Atualiza o cache
          dimensionsRef.current = { w: width, h: height };

          // 2. Removemos o ScrollTrigger.refresh() que travava a thread do scroll
          // 3. Colocamos o drawFrame no requestAnimationFrame para não bloquear a UI
          requestAnimationFrame(() => {
            drawFrame();
          });
        }),
      );
      ro.observe(container);

      return () => {
        cancelled = true;
        heroScrollTl?.kill();
        heroScrollTl = null;
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
    <main className="relative w-full min-w-0 overflow-x-clip bg-white text-zinc-900">
      {/* Altura da secção = altura do frame (canvas); evita faixa branca vazia abaixo do vídeo */}
      <section
        ref={sectionRef}
        className="relative mb-12 h-[50dvh] md:h-[70dvh] lg:h-dvh w-full min-w-0 shrink-0 overflow-x-clip bg-white"
      >
        <div
          ref={containerRef}
          className="sticky top-0 h-full min-h-0 w-full min-w-0 p-0 m-0 overflow-hidden bg-white"
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

      <SecondFoldCursor />
    </main>
  );
}

export default Hero;
