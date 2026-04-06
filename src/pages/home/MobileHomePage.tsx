import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import mobileHomeVideo from "../../../video/video-home-page-mobile.mp4";
import RainbowBorder from "../../components/rainbow-border/RainbowBorder";
import "./MobileHomePage.css";

const NAV_ITEMS = [
  { to: "/quem-somos", label: "Quem Somos" },
  { to: "/feminino", label: "Feminino" },
  { to: "/masculino", label: "Masculino" },
  { to: "/stars", label: "Stars" },
  { to: "/destaques", label: "Destaques" },
  { to: "/fashion-school", label: "Fashion School" },
] as const;

export default function MobileHomePage() {
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().catch(() => {
      setButtonsVisible(true);
    });
  }, []);

  return (
    <div className="mobile-home relative flex min-h-dvh w-full flex-col overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={mobileHomeVideo}
        muted
        playsInline
        preload="auto"
        onEnded={() => setButtonsVisible(true)}
        onError={() => setButtonsVisible(true)}
      />

      {/* Overlay escuro gradiente só quando os botões estão visíveis */}
      <div
        className={`absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-700 ${buttonsVisible ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      />

      {/* Botões — surgem um abaixo do outro após o vídeo */}
      <div className="relative z-10 mt-auto flex w-full flex-col items-center gap-4 px-6 pb-10 pt-8">
        {NAV_ITEMS.map((item, i) => (
          <Link
            key={item.to}
            to={item.to}
            className={`mobile-home-btn w-full max-w-xs ${buttonsVisible ? "mobile-home-btn--visible" : ""}`}
            style={{ "--btn-delay": `${i * 0.11}s` } as React.CSSProperties}
          >
            <RainbowBorder className="flex w-full items-center justify-center py-3 text-sm font-semibold uppercase tracking-widest">
              {item.label}
            </RainbowBorder>
          </Link>
        ))}
      </div>
    </div>
  );
}
