import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import RainbowBorder from "../rainbow-border/RainbowBorder";
import { useLoginModal } from "../../contexts/LoginModalContext";
import logoHomeModel from "../navigate-bar/logo-mode-models.jpg";
import "./LoginModal.css";

export default function LoginModal() {
  const { isOpen, closeLoginModal } = useLoginModal();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLoginModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeLoginModal]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("Login enviado. Você será redirecionado após validação.");
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={closeLoginModal}>
      <div
        className="login-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Login Home Model"
        onClick={(event) => event.stopPropagation()}
        style={
          {
            "--login-brand-bg": `url(${logoHomeModel})`,
          } as CSSProperties
        }
      >
        <div className="login-modal-head">
          <h2 className="login-modal-title">Acesse sua conta</h2>
          <button
            type="button"
            className="login-modal-close"
            onClick={closeLoginModal}
            aria-label="Fechar login"
          >
            ×
          </button>
        </div>

        <form className="login-modal-form" onSubmit={handleSubmit}>
          <label className="login-modal-field">
            <span>E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value.replace(/\s+/g, "").toLowerCase());
                setMessage("");
              }}
              placeholder="nome@dominio.com"
              autoComplete="email"
            />
          </label>

          <label className="login-modal-field">
            <span>Senha</span>
            <input
              type="password"
              required
              value={senha}
              onChange={(event) => {
                setSenha(event.target.value);
                setMessage("");
              }}
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="login-modal-submit-wrap">
            <RainbowBorder className="login-modal-submit text-sm font-semibold uppercase tracking-[0.08em] text-zinc-900">
              Entrar
            </RainbowBorder>
          </button>

          {message ? <p className="login-modal-message">{message}</p> : null}
        </form>
      </div>
    </div>
  );
}
