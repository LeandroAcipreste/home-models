import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import RainbowBorder from "../rainbow-border/RainbowBorder";
import "./button.css";

type ButtonProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "style"
> & {
  children?: ReactNode;
  /** Texto ao lado do ícone (padrão: Login) */
  label?: string;
  /** Exibe o ícone LogIn (Lucide) com o mesmo efeito de cor da borda */
  showIcon?: boolean;
  /**
   * Quando fornecido usa react-router Link em vez de <a href>.
   * Necessário para navegação SPA sem reload.
   */
  to?: string;
  style?: CSSProperties;
  conicStartDeg?: number;
};

function LoginIcon() {
  return (
    <span className="canvas-download-btn__icon" aria-hidden>
      <LogIn size={18} strokeWidth={2.25} />
    </span>
  );
}

export default function Button({
  children,
  label = "Login",
  showIcon = true,
  className = "",
  href = "#",
  to,
  style,
  conicStartDeg = 0,
  ...rest
}: ButtonProps) {
  const text = children ?? label;
  const cls = `canvas-download-btn group inline-flex ${className}`.trim();

  const inner = (
    <RainbowBorder
      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold leading-tight"
      conicStartDeg={conicStartDeg}
    >
      {showIcon ? <LoginIcon /> : null}
      {text}
    </RainbowBorder>
  );

  if (to) {
    return (
      <Link to={to} className={cls} style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <a href={href} className={cls} style={style} {...rest}>
      {inner}
    </a>
  );
}
