import { useEffect, useState } from "react";
import introVideo from "../../../video/video-de-entrada.mp4";

type IntroductionVideoProps = {
  onFinish: () => void;
  readyToReveal: boolean;
};

function IntroductionVideo({ onFinish, readyToReveal }: IntroductionVideoProps) {
  const [isLifting, setIsLifting] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);

  useEffect(() => {
    if (!videoFinished || !readyToReveal || isLifting) return;
    setIsLifting(true);
  }, [videoFinished, readyToReveal, isLifting]);

  useEffect(() => {
    if (!isLifting) return;

    const timeoutId = window.setTimeout(() => {
      onFinish();
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [isLifting, onFinish]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent">
      <div
        className={`absolute inset-0 bg-white transition-transform duration-1000 ease-in-out ${
          isLifting ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <video
          className="h-screen w-full object-cover"
          autoPlay
          muted
          playsInline
          onEnded={() => setVideoFinished(true)}
          onError={() => setVideoFinished(true)}
        >
          <source src={introVideo} type="video/mp4" />
        </video>
      </div>
    </main>
  );
}

export default IntroductionVideo;
