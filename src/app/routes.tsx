import { createBrowserRouter, Outlet } from "react-router";
import { Landing } from "./pages/Landing";
import { HomePage } from "./pages/Home";
import { TwoPersonInput } from "./pages/TwoPersonInput";
import { InviteJoin } from "./pages/InviteJoin";
import { InputPage } from "./pages/Input";
import { WaitingPage } from "./pages/Waiting";
import { WaitingRoom } from "./pages/WaitingRoom";
import { DashboardPage } from "./pages/Dashboard";
import { History } from "./pages/History";
import { SoloInput } from "./pages/SoloInput";
import { SoloLoading } from "./pages/SoloLoading";
import { SoloDashboard } from "./pages/SoloDashboard";
import { SafetyAlert } from "./pages/SafetyAlert";
import { MyPage } from "./pages/MyPage";
import { ErrorPage } from "./pages/ErrorPage";
import { NotFound } from "./pages/NotFound";

function Root() {
  return <Outlet />;
}

function HydrateFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff5f7",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "#ffd1da",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
          }}
        >
          💬
        </div>
        <p style={{ margin: 0, fontWeight: 600, color: "#222222" }}>
          티격태격
        </p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    ErrorBoundary: ErrorPage,
    HydrateFallback: HydrateFallback,
    children: [
      { index: true, Component: Landing },
      { path: "home", Component: HomePage },
      { path: "new", Component: TwoPersonInput },
      { path: "input", Component: InputPage },
      { path: "waiting", Component: WaitingPage },
      { path: "invite/:roomId", Component: InviteJoin },
      { path: "waiting/:roomId", Component: WaitingRoom },
      { path: "analysis", Component: DashboardPage },
      { path: "history", Component: History },
      { path: "solo", Component: SoloInput },
      { path: "solo-loading", Component: SoloLoading },
      { path: "solo-analysis", Component: SoloDashboard },
      { path: "safety", Component: SafetyAlert },
      { path: "mypage", Component: MyPage },
      { path: "*", Component: NotFound },
    ],
  },
]);
