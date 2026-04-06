import { useNavigate } from "react-router-dom";
import RainbowBorder from "../rainbow-border/RainbowBorder";
import logoHomeModel from "../navigate-bar/logo-mode-models.jpg";

export default function FixedHomeButton() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/", { state: { skipIntro: true } });
  };

  return (
    <button
      type="button"
      onClick={handleGoHome}
      className="fixed left-3 top-3 z-90 inline-flex cursor-pointer border-0 bg-transparent p-0 sm:left-4 sm:top-4"
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
