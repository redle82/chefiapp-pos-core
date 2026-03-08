import { describe, expect, it } from "vitest";
import { shouldRedirectSignupIntent } from "./signupIntentRedirect";

describe("signupIntentRedirect", () => {
  it("blocks redirect while auth is loading or the user has no session", () => {
    expect(
      shouldRedirectSignupIntent({
        isLoading: true,
        hasSession: true,
        pathname: "/admin/modules",
        signupIntentFlag: "1",
      }),
    ).toBe(false);

    expect(
      shouldRedirectSignupIntent({
        isLoading: false,
        hasSession: false,
        pathname: "/admin/modules",
        signupIntentFlag: "1",
      }),
    ).toBe(false);
  });

  it("blocks redirect when the signup intent flag is missing", () => {
    expect(
      shouldRedirectSignupIntent({
        isLoading: false,
        hasSession: true,
        pathname: "/admin/modules",
        signupIntentFlag: null,
      }),
    ).toBe(false);
  });

  it("blocks redirect for bootstrap and activation routes already in the signup funnel", () => {
    expect(
      shouldRedirectSignupIntent({
        isLoading: false,
        hasSession: true,
        pathname: "/welcome",
        signupIntentFlag: "1",
      }),
    ).toBe(false);
    expect(
      shouldRedirectSignupIntent({
        isLoading: false,
        hasSession: true,
        pathname: "/bootstrap",
        signupIntentFlag: "1",
      }),
    ).toBe(false);
  });

  it("redirects authenticated users with signup intent from unrelated routes", () => {
    expect(
      shouldRedirectSignupIntent({
        isLoading: false,
        hasSession: true,
        pathname: "/admin/modules",
        signupIntentFlag: "1",
      }),
    ).toBe(true);
  });
});
