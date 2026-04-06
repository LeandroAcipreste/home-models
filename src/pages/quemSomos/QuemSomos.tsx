import { useRef } from "react";
import type { CSSProperties } from "react";
import "./QuemSomos.css";
const TUNNEL_RING_COUNT = 20;

export default function QuemSomos() {
  const sectionRef = useRef<HTMLElement | null>(null);

  return (
    <main
      ref={sectionRef}
      className="qs-page relative isolate flex min-h-dvh w-full min-w-0 flex-col overflow-visible bg-white pb-24 sm:pb-19"
      aria-label="Quem somos — Home Model"
    >
      <div className="qs-rings-bg" aria-hidden>
        <div
          className="qs-rings-stack"
          style={{ "--tunnel-ring-count": TUNNEL_RING_COUNT } as CSSProperties}
        >
          {Array.from({ length: TUNNEL_RING_COUNT }, (_, i) => (
            <div
              key={i}
              className="qs-ring"
              style={{ "--ring-i": i } as CSSProperties}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex min-h-dvh w-full min-w-0 flex-1 flex-col">
        <div className="relative z-20 flex w-full shrink-0 justify-center px-4 pb-2 pt-12 sm:pt-16 sm:px-6">
          <h1 className="qs-title">
            <span className="qs-title-line text-[clamp(1.75rem,6.5vw,3.75rem)] sm:text-[clamp(2rem,7.5vw,4.25rem)]">
              Somos a
            </span>
            <span className="qs-title-line mt-1 text-[clamp(2rem,7.5vw,4.25rem)] sm:mt-1.5 sm:text-[clamp(2.25rem,8.5vw,5rem)]">
              Home Model
            </span>
          </h1>
        </div>

        <div className="relative z-30 flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-8 sm:px-8 sm:pb-12">
          <p className="max-w-2xl text-center text-sm leading-relaxed text-zinc-700 sm:text-base">
            A Home Model conecta talento, imagem e oportunidade em uma curadoria
            de alto padrão para moda, campanhas e projetos especiais.
          </p>
        </div>
      </div>
    </main>
  );
}
