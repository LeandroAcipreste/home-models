import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import BottomNavBar from "../components/bottom-nav/BottomNavBar";
import FixedHomeButton from "../components/fixed-home-button/FixedHomeButton";
import { IntroChromeProvider } from "../contexts/IntroChromeContext";
import { LoginModalProvider } from "../contexts/LoginModalContext";
import LoginModal from "../components/login-modal/LoginModal";
import "./RootLayout.css";

/** Shell da app: restauração de scroll (data router) + conteúdo + navegação inferior */
export default function RootLayout() {
  const location = useLocation();

  return (
    <>
      <ScrollRestoration />
      <LoginModalProvider>
        <IntroChromeProvider>
          <FixedHomeButton />
          <div
            key={`${location.pathname}${location.search}`}
            className="route-transition-enter"
          >
            <Outlet />
          </div>
          <BottomNavBar />
          <LoginModal />
        </IntroChromeProvider>
      </LoginModalProvider>
    </>
  );
}
