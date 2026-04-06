import { Outlet, ScrollRestoration } from "react-router-dom";
import BottomNavBar from "../components/bottom-nav/BottomNavBar";
import FixedHomeButton from "../components/fixed-home-button/FixedHomeButton";
import { IntroChromeProvider } from "../contexts/IntroChromeContext";

/** Shell da app: restauração de scroll (data router) + conteúdo + navegação inferior */
export default function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <IntroChromeProvider>
        <FixedHomeButton />
        <Outlet />
        <BottomNavBar />
      </IntroChromeProvider>
    </>
  );
}
