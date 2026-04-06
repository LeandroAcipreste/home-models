import { Outlet, ScrollRestoration } from "react-router-dom";
import BottomNavBar from "../components/bottom-nav/BottomNavBar";
import { IntroChromeProvider } from "../contexts/IntroChromeContext";

/** Shell da app: restauração de scroll (data router) + conteúdo + navegação inferior */
export default function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <IntroChromeProvider>
        <Outlet />
        <BottomNavBar />
      </IntroChromeProvider>
    </>
  );
}
