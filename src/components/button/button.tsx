import type { AnchorHTMLAttributes, ReactNode } from "react";
import { LogIn } from "lucide-react";
import RainbowBorder from "../rainbow-border/RainbowBorder";

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
  ...rest
}: ButtonProps) {
  const text = children ?? label;

  return (
    <a
      href={href}
      className={`canvas-download-btn group inline-flex ${className}`.trim()}
      {...rest}
    >
      <RainbowBorder className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold leading-tight">
        {showIcon ? <LoginIcon /> : null}
        {text}
      </RainbowBorder>
    </a>
  );
}
