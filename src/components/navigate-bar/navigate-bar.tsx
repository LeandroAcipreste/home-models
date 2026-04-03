import Button from "../button/button";
import RainbowBorder from "../rainbow-border/RainbowBorder";
import logoHomeModel from "./logo-mode-models.jpg";

function NavigateBar() {
  return (
    <header
      className="pointer-events-none absolute inset-x-0 top-0 z-50 bg-transparent"
      role="banner"
    >
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a
          href="/"
          className="nav-reveal-item inline-flex shrink-0 opacity-0"
          aria-label="Home Model — início"
        >
          <RainbowBorder className="inline-flex p-2">
            <img
              src={logoHomeModel}
              alt="Home Model"
              className="relative z-10 h-8 w-auto max-w-[min(200px,42vw)] object-contain object-left sm:h-9"
              width={180}
              height={48}
              decoding="async"
            />
          </RainbowBorder>
        </a>

        <nav
          className="flex shrink-0 items-center gap-2 sm:gap-3"
          aria-label="Conta"
        >
          <Button
            href="#cadastro"
            showIcon={false}
            className="cadastre-nav-btn nav-reveal-item opacity-0 text-xs sm:text-sm"
          >
            Cadastre-se
          </Button>
          <Button
            href="#login"
            className="nav-reveal-item opacity-0 text-xs sm:text-sm"
          />
        </nav>
      </div>
    </header>
  );
}

export default NavigateBar;
