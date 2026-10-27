import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base "./" lets the build work on GitHub Pages, Netlify or Vercel without changes
export default defineConfig({ base: "./", plugins: [react(), tailwindcss()] });
