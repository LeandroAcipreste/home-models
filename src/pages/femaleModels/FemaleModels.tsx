import { useEffect, useLayoutEffect, useRef } from "react";
import type { CSSProperties } from "react";
import "./FemaleModels.css";
import gsap from "gsap";

const N = 7;
const TUNNEL_RING_COUNT = 20;

const EFEITO_BASE = `${import.meta.env.BASE_URL}images/models/img-efeito-backgroung`;
const FAN_CARD_W = 601;
const FAN_CARD_H = 416;

function efeitoSrc(filename: string): string {
  return `${EFEITO_BASE}/${encodeURIComponent(filename)}`;
}

const FAN_STACK: { transform: string; file: string; alt: string }[] = [
  { transform: "translate3d(-72%, 0, -800px)", file: "IMG_6458.JPG", alt: "Editorial moda — fundo esquerdo" },
  { transform: "translate3d(-45%, 0, -550px)", file: "13.jpg", alt: "Campanha moda — cartão" },
  { transform: "translate3d(-20%, 0, -260px)", file: "dolce-gabbana-fw26.PNG", alt: "Dolce & Gabbana — cartão" },
  { transform: "translate3d(0%, 0, 0px)", file: "iasmin-reis-ralph-lauren-fall26.png", alt: "Iasmin Reis Ralph Lauren — destaque central" },
  { transform: "translate3d(20%, 0, -260px)", file: "etro-fall-winter-26.PNG", alt: "Etro — cartão" },
  { transform: "translate3d(45%, 0, -550px)", file: "IMG_7644.JPG", alt: "Editorial moda — cartão" },
  { transform: "translate3d(72%, 0, -800px)", file: "roberto-cavalli-fw26.PNG", alt: "Roberto Cavalli — cartão fundo direito" },
];

type FanPos = { xPercent: number; z: number };

function parseFanTransform(t: string): FanPos {
  const m = t.match(/translate3d\(\s*([-\d.]+%)\s*,\s*0\s*,\s*([-\d.]+)px\s*\)/);
  if (!m) return { xPercent: 0, z: 0 };
  return { xPercent: parseFloat(m[1]), z: parseFloat(m[2]) };
}

const FAN_POSITIONS: FanPos[] = FAN_STACK.map((s) => parseFanTransform(s.transform));

function zIndexForPos(p: FanPos): number {
  return Math.round(1000 + p.z + p.xPercent * 0.01);
}

function applyFanPose(el: HTMLElement, cardIndex: number, shuffleK: number) {
  const s = (cardIndex + shuffleK + N * 10) % N;
  const p = FAN_POSITIONS[s];

  gsap.set(el, {
    xPercent: p.xPercent,
    y: 0,
    z: p.z,
    x: 0,
    rotation: 0,
    transformOrigin: "50% 50%",
    force3D: true,
    zIndex: zIndexForPos(p),
    autoAlpha: 1,
    scale: 1,
  });
}

/** Hero da segunda dobra / página Female Models (leque + túnel). */
function FemaleModels() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        el.classList.toggle("fm-hero-animations-paused", !entry.isIntersecting);
      },
      { root: null, rootMargin: "80px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    let cancelled = false;
    let shuffleDelayCall: gsap.core.Tween | null = null;
    let rafId = 0;
    let cardsBound: HTMLDivElement[] = [];

    const runShuffleStep = () => {
      if (cancelled) return;
      const fresh = cardsRef.current.filter((n): n is HTMLDivElement => n != null);
      if (fresh.length !== N) return;
      const k = shuffleK;

      const tl = gsap.timeline({
        defaults: { force3D: true },
        onComplete: () => {
          shuffleK = (shuffleK + 1) % N;
          if (!cancelled) {
            shuffleDelayCall = gsap.delayedCall(1.8, runShuffleStep);
          }
        },
      });

      fresh.forEach((el, i) => {
        const currentSlot = (i + k + N * 10) % N;
        const nextSlot = (i + k + 1 + N * 10) % N;
        const p = FAN_POSITIONS[nextSlot];

        gsap.set(el, { zIndex: zIndexForPos(p) });

        if (currentSlot === 5 && nextSlot === 6) {
          tl.to(el, { xPercent: p.xPercent, z: p.z, duration: 0.75, ease: "power2.inOut" }, 0);
          tl.to(el, { autoAlpha: 0.15, duration: 0.35, yoyo: true, repeat: 1 }, 0);
        } else {
          tl.to(
            el,
            {
              xPercent: p.xPercent,
              z: p.z,
              x: 0,
              rotation: 0,
              autoAlpha: 1,
              duration: 0.75,
              ease: "power2.inOut",
            },
            0,
          );
        }
      });
    };

    let shuffleK = 0;

    const tryMount = () => {
      if (cancelled) return;
      const cards = cardsRef.current.filter((n): n is HTMLDivElement => n != null);
      if (cards.length !== N) {
        rafId = requestAnimationFrame(tryMount);
        return;
      }
      cardsBound = cards;
      cards.forEach((el, i) => {
        applyFanPose(el, i, 0);
      });
      shuffleDelayCall = gsap.delayedCall(0.25, runShuffleStep);
    };

    tryMount();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      shuffleDelayCall?.kill();
      if (cardsBound.length > 0) gsap.killTweensOf(cardsBound);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="female-models-hero hero relative isolate z-30 flex min-h-[100dvh] w-full min-w-0 flex-col overflow-visible bg-white"
      aria-label="Female models — destaque"
    >
      <div className="fm-hero-rings-bg" aria-hidden>
        <div
          className="fm-hero-rings-stack"
          style={{ "--tunnel-ring-count": TUNNEL_RING_COUNT } as CSSProperties}
        >
          {Array.from({ length: TUNNEL_RING_COUNT }, (_, i) => (
            <div
              key={i}
              className="fm-hero-ring"
              style={{ "--ring-i": i } as CSSProperties}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex min-h-[100dvh] w-full min-w-0 flex-1 flex-col">
        <div className="relative z-[20] flex w-full shrink-0 justify-center px-4 pb-2 pt-6 sm:px-6">
          <h2 className="fm-hero-title">
            <span className="fm-hero-title-line text-[clamp(1.75rem,6.5vw,3.75rem)] sm:text-[clamp(2rem,7.5vw,4.25rem)]">
              Somos a
            </span>
            <span className="fm-hero-title-line mt-1 text-[clamp(2rem,7.5vw,4.25rem)] sm:mt-1.5 sm:text-[clamp(2.25rem,8.5vw,5rem)]">
              Home Model
            </span>
          </h2>
        </div>

        <div className="relative z-[30] flex min-h-0 flex-1 flex-col items-center justify-center pb-8 sm:pb-12">
          <div className="pointer-events-none flex w-full justify-center overflow-visible px-3 py-6 sm:px-4 sm:py-10">
            <div className="fm-fan-perspective-shell">
              <div className="fm-fan-tilt-layer">
                <div className="fm-fan-layout">
                  {FAN_STACK.map(({ file, alt }, i) => (
                    <div
                      key={`${file}-${i}`}
                      ref={(el) => {
                        if (el) cardsRef.current[i] = el;
                      }}
                      className="fm-fan-card-base rounded-[20px]"
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
                        className="fm-fan-card-img"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FemaleModels;
