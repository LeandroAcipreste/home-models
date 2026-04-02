import { useEffect, useRef, useState } from "react";
import introVideo from "../../../video/video-de-entrada.mp4";

type IntroductionVideoProps = {
  /** Chamado quando o painel terminou de subir e a intro pode desmontar */
  onFinish?: () => void;
  readyToReveal: boolean;
  /**
   * Chamado ~400ms antes do painel branco começar a subir (após flush do DOM) —
   * dispara a Fase 2 da Hero.
   */
  onLiftStart?: () => void;
};

function IntroductionVideo({
  onFinish,
  readyToReveal,
  onLiftStart,
}: IntroductionVideoProps) {
  const [isLifting, setIsLifting] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  /** Evita chamar onFinish duas vezes (transitionend + fallback) */
  const finishFiredRef = useRef(false);

  /**
   * Quando vídeo acabou e a Hero está pronta: após um respiro para o DOM pintar o canvas,
   * avisa o pai e aplica a classe que inicia o translateY (transition CSS 1000ms).
   */
  useEffect(() => {
    if (!videoFinished || !readyToReveal || isLifting) {
      return;
    }
    // 400ms garante que o layout do Canvas na Hero esteja 100% renderizado e pronto pro GSAP
    const timerId = setTimeout(() => {
      onLiftStart?.();
      setIsLifting(true);
    }, 400);
    return () => clearTimeout(timerId);
  }, [videoFinished, readyToReveal, isLifting, onLiftStart]);

  /** Fallback se `transitionend` não disparar (reduced-motion / edge cases) */
  useEffect(() => {
    if (!isLifting) return;
    const id = window.setTimeout(() => {
      if (finishFiredRef.current) return;
      finishFiredRef.current = true;
      onFinish?.();
    }, 1100);
    return () => window.clearTimeout(id);
  }, [isLifting, onFinish]);

  const isTransformTransition = (propertyName: string) =>
    propertyName === "transform" || propertyName === "-webkit-transform";

  const handleLiftPanelTransitionEnd = (
    e: React.TransitionEvent<HTMLDivElement>,
  ) => {
    if (!isTransformTransition(e.propertyName)) return;
    if (e.target !== e.currentTarget) return;
    if (!isLifting || finishFiredRef.current) return;
    finishFiredRef.current = true;
    onFinish?.();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent">
      <div
        className={`absolute inset-0 bg-white transition-transform duration-1000 ease-in-out ${
          isLifting ? "-translate-y-full" : "translate-y-0"
        }`}
        onTransitionEnd={handleLiftPanelTransitionEnd}
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
