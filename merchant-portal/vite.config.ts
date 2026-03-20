import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { stripSourceMappingUrl } from "./src/utils/stripSourceMappingUrl";

// Detect local IP for mobile devices (QR scanning from iPhone/Android).
// Wrapped in outer try/catch: some environments throw (e.g. uv_interface_addresses, EPERM).
function getLocalIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    if (!interfaces) return "localhost";
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      for (const addr of iface) {
        if (addr.family === "IPv4" && !addr.internal) {
          return addr.address;
        }
      }
    }
  } catch {
    // Sandbox, restricted env, or Node bug (e.g. uv_interface_addresses) — fallback so Vite still starts
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
  const isElectronTarget = env.VITE_BUILD_TARGET === "electron";
  // Electron carrega o frontend por file://; base tem de ser relativo para os assets resolverem.
  const base = isElectronTarget ? "./" : "/";

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

  // PWA: Using vanilla service worker (public/sw.js) instead of vite-plugin-pwa/Workbox.
  // Registration happens in src/core/pwa/registerSW.ts (production only).
  // The sw.js file is served as a static asset from public/.

  return {
    base,
    define: {
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
        "@chefiapp/core-design-system/tokens.css": path.resolve(__dirname, "src/ui/design-system/core-tokens.css"),
        "@chefiapp/core-design-system": path.resolve(__dirname, "../core-design-system/index.ts"),
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
      // React 19 ships useSyncExternalStore natively. The legacy CJS shim
      // package causes "Cannot set properties of undefined" in ESM production
      // builds because its module.exports wrapper is incompatible. This plugin
      // redirects all imports to our thin ESM shims that re-export from React.
      {
        name: "use-sync-external-store-react19-shim",
        enforce: "pre" as const,
        resolveId(source: string) {
          if (source === "use-sync-external-store" || source === "use-sync-external-store/shim" || source === "use-sync-external-store/shim/index.js") {
            return path.resolve(__dirname, "src/shims/use-sync-external-store-shim.ts");
          }
          if (source === "use-sync-external-store/with-selector" || source === "use-sync-external-store/shim/with-selector" || source === "use-sync-external-store/shim/with-selector.js") {
            return path.resolve(__dirname, "src/shims/use-sync-external-store-with-selector-shim.ts");
          }
        },
      },
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
    ],
    server: {
      // Porta de desenvolvimento: 5175 (override com PORT se necessário).
      port: parseInt(process.env.PORT || "5175", 10),
      strictPort: !process.env.PORT,
      // host: "localhost" evita que o Vite chame networkInterfaces() (que pode falhar em alguns ambientes).
      // Para aceder na rede local (ex.: telemóvel), definir VITE_DEV_HOST=0.0.0.0
      host: process.env.VITE_DEV_HOST === "0.0.0.0" ? "0.0.0.0" : "localhost",
      // Em dev: desactivar cache no browser para evitar "segue igual" após alterações.
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
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
        // Realtime WebSocket: nginx em 3001 proxia /realtime/v1/websocket → realtime:4000
        "/realtime": {
          target: "http://localhost:3001",
          changeOrigin: true,
          ws: true,
        },
      },
      fs: {
        allow: [".."],
      },
    },
    build: {
      sourcemap: useSentry, // Enable sourcemaps for Sentry (production only)
      // Disable the module preload polyfill to avoid inline <script> tags.
      // Modern browsers (Chrome 66+, Firefox 67+, Safari 17+) support modulepreload natively.
      // This allows a strict CSP without 'unsafe-inline' for script-src.
      modulePreload: { polyfill: false },
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

              // Marketing & public pages (not needed for TPV boot)
              if (
                id.includes("/pages/Landing/") ||
                id.includes("/pages/LandingV2/") ||
                id.includes("/pages/LandingGastro/") ||
                id.includes("/pages/Blog/") ||
                id.includes("/pages/About/") ||
                id.includes("/pages/Security/") ||
                id.includes("/pages/Status/") ||
                id.includes("/pages/Changelog/") ||
                id.includes("/pages/Legal/") ||
                id.includes("/pages/Contact/")
              )
                return "pages-marketing";

              if (
                id.includes("/pages/Billing/") ||
                id.includes("/pages/AuthPhone/") ||
                id.includes("/pages/LoginPage/") ||
                id.includes("/pages/BootstrapPage") ||
                id.includes("/pages/HelpStartLocalPage")
              )
                return "pages-auth";

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

            // ── Feature chunks (lazy-loaded admin features) ──
            // These are only loaded when navigating to admin pages,
            // NOT at boot. Safe to split because they import from
            // app-runtime but nothing imports FROM them at boot.
            if (id.includes("/features/admin/analytics/")) return "feat-analytics";
            if (id.includes("/features/admin/reports/") || id.includes("/pages/Reports/")) return "feat-reports";
            if (id.includes("/features/admin/inventory/")) return "feat-inventory";
            if (id.includes("/features/admin/shifts/")) return "feat-shifts";
            if (id.includes("/features/admin/tips/")) return "feat-tips";
            if (id.includes("/features/admin/receipts/")) return "feat-receipts";
            if (id.includes("/features/admin/privacy/")) return "feat-privacy";
            if (id.includes("/features/admin/discounts/")) return "feat-discounts";
            if (id.includes("/features/admin/promotions/")) return "feat-promotions";
            if (id.includes("/features/admin/loyalty/")) return "feat-loyalty";
            if (id.includes("/features/admin/marketing/")) return "feat-marketing";
            if (id.includes("/features/admin/multi-location/")) return "feat-multiloc";
            if (id.includes("/features/admin/tables/")) return "feat-tables";
            if (id.includes("/features/admin/orders/")) return "feat-orders";
            // reservations has circular dep with app-runtime, keep together
            // if (id.includes("/features/reservations/")) return "feat-reservations";
            if (id.includes("/features/pv-mobile/")) return "feat-pv-mobile";
            if (id.includes("/features/kds-mobile/")) return "feat-kds-mobile";

            // ── Integration adapters (only loaded when configured) ──
            if (id.includes("/integrations/adapters/")) return "feat-integrations";

            // ── Shared runtime modules (non-page src/ directories) ──
            // Core infrastructure that is imported at boot by TPV/KDS/routing.
            // Must stay in one chunk to prevent TDZ circular dependencies.
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
