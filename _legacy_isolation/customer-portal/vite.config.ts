import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useSentry = !!env.SENTRY_AUTH_TOKEN && mode === 'production';

  return {
    plugins: [
      react(),
      // Sentry plugin for sourcemaps (production only)
      ...(useSentry ? [sentryVitePlugin({
        org: env.SENTRY_ORG || 'chefiapp',
        project: env.SENTRY_PROJECT || 'customer-portal',
        authToken: env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          filesToDeleteAfterUpload: ['**/*.map'],
        },
      })] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5174,
      fs: {
        allow: ['..'],
      },
    },
    build: {
      sourcemap: useSentry,
    },
  };
});
