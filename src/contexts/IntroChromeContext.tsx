import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type IntroChromeContextValue = {
  /** Barra inferior fora da tela (vídeo de abertura na home) */
  homeBottomNavHidden: boolean;
  setHomeBottomNavHidden: (hidden: boolean) => void;
  /** Oculta permanentemente a bottom nav (ex: home mobile com botões inline) */
  bottomNavPermanentlyHidden: boolean;
  setBottomNavPermanentlyHidden: (hidden: boolean) => void;
};

const IntroChromeContext = createContext<IntroChromeContextValue | null>(null);

export function IntroChromeProvider({ children }: { children: ReactNode }) {
  const [homeBottomNavHidden, setHomeBottomNavHidden] = useState(false);
  const [bottomNavPermanentlyHidden, setBottomNavPermanentlyHidden] = useState(false);

  const value = useMemo(
    () => ({
      homeBottomNavHidden,
      setHomeBottomNavHidden,
      bottomNavPermanentlyHidden,
      setBottomNavPermanentlyHidden,
    }),
    [homeBottomNavHidden, bottomNavPermanentlyHidden],
  );

  return (
    <IntroChromeContext.Provider value={value}>
      {children}
    </IntroChromeContext.Provider>
  );
}

export function useIntroChrome(): IntroChromeContextValue {
  const ctx = useContext(IntroChromeContext);
  if (!ctx) {
    throw new Error("useIntroChrome deve ser usado dentro de IntroChromeProvider");
  }
  return ctx;
}
