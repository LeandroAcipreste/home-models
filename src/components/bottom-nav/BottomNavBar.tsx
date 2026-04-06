import Button from "../button/button";
import { useIntroChrome } from "../../contexts/IntroChromeContext";
import "./BottomNavBar.css";

const NAV_ITEMS = [
  { to: "/quem-somos", label: "QUEM SOMOS" },
  { to: "/feminino", label: "FEMININO" },
  { to: "/masculino", label: "MASCULINO" },
  { to: "/stars", label: "STARS" },
  { to: "/destaques", label: "DESTAQUES" },
  { to: "/fashion-school", label: "FASHION SCHOOL" },
] as const;

export default function BottomNavBar() {
  const { homeBottomNavHidden, bottomNavPermanentlyHidden } = useIntroChrome();

  if (bottomNavPermanentlyHidden) return null;

  const revealed = !homeBottomNavHidden;

  return (
    <nav
      className={`bottom-nav${revealed ? " bottom-nav--revealed" : ""}`}
      aria-label="Navegação de seções"
      aria-hidden={!revealed}
    >
      <div className="bottom-nav__inner">
        {NAV_ITEMS.map((item, index) => {
          return (
            <Button
              key={item.to}
              to={item.to}
              showIcon={false}
              className="bottom-nav-item"
              conicStartDeg={180 + index * 10}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
