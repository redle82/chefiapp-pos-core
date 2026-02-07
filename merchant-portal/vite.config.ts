import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localReact = path.resolve(__dirname, "node_modules", "react");
const localReactDom = path.resolve(__dirname, "node_modules", "react-dom");
const rootReact = path.resolve(__dirname, "..", "node_modules", "react");
const rootReactDom = path.resolve(__dirname, "..", "node_modules", "react-dom");
const reactPath = fs.existsSync(localReact) ? localReact : rootReact;
const reactDomPath = fs.existsSync(localReactDom)
  ? localReactDom
  : rootReactDom;

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
        }),
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
          theme_color: "#121212",
          background_color: "#121212",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/app/staff/home",
          icons: [
            {
              src: "Logo Chefiapp.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "Logo Chefiapp.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
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
      // Porta de desenvolvimento: 5175 (override com PORT se necessário).
      port: parseInt(process.env.PORT || "5175", 10),
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
          manualChunks(id) {
            // ── Vendor chunks ──
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router")
            ) {
              return "react-vendor";
            }
            if (
              id.includes("node_modules/framer-motion") ||
              id.includes("node_modules/lucide-react")
            ) {
              return "ui-vendor";
            }
            if (
              id.includes("node_modules/recharts") ||
              id.includes("node_modules/d3-") ||
              id.includes("node_modules/victory-")
            ) {
              return "charts-vendor";
            }
            if (id.includes("node_modules/@stripe")) {
              return "stripe-vendor";
            }

            // ── Feature chunks (pages split by domain) ──
            if (id.includes("/pages/AppStaff/")) return "staff";
            if (
              id.includes("/pages/TPV/") ||
              id.includes("/pages/TPVMinimal/") ||
              id.includes("/pages/KDSMinimal/")
            )
              return "tpv";
            if (
              id.includes("/pages/Config/") ||
              id.includes("/pages/Backoffice/")
            )
              return "config";
            if (
              id.includes("/pages/Owner/") ||
              id.includes("/pages/Manager/") ||
              id.includes("/pages/Reports/") ||
              id.includes("/pages/Dashboard/")
            )
              return "admin";
            if (
              id.includes("/pages/Onboarding/") ||
              id.includes("/pages/Setup/") ||
              id.includes("/pages/Landing/")
            )
              return "onboarding";
            if (
              id.includes("/pages/MenuBuilder/") ||
              id.includes("/pages/MenuCatalog/")
            )
              return "menu";
            if (
              id.includes("/pages/Public/") ||
              id.includes("/pages/PublicWeb/")
            )
              return "public";

            // ── Core engine stays in main bundle ──
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
