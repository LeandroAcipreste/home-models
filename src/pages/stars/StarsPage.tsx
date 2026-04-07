import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./stars.css";

const N = 7;
const EFEITO_BASE = `${import.meta.env.BASE_URL}images/models/img-efeito-backgroung`;
const FAN_CARD_W = 601;
const FAN_CARD_H = 416;

function efeitoSrc(filename: string): string {
  return `${EFEITO_BASE}/${encodeURIComponent(filename)}`;
}

const FAN_STACK_DESKTOP: { transform: string; file: string; alt: string }[] = [
  { transform: "translate3d(-72%, 0, -800px)", file: "13.jpg", alt: "Campanha moda — fundo esquerdo" },
  { transform: "translate3d(-45%, 0, -550px)", file: "IMG_9604.PNG", alt: "Editorial — cartão" },
  { transform: "translate3d(-20%, 0, -260px)", file: "charth_ss26_lb_041.JPG", alt: "Campanha moda — cartão" },
  { transform: "translate3d(0%, 0, 0px)", file: "imgi_4_00038-alaia-spring-2026-ready-to-wear-credit-brand.jpg", alt: "Alaia — destaque central" },
  { transform: "translate3d(20%, 0, -260px)", file: "imgi_3_00023-carolina-herrera-fall-2026-ready-to-wear-credit-gorunway.jpg", alt: "Carolina Herrera — cartão" },
  { transform: "translate3d(45%, 0, -550px)", file: "imgi_11_FIO00370.PNG", alt: "Editorial — cartão" },
  { transform: "translate3d(72%, 0, -800px)", file: "imgi_4_ISI00346.PNG", alt: "Destaque moda — fundo direito" },
];

const FAN_STACK_MOBILE: { transform: string; file: string; alt: string }[] = [
  { transform: "translate3d(-72%, 0, -800px)", file: "IMG_6458.JPG", alt: "Editorial moda — fundo esquerdo" },
  { transform: "translate3d(-45%, 0, -550px)", file: "13.jpg", alt: "Campanha moda — cartão" },
  { transform: "translate3d(-20%, 0, -260px)", file: "IMG_9604.PNG", alt: "Editorial moda — cartão" },
  { transform: "translate3d(0%, 0, 0px)", file: "imgi_4_00038-alaia-spring-2026-ready-to-wear-credit-brand.jpg", alt: "Alaia — destaque central" },
  { transform: "translate3d(20%, 0, -260px)", file: "imgi_3_00023-carolina-herrera-fall-2026-ready-to-wear-credit-gorunway.jpg", alt: "Carolina Herrera — cartão" },
  { transform: "translate3d(45%, 0, -550px)", file: "IMG_7644.JPG", alt: "Editorial moda — cartão" },
  { transform: "translate3d(72%, 0, -800px)", file: "[Iasmin Reis] for Ralph Lauren Collection Spring 2026 Runway Show in New York.jpg", alt: "Ralph Lauren — cartão fundo direito" },
];

type FanPos = { xPercent: number; z: number };

function parseFanTransform(t: string): FanPos {
  const m = t.match(/translate3d\(\s*([-\d.]+%)\s*,\s*0\s*,\s*([-\d.]+)px\s*\)/);
  if (!m) return { xPercent: 0, z: 0 };
  return { xPercent: parseFloat(m[1]), z: parseFloat(m[2]) };
}

const FAN_POSITIONS_DESKTOP: FanPos[] = FAN_STACK_DESKTOP.map((s) => parseFanTransform(s.transform));
const FAN_POSITIONS_MOBILE: FanPos[] = [
  { xPercent: -45, z: -550 },
  { xPercent: -30, z: -350 },
  { xPercent: -15, z: -150 },
  { xPercent: 0, z: 0 },
  { xPercent: 15, z: -150 },
  { xPercent: 30, z: -350 },
  { xPercent: 45, z: -550 },
];

function zIndexForPos(p: FanPos): number {
  return Math.round(1000 + p.z + p.xPercent * 0.01);
}

function applyFanPose(el: HTMLElement, positions: FanPos[], cardIndex: number, shuffleK: number) {
  const s = (cardIndex + shuffleK + N * 10) % N;
  const p = positions[s];

  gsap.set(el, {
    left: "50%",
    top: "50%",
    x: 0,
    y: 0,
    xPercent: p.xPercent - 50,
    yPercent: -50,
    z: p.z,
    rotation: 0,
    transformOrigin: "50% 50%",
    force3D: true,
    zIndex: zIndexForPos(p),
    autoAlpha: 1,
    scale: 1,
  });
}

export default function StarsPage() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const fanLayoutRef = useRef<HTMLDivElement | null>(null);
  const shuffleKRef = useRef(0);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );
  const [stackReady, setStackReady] = useState(false);
  const fanStack = isMobile ? FAN_STACK_MOBILE : FAN_STACK_DESKTOP;
  const positions = isMobile ? FAN_POSITIONS_MOBILE : FAN_POSITIONS_DESKTOP;

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (!stackReady) return;
    const cards = cardsRef.current.filter((n): n is HTMLDivElement => n != null);
    if (cards.length !== N) return;

    const ctx = gsap.context(() => {
      let shuffleDelayCall: gsap.core.Tween | null = null;
      const currentK = shuffleKRef.current;

      cards.forEach((el, i) => {
        applyFanPose(el, positions, i, currentK);
      });

      const runShuffleStep = () => {
        shuffleKRef.current = (shuffleKRef.current + 1) % N;
        const k = shuffleKRef.current;
        const tl = gsap.timeline({
          defaults: {
            force3D: true,
            ease: "power2.inOut",
            duration: 0.8,
          },
          onComplete: () => {
            shuffleDelayCall = gsap.delayedCall(1.2, runShuffleStep);
          },
        });

        cards.forEach((el, i) => {
          const s = (i + k + N * 10) % N;
          const p = positions[s];
          tl.to(
            el,
            {
              left: "50%",
              top: "50%",
              x: 0,
              y: 0,
              xPercent: p.xPercent - 50,
              yPercent: -50,
              z: p.z,
              autoAlpha: 1,
              onStart: () => {
                gsap.set(el, { zIndex: zIndexForPos(p) });
              },
            },
            0,
          );
        });
      };

      shuffleDelayCall = gsap.delayedCall(1.0, runShuffleStep);

      return () => {
        shuffleDelayCall?.kill();
        gsap.killTweensOf(cards);
      };
    }, fanLayoutRef);

    return () => ctx.revert();
  }, [positions, stackReady]);

  return (
    <main
      className={`qs-page ${isMobile ? "qs-page--mobile" : ""} relative isolate flex min-h-dvh w-full min-w-0 flex-col overflow-visible bg-transparent pb-24 sm:pb-19`}
      aria-label="Stars — Home Model"
    >
      <div className="relative z-30 flex min-h-dvh w-full min-w-0 flex-1 flex-col items-center justify-center pb-8 pt-10 sm:pb-12 sm:pt-12">
        <div className="pointer-events-none flex w-full justify-center overflow-visible px-3 py-6 sm:px-4 sm:py-10">
          <div className="qs-fan-perspective-shell">
            <div className="qs-fan-tilt-layer">
              <div ref={fanLayoutRef} className="qs-fan-layout">
                {fanStack.map(({ file, alt }, i) => (
                  <div
                    key={`${file}-${i}`}
                    ref={(el) => {
                      if (el) cardsRef.current[i] = el;
                    }}
                    className="qs-fan-card-base rounded-[20px]"
                  >
                    <img
                      src={efeitoSrc(file)}
                      alt={alt}
                      width={FAN_CARD_W}
                      height={FAN_CARD_H}
                      draggable={false}
                      loading="eager"
                      decoding="async"
                      sizes="(max-width: 767px) 90vw, (max-width: 991px) 400px, 601px"
                      className="qs-fan-card-img"
                      onLoad={() => {
                        if (i === 3) setStackReady(true);
                      }}
                      onError={(event) => {
                        const img = event.currentTarget;
                        if (img.src.includes("13.jpg")) return;
                        img.src = efeitoSrc("13.jpg");
                        if (i === 3) setStackReady(true);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
