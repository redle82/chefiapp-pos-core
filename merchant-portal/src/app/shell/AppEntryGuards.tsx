import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/useAuth";
import { applyPwaInstallabilityPolicy } from "../../core/pwa/installabilityPolicy";
import { shouldRedirectSignupIntent } from "./signupIntentRedirect";

export function SignupIntentRedirect() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      if (
        !shouldRedirectSignupIntent({
          isLoading: loading,
          hasSession: Boolean(session),
          pathname: location.pathname,
          signupIntentFlag: sessionStorage.getItem("chefiapp_signup_intent"),
        })
      ) {
        return;
      }

      sessionStorage.removeItem("chefiapp_signup_intent");
      navigate("/setup/start", { replace: true });
    } catch {
      // ignore
    }
  }, [session, loading, location.pathname, navigate]);

  return null;
}

export function PwaInstallabilityGuard() {
  const location = useLocation();

  useLayoutEffect(() => {
    void applyPwaInstallabilityPolicy(location.pathname);
  }, [location.pathname]);

  return null;
}
