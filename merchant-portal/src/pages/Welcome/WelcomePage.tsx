/**
 * WelcomePage -- Premium onboarding entry point.
 *
 * Shown after Email OTP login for users without a restaurant.
 * If user already has a restaurant, redirects to /admin/home.
 *
 * Design: Dark theme, centered logo with amber glow, single CTA.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/useAuth";
import { getOnboardingStatus } from "../../core/onboarding/OnboardingService";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(to bottom, #0a0a0a 0%, #111111 40%, #1c1917 100%)",
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fafafa",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: "48px 40px",
    borderRadius: 20,
    border: "1px solid rgba(234, 179, 8, 0.15)",
    backgroundColor: "rgba(23, 23, 23, 0.95)",
    boxShadow:
      "0 0 80px rgba(234, 179, 8, 0.08), 0 8px 32px rgba(0,0,0,0.4)",
    textAlign: "center" as const,
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: "contain" as const,
    borderRadius: 20,
    filter: "drop-shadow(0 0 24px rgba(234, 179, 8, 0.4))",
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 8,
    color: "#fafafa",
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
  },
  trademark: {
    fontSize: 16,
    fontWeight: 400,
    color: "#eab308",
    verticalAlign: "super" as const,
  },
  subtitle: {
    fontSize: 15,
    color: "#a3a3a3",
    marginBottom: 40,
    lineHeight: 1.6,
  },
  cta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 52,
    padding: "16px 28px",
    fontSize: 17,
    fontWeight: 700,
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    backgroundColor: "#eab308",
    color: "#0a0a0a",
    letterSpacing: "-0.01em",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    boxShadow: "0 4px 16px rgba(234, 179, 8, 0.25)",
  },
  ctaHover: {
    transform: "translateY(-1px)",
    boxShadow: "0 6px 24px rgba(234, 179, 8, 0.35)",
  },
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: "#525252",
  },
  loading: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#a3a3a3",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 14,
  },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid #333",
    borderTopColor: "#eab308",
    borderRadius: "50%",
    marginBottom: 12,
    animation: "spin 0.8s linear infinite",
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WelcomePage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hovered, setHovered] = useState(false);

  // Check if user already has a restaurant -- redirect if so
  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      // Not logged in, go to login
      navigate("/auth/login", { replace: true });
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const status = await getOnboardingStatus();
        if (cancelled) return;

        if (status.hasRestaurant && status.isOnboardingComplete) {
          navigate("/admin/home", { replace: true });
          return;
        }
      } catch {
        // Unable to check -- show welcome page anyway
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [session, authLoading, navigate]);

  // Loading state
  if (authLoading || checking) {
    return (
      <div style={S.loading}>
        <div style={S.spinner} />
        <p>A preparar...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Logo with amber glow */}
        <div style={S.logoContainer}>
          <img
            src="/logo-chefiapp-clean.png"
            alt="ChefIApp"
            style={S.logo}
          />
        </div>

        {/* Title */}
        <h1 style={S.title}>
          Bem-vindo ao ChefIApp<span style={S.trademark}>&trade;</span> OS
        </h1>

        {/* Subtitle */}
        <p style={S.subtitle}>
          Vamos configurar o teu restaurante em 3 minutos.
          <br />
          Nome, tipo, pais e esta pronto para operar.
        </p>

        {/* CTA */}
        <button
          type="button"
          style={{
            ...S.cta,
            ...(hovered ? S.ctaHover : {}),
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => navigate("/onboarding")}
        >
          Comecar
        </button>

        {/* Footer */}
        <p style={S.footer}>
          Setup assistido &middot; Sem compromisso &middot; Trial gratuito
        </p>
      </div>
    </div>
  );
}
