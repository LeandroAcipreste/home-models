import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIntroChrome } from "../../contexts/IntroChromeContext";
import Button from "../../components/button/button";
import Hero from "./Hero";
import IntroductionVideo from "./IntroductionVideo";
import MobileHomePage from "./MobileHomePage";

/** Breakpoint móvel: abaixo de 640px (sm do Tailwind) usa o layout mobile */
const MOBILE_MQ = "(max-width: 639px)";
type HomeLocationState = { skipIntro?: boolean };

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

function DesktopHomePage({ skipIntro }: { skipIntro: boolean }) {
  const { setHomeBottomNavHidden } = useIntroChrome();

  const [heroReady, setHeroReady] = useState(false);
  const [introFinished, setIntroFinished] = useState(skipIntro);
  const [introLiftSignal, setIntroLiftSignal] = useState(skipIntro ? 1 : 0);

  /** Sempre monta com a barra inferior oculta e libera apenas quando a hero manda revelar. */
  useLayoutEffect(() => {
    setHomeBottomNavHidden(true);
  }, [setHomeBottomNavHidden]);

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

function MobileHomeWrapper({ skipIntro }: { skipIntro: boolean }) {
  const { setHomeBottomNavHidden } = useIntroChrome();
  const [introFinished, setIntroFinished] = useState(skipIntro);
  const [mobileHeroFinished, setMobileHeroFinished] = useState(false);

  useLayoutEffect(() => {
    // Mobile: esconder navegações até o vídeo da hero mobile terminar.
    setHomeBottomNavHidden(!mobileHeroFinished);
  }, [mobileHeroFinished, setHomeBottomNavHidden]);

  useEffect(() => {
    return () => setHomeBottomNavHidden(false);
  }, [setHomeBottomNavHidden]);

  const handleIntroFinish = useCallback(() => {
    setIntroFinished(true);
  }, []);

  const handleMobileHeroFinish = useCallback(() => {
    setMobileHeroFinished(true);
  }, []);

  return (
    <div className="relative min-w-0 w-full overflow-x-clip bg-white">
      {introFinished ? (
        <MobileHomePage onVideoFinished={handleMobileHeroFinish} />
      ) : (
        <IntroductionVideo readyToReveal onFinish={handleIntroFinish} />
      )}

      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-60 transition-all duration-800 ease-[cubic-bezier(0.33,1,0.68,1)] ${mobileHeroFinished ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
      >
        <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-end gap-2 px-4 py-4 sm:px-6 sm:gap-3">
          <Button
            href="#cadastro"
            showIcon={false}
            className="cadastre-nav-btn text-xs sm:text-sm"
          >
            Cadastre-se
          </Button>
          <Button href="#login" className="text-xs sm:text-sm" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const skipIntro = Boolean((location.state as HomeLocationState | null)?.skipIntro);

  useEffect(() => {
    if (!skipIntro) return;
    // Consome o estado apenas uma vez para a intro voltar em carregamentos normais.
    navigate("/", { replace: true });
  }, [skipIntro, navigate]);

  return isMobile ? <MobileHomeWrapper skipIntro={skipIntro} /> : <DesktopHomePage skipIntro={skipIntro} />;
}
