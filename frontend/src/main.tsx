
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { AuthProvider } from "./contexts/AuthContext";

  // Mock auth only imported in development builds — never bundled for production
  if (import.meta.env.DEV) {
    await import("./utils/mock-slugger-auth");
  }

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  