import Button from "../button/button";
import logoHomeModel from "./logo-mode-models.jpg";

function Header() {
  return (
    <header className="header-animate-in sticky top-0 z-40 border-b border-white/15 bg-white/10 backdrop-blur-xl supports-backdrop-filter:bg-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a
          href="/"
          className="flex shrink-0 items-center rounded-lg bg-white/90 p-2 shadow-sm ring-1 ring-black/5 transition hover:bg-white"
          aria-label="Home Model — início"
        >
          <img
            src={logoHomeModel}
            alt="Home Model"
            className="h-8 w-auto max-w-[min(200px,42vw)] object-contain object-left sm:h-9"
            width={180}
            height={48}
            decoding="async"
          />
        </a>

        <nav
          className="flex shrink-0 items-center gap-2 sm:gap-3"
          aria-label="Conta"
        >
          <Button href="#cadastro" showIcon={false} className="text-xs sm:text-sm">
            Cadastre-se
          </Button>
          <Button href="#download" className="text-xs sm:text-sm" />
        </nav>
      </div>
    </header>
  );
}

export default Header;
