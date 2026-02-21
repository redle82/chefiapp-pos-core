/**
 * Vite config SOMENTE para build da área de marketing (landing, blog, pricing, etc.).
 * Output: dist-marketing — para deploy separado na Vercel (sem app, config, TPV).
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localReact = path.resolve(__dirname, "node_modules", "react");
const localReactDom = path.resolve(__dirname, "node_modules", "react-dom");
const rootReact = path.resolve(__dirname, "..", "node_modules", "react");
const rootReactDom = path.resolve(__dirname, "..", "node_modules", "react-dom");
const reactPath = fs.existsSync(localReact) ? localReact : rootReact;
const reactDomPath = fs.existsSync(localReactDom) ? localReactDom : rootReactDom;

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useSentry = !!env.SENTRY_AUTH_TOKEN && mode === "production";

  return {
    base: "/",
    define: { global: {} },
    resolve: {
      dedupe: ["react", "react-dom", "react-router-dom"],
      alias: {
        react: reactPath,
        "react-dom": reactDomPath,
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
      esbuildOptions: {
        alias: {
          react: reactPath,
          "react-dom": reactDomPath,
        },
      },
    },
    plugins: [react(), tailwindcss()],
    build: {
      outDir: "dist-marketing",
      emptyOutDir: true,
      sourcemap: !!useSentry,
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "index-marketing.html"),
        },
        output: {
          manualChunks(id) {
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router") ||
              id.includes("node_modules/framer-motion") ||
              id.includes("node_modules/lucide-react")
            )
              return "react-vendor";
            if (id.includes("/pages/")) return "marketing-pages";
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
