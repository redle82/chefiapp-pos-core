jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => ({ props: { href } }),
}));

import Index from "../../app/index";

describe("Root index route", () => {
  it("redirects to appstaff-web (WebView bridge)", () => {
    const element = Index();
    expect((element as any).props.href).toBe("/appstaff-web");
  });
});
