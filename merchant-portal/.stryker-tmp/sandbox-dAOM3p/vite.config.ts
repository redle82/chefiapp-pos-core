// @ts-nocheck
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
  const httpsEnabled = env.VITE_DEV_HTTPS === "1";
  let httpsConfig: boolean | { key: Buffer; cert: Buffer } | undefined;

  if (httpsEnabled) {
    const certDir = path.resolve(__dirname, ".certs");
    const keyPath =
      env.VITE_HTTPS_KEY || path.join(certDir, "localhost-key.pem");
    const certPath = env.VITE_HTTPS_CERT || path.join(certDir, "localhost.pem");

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      httpsConfig = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    } else {
      // Fallback to self-signed if no certs are present (may still be blocked on iOS)
      httpsConfig = true;
    }
  }

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
        registerType: "prompt",
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
              src: "Logo chefiapp os.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "Logo chefiapp os.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 5000000, // 5MB
          // Offline total: SPA carrega quando offline; GET /rest pode usar cache.
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [
            /^\/rest\//,
            /^\/api\//,
            /^\/internal\//,
            /^\/webhooks\//,
            /^\/rpc\//,
          ],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/[^/]+\/rest\/v1\/[^?]*/,
              handler: "NetworkFirst",
              method: "GET",
              options: {
                cacheName: "chefiapp-rest-get",
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 5 },
                cacheableResponse: { statuses: [0, 200] },
                networkTimeoutSeconds: 10,
              },
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
      https: httpsConfig,
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
              id.includes("node_modules/framer-motion") ||
              id.includes("node_modules/lucide-react")
            ) {
              return "react-vendor";
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
            // app-ui: do NOT split /ui/ and /components/ — causes "Cannot access 'vr' before initialization" (TDZ).

            // ── Shared core modules ──
            if (
              id.includes("/core/") ||
              id.includes("/context/") ||
              id.includes("/hooks/") ||
              id.includes("/features/") ||
              id.includes("/intelligence/")
            )
              return "app-runtime";

            // ── Feature chunks (domain-focused, low fragmentation) ──
            if (
              id.includes("/pages/Public/") ||
              id.includes("/pages/PublicWeb/")
            )
              return "public";

            // TPV/KDS: do NOT put in separate chunk — causes "Cannot access 'K' before initialization" (TDZ)
            // when chunk loads before deps; let Rollup bundle with consuming code (app-runtime/app-core).
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
              id.includes("/pages/Onboarding/") ||
              id.includes("/pages/Setup/") ||
              id.includes("/pages/Landing/")
            )
              return "app-onboarding";
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

            if (id.includes("/pages/")) return "app-core";

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
