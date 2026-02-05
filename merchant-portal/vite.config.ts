import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localReact = path.resolve(__dirname, "node_modules", "react");
const localReactDom = path.resolve(__dirname, "node_modules", "react-dom");
const rootReact = path.resolve(__dirname, "..", "node_modules", "react");
const rootReactDom = path.resolve(__dirname, "..", "node_modules", "react-dom");
const reactPath = fs.existsSync(localReact) ? localReact : rootReact;
const reactDomPath = fs.existsSync(localReactDom) ? localReactDom : rootReactDom;

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useSentry = !!env.SENTRY_AUTH_TOKEN && mode === "production";
  const base = "/";

  const sentryPlugins = [];
  if (useSentry) {
    try {
      const { sentryVitePlugin } = await import("@sentry/vite-plugin");
      sentryPlugins.push(
        sentryVitePlugin({
          org: env.SENTRY_ORG || "chefiapp",
          project: env.SENTRY_PROJECT || "merchant-portal",
          authToken: env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            filesToDeleteAfterUpload: ["**/*.map"],
          },
        })
      );
    } catch {
      // @sentry/vite-plugin não instalado; build sem sourcemaps Sentry
    }
  }

  return {
    base,
    define: {
      // Polyfill global for libraries that expect Node.js global
      global: {},
    },
    resolve: {
      dedupe: ["react", "react-dom", "react-router-dom"],
      // Invalid hook call: forçar uma única cópia de React (workspace: local ou raiz).
      alias: {
        react: reactPath,
        "react-dom": reactDomPath,
      },
    },
    // Uma única instância de React: pre-bundle usa o mesmo alias para evitar Invalid hook call.
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
      force: process.env.VITE_FORCE_DEPS === "1",
      esbuildOptions: {
        alias: {
          react: reactPath,
          "react-dom": reactDomPath,
        },
      },
    },
    plugins: [
      // fastRefresh: false evita runtime extra que pode carregar segunda cópia do React (Invalid hook call).
      react({ fastRefresh: false }),
      tailwindcss(),
      ...sentryPlugins,
      VitePWA({
        registerType: "prompt",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "vite.svg"],
        devOptions: {
          enabled: false, // CRITICAL: Disable in dev to prevent workbox loop
        },
        manifest: {
          name: "ChefIApp — Sistema Operacional",
          short_name: "ChefIApp",
          description:
            "Sistema operacional para restaurantes. TPV, KDS e App Staff num só lugar.",
          theme_color: "#000000",
          background_color: "#0a0a0a",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "Logo Chefiapp.png",
              sizes: "192x192", // Assuming it's large enough, ideally resize
              type: "image/png",
            },
            {
              src: "Logo Chefiapp.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 5000000, // 5MB
        },
      }),
    ],
    server: {
      // CORE_RUNTIME_AND_ROUTES_CONTRACT: porta oficial do merchant-portal (5157; não mudar)
      // Se PORT estiver definido (ex.: porta 5157 ocupada), usa essa porta e não falha.
      port: parseInt(process.env.PORT || "5157", 10),
      strictPort: !process.env.PORT,
      proxy: {
        "/internal": {
          target: "http://localhost:4320",
          changeOrigin: true,
        },

        "/webhooks": {
          target: "http://localhost:4320",
          changeOrigin: true,
        },
        "/api": {
          target: "http://localhost:4320",
          changeOrigin: true,
        },
        // Core Docker: nginx em 3001 espera /rest/v1/* e reescreve para PostgREST
        "/rest": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
        "/rpc": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
      fs: {
        allow: [".."],
      },
    },
    build: {
      sourcemap: useSentry, // Enable sourcemaps for Sentry (production only)
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "ui-vendor": ["framer-motion", "lucide-react"],
            // Feature chunks (entries mortos removidos: DashboardZero, MenuManager, TPV legado)
            staff: ["./src/pages/AppStaff/StaffModule"],
          },
        },
      },
      chunkSizeWarningLimit: 500, // 500KB warning threshold
    },
    test: {
      environment: "jsdom",
      globals: true,
      include: ["**/*.test.ts", "**/*.test.tsx"],
    },
  };
});
