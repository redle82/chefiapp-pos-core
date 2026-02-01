import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useSentry = !!env.SENTRY_AUTH_TOKEN && mode === "production";
  const base = "/";

  return {
    base,
    define: {
      // Polyfill global for libraries that expect Node.js global
      global: {},
    },
    plugins: [
      react(),
      tailwindcss(),
      // Sentry plugin for sourcemaps (production only, requires SENTRY_AUTH_TOKEN)
      ...(useSentry
        ? [
            sentryVitePlugin({
              org: env.SENTRY_ORG || "chefiapp",
              project: env.SENTRY_PROJECT || "merchant-portal",
              authToken: env.SENTRY_AUTH_TOKEN,
              sourcemaps: {
                filesToDeleteAfterUpload: ["**/*.map"],
              },
            }),
          ]
        : []),
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
      // CORE_RUNTIME_AND_ROUTES_CONTRACT: porta oficial do merchant-portal no piloto
      port: 5175,
      strictPort: true,
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
        "/rest": {
          target: "http://localhost:3001",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/rest/, ""),
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
            "supabase-vendor": ["@supabase/supabase-js"],
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
