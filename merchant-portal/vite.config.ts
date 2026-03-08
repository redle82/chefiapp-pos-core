import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { stripSourceMappingUrl } from "./src/utils/stripSourceMappingUrl";

// Detect local IP for mobile devices (QR scanning from iPhone/Android)
function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const addr of iface) {
      // Skip internal and non-IPv4 addresses
      if (addr.family === "IPv4" && !addr.internal) {
        // Prefer non-loopback addresses for local network access
        return addr.address;
      }
    }
  }
  return "localhost";
}

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
  const env = loadEnv(mode, __dirname, "VITE_");
  const useSentry = !!env.VITE_SENTRY_AUTH_TOKEN && mode === "production";
  const base = "/";

  // Detect local IP for QR code generation (mobile device provisioning)
  const localIp = mode === "development" ? getLocalIp() : "localhost";

  const sentryPlugins = [];
  if (useSentry) {
    try {
      const { sentryVitePlugin } = await import("@sentry/vite-plugin");
      sentryPlugins.push(
        sentryVitePlugin({
          org: env.VITE_SENTRY_ORG || "chefiapp",
          project: env.VITE_SENTRY_PROJECT || "merchant-portal",
          authToken: env.VITE_SENTRY_AUTH_TOKEN,
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
      __VITE_ENV__: "import.meta.env",
      // Inject local IP for QR code generation in device provisioning
      __LOCAL_IP__: JSON.stringify(localIp),
      // Build timestamp for cache-busting and version identification
      __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    },
    resolve: {
      dedupe: ["react", "react-dom", "react-router-dom"],
      // Invalid hook call: forçar uma única cópia de React (workspace: local ou raiz).
      alias: {
        react: reactPath,
        "react-dom": reactDomPath,
        "@": path.resolve(__dirname, "src"),
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
      // Strip sourceMappingURL comments from node_modules so the browser
      // doesn't flood DevTools with "Could not read source map" warnings.
      mode !== "production" && {
        name: "strip-deps-sourcemaps",
        transform(code: string, id: string) {
          if (
            id.includes("node_modules") &&
            code.includes("sourceMappingURL")
          ) {
            return {
              code: stripSourceMappingUrl(code),
              map: null,
            };
          }
        },
      },
      // resolve.dedupe + resolve.alias já garantem cópia única do React;
      // Fast Refresh re-habilitado para HMR instantâneo (evita full-page reload).
      react(),
      tailwindcss(),
      ...sentryPlugins,
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "vite.svg"],
        devOptions: {
          enabled: false, // CRITICAL: Disable in dev to prevent workbox loop
        },
        manifest: {
          name: "AppStaff — ChefIApp",
          short_name: "AppStaff",
          description:
            "Aplicação para a equipa do restaurante. Gestão de turnos, pedidos e operação.",
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
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 5000000, // 5MB
          // Offline total: SPA carrega quando offline; GET /rest pode usar cache.
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [
            /^\/rest\//,
            /^\/auth\//,
            /^\/api\//,
            /^\/internal\//,
            /^\/webhooks\//,
            /^\/rpc\//,
          ],
          // POS safety: API calls are NetworkOnly — stale cached
          // orders/prices are worse than a network error.  The SPA
          // shell (HTML/CSS/JS) is still precached via globPatterns.
          // To add offline reads later, use NetworkFirst for specific
          // safe endpoints with cacheableResponse: { statuses: [200] }.
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/[^/]+\/rest\/v1\/.*/,
              handler: "NetworkOnly",
              method: "GET",
            },
            {
              urlPattern: /^https?:\/\/[^/]+\/auth\/.*/,
              handler: "NetworkOnly",
              method: "GET",
            },
          ],
        },
      }),
    ],
    server: {
      // Porta de desenvolvimento: 5175 (override com PORT se necessário).
      port: parseInt(process.env.PORT || "5175", 10),
      strictPort: !process.env.PORT,
      // Acessível na rede local para o Expo (WebView) no telemóvel poder carregar http://<MAC_IP>:5175/app/staff/home
      host: true,
      // HMR: WebSocket resiliente — reconecta em vez de morrer.
      hmr: {
        overlay: true,
        timeout: 30000,
      },
      // Watch: ignorar diretórios pesados para evitar chokidar overload.
      watch: {
        ignored: [
          "**/node_modules/**",
          "**/dist/**",
          "**/coverage/**",
          "**/_legacy_isolation/**",
          "**/playwright-report/**",
          "**/test-results/**",
          "**/logs/**",
          "**/.git/**",
        ],
      },
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
            // React + libs that use React (createContext etc.) in same chunk to avoid "undefined.createContext"
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router") ||
              id.includes("node_modules/lucide-react")
            ) {
              return "react-vendor";
            }
            // framer-motion + motion ecosystem: MUST be in app-runtime together.
            // motion-dom/unsupported-easing.mjs imports from motion-utils; if split across chunks
            // → "Cannot access 'US' before initialization" (TDZ, US = minified export name).
            if (
              id.includes("node_modules/framer-motion") ||
              id.includes("node_modules/motion-dom") ||
              id.includes("node_modules/motion-utils") ||
              id.includes("node_modules/motion/")
            ) {
              return "app-runtime";
            }
            if (
              id.includes("node_modules/recharts") ||
              id.includes("node_modules/d3-") ||
              id.includes("node_modules/victory-")
            ) {
              return "charts-vendor";
            }
            // Stripe: do NOT put in separate chunk — causes "Cannot access 'u' before initialization"
            // when chunk loads before deps; let Rollup bundle with consuming code.

            // ── Page chunks (top-level src/pages/ ONLY) ──
            // CRITICAL: Use "/src/pages/" (not just "/pages/") so that
            // features/*/pages/ directories are NOT intercepted here.
            // They must fall through to the shared-code patterns below
            // and land in app-runtime. Using "/pages/" alone was the root
            // cause of circular chunk deps (app-runtime ↔ app-core etc.).
            if (id.includes("/src/pages/")) {
              // Pages that MUST live in app-runtime (statically imported at boot,
              // or heavily cross-referenced by shared modules)
              if (
                id.includes("/pages/TPV/") ||
                id.includes("/pages/TPVMinimal/") ||
                id.includes("/pages/KDSMinimal/") ||
                id.includes("/pages/Onboarding/") ||
                id.includes("/pages/AppStaff/context/") ||
                id.includes("/pages/AppStaff/data/") ||
                // Marketing/landing pages: imported statically by MarketingRoutes at boot
                id.includes("/pages/Landing/") ||
                id.includes("/pages/LandingV2/") ||
                id.includes("/pages/Billing/") ||
                id.includes("/pages/Changelog/") ||
                id.includes("/pages/Legal/") ||
                id.includes("/pages/Blog/") ||
                id.includes("/pages/AuthPhone/") ||
                id.includes("/pages/LoginPage/") ||
                id.includes("/pages/About/") ||
                id.includes("/pages/Security/") ||
                id.includes("/pages/Status/") ||
                id.includes("/pages/BootstrapPage") ||
                id.includes("/pages/HelpStartLocalPage") ||
                id.includes("/pages/DebugTPV") ||
                // Config components imported by features/admin/config/pages/
                // — without this, app-runtime→app-admin circular dep occurs.
                id.includes("/pages/Config/PublicPresenceFields") ||
                id.includes("/pages/Config/PublicQRSection") ||
                id.includes("/pages/Config/RestaurantPeopleSection") ||
                id.includes("/pages/Config/RolesSummarySection") ||
                id.includes("/pages/Config/ConfigIntegrationsPage") ||
                // OwnerDashboard + deps imported by features/admin/dashboard/
                id.includes("/pages/AppStaff/OwnerDashboard") ||
                id.includes("/pages/AppStaff/hooks/useAppStaffOrders") ||
                // ReflexEngine imported by StaffContext (which is in app-runtime)
                id.includes("/pages/AppStaff/core/ReflexEngine") ||
                // MenuCatalog types imported by infra/readers/MenuCatalogReader
                id.includes("/pages/MenuCatalog/types")
              )
                return "app-runtime";

              // Feature chunks (domain-focused, low fragmentation)
              if (
                id.includes("/pages/Public/") ||
                id.includes("/pages/PublicWeb/")
              )
                return "public";

              if (id.includes("/pages/AppStaff/")) return "app-staff";
              if (
                id.includes("/pages/Owner/") ||
                id.includes("/pages/Manager/") ||
                id.includes("/pages/Reports/") ||
                id.includes("/pages/Dashboard/")
              )
                return "app-admin";
              if (
                id.includes("/pages/Config/") ||
                id.includes("/pages/Backoffice/")
              )
                return "app-admin";
              if (
                id.includes("/pages/MenuBuilder/") ||
                id.includes("/pages/MenuCatalog/")
              )
                return "app-menu";

              if (
                id.includes("/pages/Operacao/") ||
                id.includes("/pages/ShoppingList/") ||
                id.includes("/pages/TaskSystem/") ||
                id.includes("/pages/People/") ||
                id.includes("/pages/Health/") ||
                id.includes("/pages/Financial/") ||
                id.includes("/pages/Install") ||
                id.includes("/pages/CoreReset/")
              )
                return "app-misc";

              // All remaining pages
              return "app-core";
            }

            // ── Shared runtime modules (non-page src/ directories only) ──
            // ALL shared code (core, hooks, features, ui, components, infra, domain, etc.)
            // MUST live in a single chunk to prevent TDZ circular dependencies.
            if (
              id.includes("/core/") ||
              id.includes("/context/") ||
              id.includes("/hooks/") ||
              id.includes("/features/") ||
              id.includes("/intelligence/") ||
              id.includes("/ui/") ||
              id.includes("/components/") ||
              id.includes("/infra/") ||
              id.includes("/domain/") ||
              id.includes("/commercial/") ||
              id.includes("/integrations/") ||
              id.includes("/shared/") ||
              id.includes("/onboarding-core/")
            )
              return "app-runtime";

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
