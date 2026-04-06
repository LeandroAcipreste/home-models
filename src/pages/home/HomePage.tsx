import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useIntroChrome } from "../../contexts/IntroChromeContext";
import Hero from "./Hero";
import IntroductionVideo from "./IntroductionVideo";
import MobileHomePage from "./MobileHomePage";

/** Breakpoint móvel: abaixo de 640px (sm do Tailwind) usa o layout mobile */
const MOBILE_MQ = "(max-width: 639px)";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_MQ).matches,
  );

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

function DesktopHomePage() {
  const { setHomeBottomNavHidden } = useIntroChrome();

  const [heroReady, setHeroReady] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [introLiftSignal, setIntroLiftSignal] = useState(0);

  /** Esconde a barra ao montar (introFinished ainda é false). Nunca revela aqui —
   *  a revelação é responsabilidade de onHeaderNavReveal no Hero (fim da animação). */
  useLayoutEffect(() => {
    if (!introFinished) setHomeBottomNavHidden(true);
  }, [introFinished, setHomeBottomNavHidden]);

  useEffect(() => {
    return () => setHomeBottomNavHidden(false);
  }, [setHomeBottomNavHidden]);

  const handleHeroReady = useCallback(() => setHeroReady(true), []);
  const handleIntroFinish = useCallback(() => setIntroFinished(true), []);
  const handleIntroLiftStart = useCallback(() => setIntroLiftSignal((n) => n + 1), []);
  const handleHeaderNavReveal = useCallback(() => setHomeBottomNavHidden(false), [setHomeBottomNavHidden]);

  return (
    <div className="relative min-w-0 w-full overflow-x-clip">
      <Hero
        onReady={handleHeroReady}
        introLiftSignal={introLiftSignal}
        onHeaderNavReveal={handleHeaderNavReveal}
      />
      {!introFinished ? (
        <IntroductionVideo
          readyToReveal={heroReady}
          onFinish={handleIntroFinish}
          onLiftStart={handleIntroLiftStart}
        />
      ) : null}
    </div>
  );
}

function MobileHomeWrapper() {
  const { setBottomNavPermanentlyHidden } = useIntroChrome();

  useLayoutEffect(() => {
    setBottomNavPermanentlyHidden(true);
    return () => setBottomNavPermanentlyHidden(false);
  }, [setBottomNavPermanentlyHidden]);

  return <MobileHomePage />;
}

export default function HomePage() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileHomeWrapper /> : <DesktopHomePage />;
}
