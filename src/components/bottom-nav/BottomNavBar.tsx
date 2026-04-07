import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import Button from "../button/button";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
  const { homeBottomNavHidden, bottomNavPermanentlyHidden } = useIntroChrome();
  const navRef = useRef<HTMLElement | null>(null);

  if (location.pathname === "/cadastro") return null;
  if (bottomNavPermanentlyHidden) return null;

  const revealed = !homeBottomNavHidden;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".bottom-nav-reveal-item");

      if (!items.length) return;

      if (revealed) {
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
          stagger: 0.1,
          delay: 0.1,
          overwrite: "auto",
        });
      } else {
        gsap.set(items, {
          opacity: 0,
          y: 32,
          overwrite: "auto",
        });
      }
    }, navRef);

    return () => ctx.revert();
  }, [revealed]);

  return (
    <nav
      ref={navRef}
      className={`bottom-nav${revealed ? " bottom-nav--revealed" : ""}`}
      aria-label="Navegação de seções"
      aria-hidden={!revealed}
    >
      <div className="bottom-nav__inner">
        {NAV_ITEMS.map((item) => {
          return (
            <div key={item.to} className="bottom-nav-reveal-item">
              <Button
                to={item.to}
                showIcon={false}
                className="bottom-nav-item"
                conicStartDeg={180}
              >
                {item.label}
              </Button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
