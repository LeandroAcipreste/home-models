import type { CSSProperties, ReactNode } from "react";
import { NavLink, type NavLinkProps } from "react-router-dom";
import "./RainbowNavLink.css";

export type RainbowNavLinkProps = Omit<
  NavLinkProps,
  "className" | "children" | "style"
> & {
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  /** Defasa a animação de cor entre vários links na mesma barra */
  colorStaggerIndex?: number;
};

export default function RainbowNavLink({
  className = "",
  children,
  colorStaggerIndex = 0,
  style,
  ...rest
}: RainbowNavLinkProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        `rainbow-nav-link${isActive ? " rainbow-nav-link--active" : ""} ${className}`.trim()
      }
      style={{
        ["--rainbow-stagger" as string]: colorStaggerIndex,
        ...style,
      }}
      {...rest}
    >
      <span className="rainbow-nav-link__label">{children}</span>
    </NavLink>
  );
}
