import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis } from "lenis/react";
import HomePage from "./pages/home/HomePage";

gsap.registerPlugin(ScrollTrigger);

function forceScrollTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
}

/** Cada carregamento/atualização: topo + Lenis alinhado (evita hero no meio da timeline). */
function LenisScrollReset() {
  const lenis = useLenis();

  useLayoutEffect(() => {
    forceScrollTop();
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
    ScrollTrigger.refresh();
  }, [lenis]);

  return null;
}

/** Sincroniza Lenis com o motor de scroll do GSAP (Hero / ScrollTrigger). */
function LenisGsapSync() {
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (!lenis) return;

    const onScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(ticker);
    };
  }, [lenis]);

  return null;
}

function App() {
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
    ScrollTrigger.refresh();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        forceScrollTop();
        ScrollTrigger.refresh();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  if (reduceMotion) {
    return <HomePage />;
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
      <HomePage />
    </ReactLenis>
  );
}

export default App;
