import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  css: {
    postcss: "./postcss.config.cjs",
  },
  server: {
    port: Number(process.env.VITE_PORT) || 5173,
  },
});
