import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  // Preserve the original public API URL during migration from CRA. Expose
  // only this allowlisted value, never the remaining server environment.
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || env.REACT_APP_BASE_URL || "/api";
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
