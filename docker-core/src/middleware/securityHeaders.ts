/**
 * Security Headers Middleware
 * Adds essential security headers to all HTTP responses.
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xContentTypeOptions?: string;
  xFrameOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

const DEFAULT_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0", // Disabled in favor of CSP
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=(self)",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Vite HMR in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

export function getSecurityHeaders(
  config: SecurityHeadersConfig = {},
  isDev = false
): Record<string, string> {
  const headers = { ...DEFAULT_HEADERS };

  if (config.contentSecurityPolicy) {
    headers["Content-Security-Policy"] = config.contentSecurityPolicy;
  }
  if (config.strictTransportSecurity) {
    headers["Strict-Transport-Security"] = config.strictTransportSecurity;
  }
  if (config.xContentTypeOptions) {
    headers["X-Content-Type-Options"] = config.xContentTypeOptions;
  }
  if (config.xFrameOptions) {
    headers["X-Frame-Options"] = config.xFrameOptions;
  }
  if (config.referrerPolicy) {
    headers["Referrer-Policy"] = config.referrerPolicy;
  }
  if (config.permissionsPolicy) {
    headers["Permissions-Policy"] = config.permissionsPolicy;
  }

  // Relax CSP in development
  if (isDev) {
    headers["Content-Security-Policy"] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data:",
      "connect-src *",
      "frame-ancestors 'self'",
    ].join("; ");
  }

  return headers;
}

export function applySecurityHeaders(
  responseHeaders: Record<string, string>,
  config?: SecurityHeadersConfig,
  isDev?: boolean
): void {
  const secHeaders = getSecurityHeaders(config, isDev);
  for (const [key, value] of Object.entries(secHeaders)) {
    responseHeaders[key] = value;
  }
}
