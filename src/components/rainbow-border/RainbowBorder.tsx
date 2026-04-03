import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const BG = "#ffffff";

export const RAINBOW_BORDER_WIDTH_PX = 2;
export const RAINBOW_BORDER_RADIUS_PX = 12;

/** Ajuste fino: quanto maior o perímetro, mais ciclos de arco-íris (“cobrinhas”) ao redor. */
export const ADAPTIVE_RAINBOW_DEFAULTS = {
  /** px de perímetro “por” uma cobrinha completa (espectro 0→360°) */
  perimeterPerRepeatPx: 160,
  minRepeats: 1,
  maxRepeats: 24,
  /** espessura da borda ≈ perímetro × fator (limitado) */
  borderScalePerPxPerimeter: 0.0012,
  minBorderPx: 2,
  maxBorderPx: 8,
} as const;

export type AdaptiveRainbowConfig = {
  perimeterPerRepeatPx: number;
  minRepeats: number;
  maxRepeats: number;
  borderScalePerPxPerimeter: number;
  minBorderPx: number;
  maxBorderPx: number;
};

/** Perímetro aproximado de um retângulo com cantos arredondados (raio limitado à meia menor aresta). */
export function approximateBoxPerimeter(
  width: number,
  height: number,
  radiusPx: number,
): number {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  if (w <= 0 || h <= 0) return 0;
  const r = Math.min(radiusPx, w / 2, h / 2);
  const straight = 2 * (w + h) - 8 * r;
  const corners = 2 * Math.PI * r;
  return straight + corners;
}

export function computeAdaptiveRepeats(
  perimeterPx: number,
  config: AdaptiveRainbowConfig = ADAPTIVE_RAINBOW_DEFAULTS,
): number {
  if (perimeterPx <= 0) return config.minRepeats;
  const raw = Math.round(perimeterPx / config.perimeterPerRepeatPx);
  return Math.max(
    config.minRepeats,
    Math.min(config.maxRepeats, raw),
  );
}

export function computeAdaptiveBorderWidth(
  perimeterPx: number,
  config: AdaptiveRainbowConfig = ADAPTIVE_RAINBOW_DEFAULTS,
): number {
  if (perimeterPx <= 0) return config.minBorderPx;
  const raw = Math.round(perimeterPx * config.borderScalePerPxPerimeter);
  return Math.max(
    config.minBorderPx,
    Math.min(config.maxBorderPx, raw),
  );
}

/** Várias “cobrinhas” = o espectro completo repetido N vezes ao longo de 360°. */
function buildRepeatingConicGradient(repeatCount: number): string {
  const n = Math.max(1, repeatCount);
  const parts: string[] = [];
  for (let r = 0; r < n; r++) {
    const offset = (360 / n) * r;
    for (let i = 0; i <= 8; i++) {
      const hue = (i / 8) * 360;
      const deg = offset + (i / 8) * (360 / n);
      parts.push(`hsl(${hue}, 95%, 56%) ${deg}deg`);
    }
  }
  return `conic-gradient(from 0deg, ${parts.join(", ")})`;
}

const STATIC_CONIC = `conic-gradient(
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
      )`;

type RainbowBorderProps = {
  children: ReactNode;
  className?: string;
  /** Raio externo em px (padrão: igual aos botões) */
  radiusPx?: number;
  /** Espessura da borda em px (ignorada se adaptiveDensity estiver ativo) */
  borderWidthPx?: number;
  /** Cor do preenchimento interno */
  innerBg?: string;
  /**
   * Mede o tamanho do card e aumenta repetições do gradiente + espessura da borda
   * conforme o perímetro (mais “cobrinhas coloridas” para preencher bordas maiores).
   */
  adaptiveDensity?: boolean;
  /** Sobrescreve defaults de ADAPTIVE_RAINBOW_DEFAULTS */
  adaptiveConfig?: Partial<AdaptiveRainbowConfig>;
};

function layerStyles(
  radiusPx: number,
  borderWidthPx: number,
  innerBg: string,
  innerRadiusPx: number,
  conicBackground: string,
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
      background: conicBackground,
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
  adaptiveDensity = false,
  adaptiveConfig: adaptiveConfigPartial,
}: RainbowBorderProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState<{
    w: number;
    h: number;
    repeats: number;
    borderW: number;
  } | null>(null);

  const adaptiveConfig = useMemo(
    () => ({
      ...ADAPTIVE_RAINBOW_DEFAULTS,
      ...adaptiveConfigPartial,
    }),
    [adaptiveConfigPartial],
  );

  useLayoutEffect(() => {
    if (!adaptiveDensity) {
      setMeasured(null);
      return;
    }
    const el = rootRef.current;
    if (!el) return;

    const apply = () => {
      const rect = el.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const rEffective = Math.min(radiusPx, w / 2, h / 2);
      const perimeter = approximateBoxPerimeter(w, h, rEffective);
      const repeats = computeAdaptiveRepeats(perimeter, adaptiveConfig);
      const borderW = computeAdaptiveBorderWidth(perimeter, adaptiveConfig);
      setMeasured({ w, h, repeats, borderW });
    };

    apply();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(apply);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [adaptiveDensity, radiusPx, adaptiveConfig]);

  const effectiveBorder =
    adaptiveDensity && measured
      ? measured.borderW
      : borderWidthPx;
  const innerRadiusPx = Math.max(0, radiusPx - effectiveBorder);
  const conicBackground =
    adaptiveDensity && measured
      ? buildRepeatingConicGradient(measured.repeats)
      : STATIC_CONIC;

  const L = layerStyles(
    radiusPx,
    effectiveBorder,
    innerBg,
    innerRadiusPx,
    conicBackground,
  );

  return (
    <div
      ref={rootRef}
      className={`rainbow-border relative isolate overflow-hidden ${className}`.trim()}
      style={{ borderRadius: radiusPx }}
    >
      <div style={L.beamLayer}>
        <div style={L.spinner} data-rainbow-spin>
          <div style={L.conic} data-rainbow-hue />
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
