import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type LoginModalContextValue = {
  isOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      openLoginModal: () => setIsOpen(true),
      closeLoginModal: () => setIsOpen(false),
    }),
    [isOpen],
  );

  return (
    <LoginModalContext.Provider value={value}>
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal(): LoginModalContextValue {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    throw new Error("useLoginModal deve ser usado dentro de LoginModalProvider");
  }
  return ctx;
}
