import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Extract base URL without /api suffix if present
  const apiBaseUrl = env.VITE_API_BASE_URL || "http://localhost:8080/api";
  const targetUrl = apiBaseUrl.replace(/\/api\/?$/, '');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: targetUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
