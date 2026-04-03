import { useCallback, useState } from "react";
import Hero from "./Hero";
import IntroductionVideo from "./IntroductionVideo";

function HomePage() {
  const [heroReady, setHeroReady] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [introLiftSignal, setIntroLiftSignal] = useState(0);

  const handleHeroReady = useCallback(() => {
    setHeroReady(true);
  }, []);

  const handleIntroFinish = useCallback(() => {
    setIntroFinished(true);
  }, []);

  const handleIntroLiftStart = useCallback(() => {
    setIntroLiftSignal((n) => n + 1);
  }, []);

  return (
    <div className="relative">
      <Hero onReady={handleHeroReady} introLiftSignal={introLiftSignal} />

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

export default HomePage;
