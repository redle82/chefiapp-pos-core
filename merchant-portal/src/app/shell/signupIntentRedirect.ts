const SIGNUP_INTENT_BLOCKED_PATHS = new Set([
  "/welcome",
  "/onboarding",
  "/app/activation",
  "/setup/restaurant-minimal",
  "/bootstrap",
]);

type SignupIntentRedirectInput = {
  isLoading: boolean;
  hasSession: boolean;
  pathname: string;
  signupIntentFlag: string | null;
};

export function shouldRedirectSignupIntent({
  isLoading,
  hasSession,
  pathname,
  signupIntentFlag,
}: SignupIntentRedirectInput): boolean {
  if (isLoading || !hasSession) return false;
  if (signupIntentFlag !== "1") return false;
  return !SIGNUP_INTENT_BLOCKED_PATHS.has(pathname);
}
