import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from "react";
import { LogIn } from "lucide-react";
import RainbowBorder from "../rainbow-border/RainbowBorder";

/** Cor base alinhada ao gradiente da borda; `hue-rotate` gera o arco-íris */
const iconRainbowBase: CSSProperties = {
  display: "inline-flex",
  flexShrink: 0,
  color: "hsl(0, 95%, 55%)",
  animation: "rainbow-border-hue 10s linear infinite",
};

type ButtonProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "style"
> & {
  children?: ReactNode;
  /** Texto ao lado do ícone (padrão: Login) */
  label?: string;
  /** Exibe o ícone LogIn (Lucide) com o mesmo efeito de cor da borda */
  showIcon?: boolean;
};

function LoginIcon() {
  return (
    <span style={iconRainbowBase} aria-hidden>
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
  ...rest
}: ButtonProps) {
  const text = children ?? label;

  return (
    <a
      href={href}
      className={`canvas-download-btn group inline-flex ${className}`.trim()}
      style={{
        color: "#18181b",
        textDecoration: "none",
        cursor: "pointer",
        transition:
          "box-shadow 0.3s ease, color 0.3s ease, background-color 0.3s ease",
      }}
      {...rest}
    >
      <RainbowBorder className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold leading-tight">
        {showIcon ? <LoginIcon /> : null}
        {text}
      </RainbowBorder>
    </a>
  );
}
