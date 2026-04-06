import type { CSSProperties, ReactNode } from "react";
import "./RainbowBorder.css";

const BG = "#ffffff";

export const RAINBOW_BORDER_WIDTH_PX = 2;
export const RAINBOW_BORDER_RADIUS_PX = 12;

type RainbowBorderProps = {
  children: ReactNode;
  className?: string;
  radiusPx?: number;
  borderWidthPx?: number;
  innerBg?: string;
  /** Ângulo inicial do conic-gradient (opcional para variações finas). */
  conicStartDeg?: number;
};

export default function RainbowBorder({
  children,
  className = "",
  radiusPx = RAINBOW_BORDER_RADIUS_PX,
  borderWidthPx = RAINBOW_BORDER_WIDTH_PX,
  innerBg = BG,
  conicStartDeg = 0,
}: RainbowBorderProps) {
  const vars = {
    "--rb-radius": `${radiusPx}px`,
    "--rb-border": `${borderWidthPx}px`,
    "--rb-inner-bg": innerBg,
    "--rb-conic-start": `${conicStartDeg}deg`,
  } as CSSProperties;

  return (
    <div className={`rainbow-border ${className}`.trim()} style={vars}>
      <div className="rainbow-border__content">{children}</div>
    </div>
  );
}
