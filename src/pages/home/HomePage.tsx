import { useCallback, useState } from "react";
import Header from "../../components/header/header";
import Hero from "./Hero";
import IntroductionVideo from "./IntroductionVideo";

function HomePage() {
  const [heroReady, setHeroReady] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  const handleHeroReady = useCallback(() => {
    setHeroReady(true);
  }, []);

  const handleIntroFinish = useCallback(() => {
    setIntroFinished(true);
  }, []);

  return (
    <div className="relative">
      <Header />
      <Hero onReady={handleHeroReady} />
      {!introFinished ? (
        <div className="fixed inset-0 z-50 bg-transparent">
          <IntroductionVideo
            readyToReveal={heroReady}
            onFinish={handleIntroFinish}
          />
        </div>
      ) : null}
    </div>
  );
}

export default HomePage;
