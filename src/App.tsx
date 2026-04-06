import { useLayoutEffect, useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis } from "lenis/react";
import { createAppRouter } from "./routes";

gsap.registerPlugin(ScrollTrigger);

/** Menos reflows em mobile (barra de endereço) e menos risco de loop refresh↔layout */
ScrollTrigger.config({ ignoreMobileResize: true });

function forceScrollTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
}

let scrollTriggerRefreshScheduled = false;

/** Agrupa refreshes no próximo frame — evita thrash quando Lenis + vários triggers montam ao mesmo tempo */
function scheduleScrollTriggerRefresh(): void {
  if (scrollTriggerRefreshScheduled) return;
  scrollTriggerRefreshScheduled = true;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollTriggerRefreshScheduled = false;
      ScrollTrigger.refresh();
    });
  });
}

/** Cada carregamento: topo + Lenis alinhado + refresh coalescido */
function LenisScrollReset() {
  const lenis = useLenis();

  useLayoutEffect(() => {
    forceScrollTop();
    if (!lenis) return;
    lenis.scrollTo(0, { immediate: true });
    scheduleScrollTriggerRefresh();
  }, [lenis]);

  return null;
}

/**
 * Lenis controla o scroll suave; sem scrollerProxy o ScrollTrigger lê o scroll nativo errado
 * (comum em produção / Vercel).
 */
function LenisGsapSync() {
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (!lenis) return;

    const scroller = document.documentElement;

    ScrollTrigger.scrollerProxy(scroller, {
      scrollTop(value) {
        if (arguments.length && typeof value === "number") {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    const onScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    scheduleScrollTriggerRefresh();

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(ticker);
      // GSAP: segundo argumento falsy remove o proxy (tipos não incluem null)
      ScrollTrigger.scrollerProxy(scroller, null as unknown as undefined);
    };
  }, [lenis]);

  return null;
}

function App() {
  const router = useMemo(() => createAppRouter(), []);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useLayoutEffect(() => {
    try {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    } catch {
      /* ignore */
    }
    forceScrollTop();
    if (reduceMotion) {
      ScrollTrigger.refresh();
    }
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        forceScrollTop();
        scheduleScrollTriggerRefresh();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [reduceMotion]);

  if (reduceMotion) {
    return <RouterProvider router={router} />;
  }

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      }}
    >
      <LenisGsapSync />
      <LenisScrollReset />
      <RouterProvider router={router} />
    </ReactLenis>
  );
}

export default App;
