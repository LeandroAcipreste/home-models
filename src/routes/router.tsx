import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import HomePage from "../pages/home/HomePage";
import QuemSomos from "../pages/quemSomos/QuemSomos";
import StarsPage from "../pages/stars/StarsPage";
import SectionPage from "../pages/section/SectionPage";

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "quem-somos", element: <QuemSomos /> },
        { path: "feminino", element: <SectionPage title="Feminino" /> },
        { path: "masculino", element: <SectionPage title="Masculino" /> },
        { path: "stars", element: <StarsPage /> },
        { path: "destaques", element: <SectionPage title="Destaques" /> },
        {
          path: "fashion-school",
          element: <SectionPage title="Fashion School" />,
        },
      ],
    },
  ]);
}
