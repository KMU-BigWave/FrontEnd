import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

function GlobalFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff5f7",
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
          marginBottom: 16,
        }}
      >
        💬
      </div>
      <p
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "#222222",
          margin: 0,
        }}
      >
        티격태격
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<GlobalFallback />}>
      <RouterProvider router={router} fallbackElement={<GlobalFallback />} />
    </Suspense>
  );
}
