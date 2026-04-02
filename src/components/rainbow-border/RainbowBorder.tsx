import type { CSSProperties, ReactNode } from "react";

const BG = "#ffffff";

export const RAINBOW_BORDER_WIDTH_PX = 2;
export const RAINBOW_BORDER_RADIUS_PX = 12;

type RainbowBorderProps = {
  children: ReactNode;
  className?: string;
  /** Raio externo em px (padrão: igual aos botões) */
  radiusPx?: number;
  /** Espessura da borda em px */
  borderWidthPx?: number;
  /** Cor do preenchimento interno */
  innerBg?: string;
};

function layerStyles(
  radiusPx: number,
  borderWidthPx: number,
  innerBg: string,
  innerRadiusPx: number,
): {
  beamLayer: CSSProperties;
  spinner: CSSProperties;
  conic: CSSProperties;
  inner: CSSProperties;
} {
  return {
    beamLayer: {
      position: "absolute",
      inset: 0,
      zIndex: -20,
      overflow: "hidden",
      borderRadius: radiusPx,
    },
    spinner: {
      position: "absolute",
      inset: "-100%",
      width: "300%",
      height: "300%",
      animation: "rainbow-border-spin 4s linear infinite",
    },
    conic: {
      position: "absolute",
      inset: 0,
      background: `conic-gradient(
        from 0deg,
        hsl(0, 95%, 56%),
        hsl(45, 95%, 56%),
        hsl(90, 95%, 56%),
        hsl(135, 95%, 56%),
        hsl(180, 95%, 56%),
        hsl(225, 95%, 56%),
        hsl(270, 95%, 56%),
        hsl(315, 95%, 56%),
        hsl(360, 95%, 56%)
      )`,
      animation: "rainbow-border-hue 10s linear infinite",
    },
    inner: {
      position: "absolute",
      inset: borderWidthPx,
      zIndex: -10,
      backgroundColor: innerBg,
      borderRadius: innerRadiusPx,
      transition: "background-color 0.3s ease",
    },
  };
}

export default function RainbowBorder({
  children,
  className = "",
  radiusPx = RAINBOW_BORDER_RADIUS_PX,
  borderWidthPx = RAINBOW_BORDER_WIDTH_PX,
  innerBg = BG,
}: RainbowBorderProps) {
  const innerRadiusPx = radiusPx - borderWidthPx;
  const L = layerStyles(radiusPx, borderWidthPx, innerBg, innerRadiusPx);

  return (
    <div
      className={`rainbow-border relative isolate overflow-hidden ${className}`.trim()}
      style={{ borderRadius: radiusPx }}
    >
      <div style={L.beamLayer}>
        <div style={L.spinner}>
          <div style={L.conic} />
        </div>
      </div>
      <div
        className="rainbow-border__inner"
        style={L.inner}
        aria-hidden
      />
      {children}
    </div>
  );
}
