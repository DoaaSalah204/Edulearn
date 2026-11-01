import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend calls /api/... and Vite forwards it to the backend (no CORS / URL problems).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": { target: "http://localhost:4000", changeOrigin: true } } },
  preview: { port: 5173, proxy: { "/api": { target: "http://localhost:4000", changeOrigin: true } } }
});
