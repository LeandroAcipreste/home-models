import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/** Pasta pública — URLs síncronas (sem fetch). Manter alinhado a `public/.../manifest.json` ao adicionar/remover ficheiros. */
const EFEITO_TRAIL_BASE = "/images/models/img-efeito-backgroung";

const TRAIL_FILES = [
  "[Iasmin Reis] for Ralph Lauren Collection Spring 2026 Runway Show in New York.jpg",
  "13.jpg",
  "8V6A1618.jpg",
  "charth_ss26_lb_041.JPG",
  "dolce-gabbana-fw26.PNG",
  "etro-fall-winter-26.PNG",
  "iasmin-reis-ralph-lauren-fall26.png",
  "imageye___-_imgi_4_FIO00695.PNG",
  "IMG_6458.JPG",
  "IMG_7644.JPG",
  "IMG_7743.JPG",
  "IMG_9604.PNG",
  "imgi_11_FIO00370.PNG",
  "imgi_3_00023-carolina-herrera-fall-2026-ready-to-wear-credit-gorunway.jpg",
  "imgi_4_00038-alaia-spring-2026-ready-to-wear-credit-brand.jpg",
  "imgi_4_ISI00346.PNG",
  "roberto-cavalli-fw26.PNG",
] as const;

const trailUrls: string[] = TRAIL_FILES.map(
  (f) => `${EFEITO_TRAIL_BASE}/${encodeURIComponent(f)}`,
);

/** Fundo decorativo da segunda dobra (`public/images/models/backgrounds/`) */
const SECOND_FOLD_BG = `/images/models/backgrounds/${encodeURIComponent(
  "background segunda dobra.png",
)}`;

/** Parâmetros alinhados ao script do template ovo-lumen (Mouse Trail) */
const D = 90;
const IN = 0.2;
const MOVE = 0.45;
const OUT = 0.2;
const SCALE = 0.6;

/**
 * Segunda dobra: mouse trail (Observer + .hero + .image_wrap).
 * Imagens: URLs estáticas em `public/images/models/img-efeito-backgroung`.
 */
function SecondFoldCursor() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useGSAP(
    () => {
      const hero = sectionRef.current;
      const wrap = wrapRef.current;
      const titleEl = titleRef.current;
      if (!hero || !wrap) return;

      const items = gsap.utils.toArray<HTMLElement>(
        wrap.querySelectorAll(".content_img-wrap"),
      );
      if (!items.length) return;

      gsap.set(items, { position: "absolute", willChange: "transform,opacity" });

      let rect = wrap.getBoundingClientRect();
      let first = true;
      let index = -1;
      let z = 1;
      let last = { x: 0, y: 0 };
      let curr = { x: 0, y: 0 };

      // 1. Cache das dimensões para evitar 'Forced Synchronous Layout' a cada movimento
      const itemW = items[0]?.offsetWidth || 220;
      const itemH = items[0]?.offsetHeight || 280;

      // 2. Atualiza a posição apenas quando a tela rola ou redimensiona (não a 60fps)
      const updateRect = () => {
        rect = wrap.getBoundingClientRect();
      };
      window.addEventListener("scroll", updateRect, { passive: true });
      window.addEventListener("resize", updateRect, { passive: true });

      const toLocal = (x: number, y: number) => ({
        x: x - rect.left,
        y: y - rect.top,
      });

      function spawn(fromX: number, fromY: number, toX: number, toY: number) {
        index = (index + 1) % items.length;
        const el = items[index];
        const img =
          (el.querySelector(".content_img") as HTMLElement | null) ?? el;

        gsap.set(el, { left: 0, top: 0, zIndex: ++z });
        gsap.set(img, { opacity: 1, scale: 1 });
        gsap.killTweensOf([el, img]);

        // Usando as variáveis cacheadas (sem ler DOM)
        const fx = fromX - itemW / 2;
        const fy = fromY - itemH / 2;
        const tx = toX - itemW / 2;
        const ty = toY - itemH / 2;

        const tl = gsap.timeline();
        tl.fromTo(el, { opacity: 0, x: fx, y: fy }, { opacity: 1, duration: IN });
        tl.to(el, { x: tx, y: ty, duration: MOVE }, "<");
        tl.to(img, { opacity: 0, scale: SCALE, duration: OUT });
      }

      /** Coordenadas viewport do Observer (seguras para touch/mouse) */
      type ObserverSelf = { x?: number; y?: number };

      // 1. Funções isoladas para lidar com ambos os cenários (Mouse e Dedo)
      const handleStart = (self: ObserverSelf) => {
        first = true;
        rect = wrap.getBoundingClientRect();
        if (
          self.x !== undefined &&
          self.y !== undefined &&
          Number.isFinite(self.x) &&
          Number.isFinite(self.y)
        ) {
          last = curr = toLocal(self.x, self.y);
        }
      };

      const handleMove = (self: ObserverSelf) => {
        if (
          self.x === undefined ||
          self.y === undefined ||
          !Number.isFinite(self.x) ||
          !Number.isFinite(self.y)
        ) {
          return;
        }
        curr = toLocal(self.x, self.y);

        if (first) {
          first = false;
          spawn(curr.x, curr.y, curr.x, curr.y);
          last = { x: curr.x, y: curr.y };
          return;
        }

        const dx = curr.x - last.x;
        const dy = curr.y - last.y;
        if (dx * dx + dy * dy >= D * D) {
          spawn(last.x, last.y, curr.x, curr.y);
          last = { x: curr.x, y: curr.y };
        }
      };

      const handleEnd = () => {
        first = false;
      };

      // 2. Instância do Observer com eventos mapeados corretamente
      const trailObserver = ScrollTrigger.observe({
        target: hero,
        type: "pointer,touch",
        // CRUCIAL: Impede que o GSAP trave o scroll vertical nativo da página no mobile
        preventDefault: false,

        // Eventos de Mouse (Desktop)
        onHover: handleStart,
        onMove: handleMove,
        onHoverEnd: handleEnd,

        // Eventos de Touch (Celular)
        onPress: handleStart,
        onDrag: handleMove,
        onRelease: handleEnd,
      });

      let titleTween: gsap.core.Tween | null = null;
      if (titleEl) {
        // O Tailwind já seta opacity-0 e translate-y-12 inicialmente, o GSAP leva para o estado natural
        titleTween = gsap.to(titleEl, {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            id: "second-fold-title",
            trigger: hero,
            // A animação do título dispara assim que o topo da segunda dobra passar do meio da tela
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        });
      }

      return () => {
        window.removeEventListener("scroll", updateRect);
        window.removeEventListener("resize", updateRect);
        trailObserver.kill();
        titleTween?.scrollTrigger?.kill();
        titleTween?.kill();
      };
    },
    { scope: sectionRef, dependencies: [] },
  );

  return (
    <section
      ref={sectionRef}
      className="hero second-fold-hero relative isolate z-0 flex min-h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-white"
      aria-label="Segunda dobra"
    >
      {/* Fundo: sempre atrás; isolate na section evita o PNG “comer” o stacking dos filhos */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${SECOND_FOLD_BG}")` }}
        aria-hidden
      />
      {/* Conteúdo interativo acima do fundo (trail + título) */}
      <div className="relative z-10 flex min-h-[100dvh] w-full min-w-0 flex-1 flex-col">
        <div
          ref={wrapRef}
          className="image_wrap pointer-events-auto absolute inset-0 z-[1] flex min-h-full items-start justify-start overflow-hidden"
        >
          {trailUrls.map((src) => (
            <div
              key={src}
              className="content_img-wrap absolute bottom-auto right-auto aspect-[220/280] w-[min(220px,85vw)] shrink-0 opacity-0"
            >
              <img
                src={src}
                alt=""
                className="content_img absolute inset-0 h-full w-full object-contain object-center"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable={false}
              />
            </div>
          ))}
        </div>

        <div className="relative z-[20] flex w-full shrink-0 justify-center px-4 pb-4 pt-6 sm:px-6 pointer-events-none">
          <h2
            ref={titleRef}
            className="second-fold-home-title opacity-0 translate-y-12"
          >
            <span className="second-fold-home-title-line text-[clamp(1.25rem,5.5vw,3rem)] sm:text-[clamp(1.5rem,6vw,3.5rem)]">
              Somos a
            </span>
            <span className="second-fold-home-title-line mt-1 text-[clamp(1.375rem,6.5vw,3.5rem)] sm:mt-1.5 sm:text-[clamp(1.625rem,7vw,4rem)]">
              Home Model
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
}

export default SecondFoldCursor;
