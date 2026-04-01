import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from "react";

const ACCENT = "#F97316";
const BG = "#050505";
const BG_HOVER = "#0A0A0A";

const styles: {
  root: CSSProperties;
  beamLayer: CSSProperties;
  spinner: CSSProperties;
  conic: CSSProperties;
  inner: CSSProperties;
  icon: CSSProperties;
} = {
  root: {
    ["--spread" as string]: "90deg",
    ["--shimmer-color" as string]: ACCENT,
    ["--speed" as string]: "3s",
    ["--cut" as string]: "1px",
    position: "relative",
    isolation: "isolate",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    overflow: "hidden",
    borderRadius: 0,
    backgroundColor: "transparent",
    padding: "0.625rem 1.25rem",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    fontWeight: 600,
    color: "#fff",
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    transition:
      "box-shadow 0.3s ease, color 0.3s ease, background-color 0.3s ease",
  },
  beamLayer: {
    position: "absolute",
    inset: 0,
    zIndex: -20,
    overflow: "hidden",
  },
  spinner: {
    position: "absolute",
    inset: "-100%",
    width: "300%",
    height: "300%",
    animation: "button-beam-spin 3s linear infinite",
  },
  conic: {
    position: "absolute",
    inset: 0,
    background: `conic-gradient(
      from calc(270deg - (var(--spread) * 0.5)),
      transparent 0,
      var(--shimmer-color) var(--spread),
      transparent var(--spread)
    )`,
  },
  inner: {
    position: "absolute",
    inset: "1px",
    zIndex: -10,
    backgroundColor: BG,
    transition: "background-color 0.3s ease",
  },
  icon: {
    width: 18,
    height: 18,
    flexShrink: 0,
    color: ACCENT,
  },
};

type ButtonProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "style"
> & {
  children?: ReactNode;
  /** Texto exibido ao lado do ícone (padrão: Download) */
  label?: string;
  /** Exibe o ícone solar:file-download-bold-duotone */
  showIcon?: boolean;
};

function DownloadIcon() {
  return (
    <svg
      aria-hidden
      width={18}
      height={18}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={styles.icon}
    >
      <path
        clipRule="evenodd"
        d="M10 22h4c3.771 0 5.657 0 6.828-1.172S22 17.771 22 14v-.437c0-.873 0-1.529-.043-2.063h-4.052c-1.097 0-2.067 0-2.848-.105c-.847-.114-1.694-.375-2.385-1.066c-.692-.692-.953-1.539-1.067-2.386c-.105-.781-.105-1.75-.105-2.848l.01-2.834q0-.124.02-.244C11.121 2 10.636 2 10.03 2C6.239 2 4.343 2 3.172 3.172C2 4.343 2 6.229 2 10v4c0 3.771 0 5.657 1.172 6.828S6.229 22 10 22"
        fill="currentColor"
        fillRule="evenodd"
        opacity={0.5}
      />
      <path
        d="M9.013 19.047a.75.75 0 0 1-1.026 0l-2-1.875a.75.75 0 0 1 1.026-1.094l.737.69V13.5a.75.75 0 0 1 1.5 0v3.269l.737-.691a.75.75 0 0 1 1.026 1.094zM11.51 2.26l-.01 2.835c0 1.097 0 2.066.105 2.848c.114.847.375 1.694 1.067 2.385c.69.691 1.538.953 2.385 1.067c.781.105 1.751.105 2.848.105h4.052q.02.232.028.5H22c0-.268 0-.402-.01-.56a5.3 5.3 0 0 0-.958-2.641c-.094-.128-.158-.204-.285-.357C19.954 7.494 18.91 6.312 18 5.5c-.81-.724-1.921-1.515-2.89-2.161c-.832-.556-1.248-.834-1.819-1.04a6 6 0 0 0-.506-.154c-.384-.095-.758-.128-1.285-.14z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Button({
  children,
  label = "Download",
  showIcon = true,
  className = "",
  href = "#",
  ...rest
}: ButtonProps) {
  const text = children ?? label;

  return (
    <>
      <style>{`
        @keyframes button-beam-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .canvas-download-btn:hover {
          box-shadow: 0 0 30px -5px rgba(249, 115, 22, 0.3);
        }
        .canvas-download-btn:hover .canvas-download-btn__inner {
          background-color: ${BG_HOVER};
        }
      `}</style>
      <a
        href={href}
        className={`canvas-download-btn group ${className}`.trim()}
        style={styles.root}
        {...rest}
      >
        <div style={styles.beamLayer}>
          <div style={styles.spinner}>
            <div style={styles.conic} />
          </div>
        </div>
        <div
          className="canvas-download-btn__inner"
          style={styles.inner}
          aria-hidden
        />
        {showIcon ? <DownloadIcon /> : null}
        {text}
      </a>
    </>
  );
}
