import { useLocation, useNavigate } from "react-router-dom";
import { useIntroChrome } from "../../contexts/IntroChromeContext";
import RainbowBorder from "../rainbow-border/RainbowBorder";
import logoHomeModel from "../navigate-bar/logo-mode-models.jpg";

export default function FixedHomeButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { homeBottomNavHidden } = useIntroChrome();

  const isHome = location.pathname === "/";
  const shouldShow = !isHome || !homeBottomNavHidden;

  const handleGoHome = () => {
    navigate("/", { state: { skipIntro: true } });
  };

  return (
    <button
      type="button"
      onClick={handleGoHome}
      className={`fixed left-3 top-3 z-90 inline-flex border-0 bg-transparent p-0 transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] sm:left-4 sm:top-4 ${
        shouldShow
          ? "cursor-pointer opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 -translate-y-4"
      }`}
      aria-label="Voltar para página inicial"
    >
      <RainbowBorder className="inline-flex p-1.5 sm:p-2">
        <img
          src={logoHomeModel}
          alt="Home Model"
          width={60}
          height={60}
          decoding="async"
          className="h-8 w-8 rounded-[8px] object-cover sm:h-9 sm:w-9"
        />
      </RainbowBorder>
    </button>
  );
}
