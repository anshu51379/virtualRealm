import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  // The integrated deployment always uses its own API. An explicitly set
  // VITE_API_URL can still select a separate backend for other hosts.
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VIRTUAL_REALM_INTEGRATED_API === "true"
    ? "/api"
    : env.VITE_API_URL?.replace(/\/$/, "") || "/api";
  return {
    define: { "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl) },
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:5000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
