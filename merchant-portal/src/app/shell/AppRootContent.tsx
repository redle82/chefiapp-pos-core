import { Route, Routes } from "react-router-dom";
import { AppOperationalWrapper } from "./AppOperationalShell";
import { PwaInstallabilityGuard, SignupIntentRedirect } from "./AppEntryGuards";
import { StandaloneDeprecatedView } from "./StandaloneDeprecatedView";
import { CookieConsentBanner } from "../../components/CookieConsentBanner";
import { MarketingRoutesFragment } from "../../routes/MarketingRoutes";

type AppRootContentProps = {
  standalone: boolean;
};

export function AppRootContent({ standalone }: AppRootContentProps) {
  if (standalone) {
    return <StandaloneDeprecatedView />;
  }

  return (
    <>
      <PwaInstallabilityGuard />
      <SignupIntentRedirect />
      <CookieConsentBanner />
      <Routes>
        {MarketingRoutesFragment}
        <Route path="/*" element={<AppOperationalWrapper />} />
      </Routes>
    </>
  );
}
