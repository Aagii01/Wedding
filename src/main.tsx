import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { EventPage } from "./app/pages/EventPage";
import { DemoPage } from "./app/pages/DemoPage";
import { LandingPage } from "./app/pages/LandingPage";
import { CreatePage } from "./app/pages/CreatePage";
import { AdminPage } from "./app/pages/AdminPage";
import "./styles/index.css";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/create", element: <CreatePage /> },
  { path: "/admin", element: <AdminPage /> },
  { path: "/i/:slug", element: <EventPage /> },
  { path: "/demo/:id", element: <DemoPage /> },
  { path: "*", element: <LandingPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
