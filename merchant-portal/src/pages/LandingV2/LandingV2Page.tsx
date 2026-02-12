/**
 * Landing v2 — Sistema Operacional do Restaurante
 *
 * Parallel to current LandingPage. Route: /v2
 * Narrative flow: OS declaration → operational stories → manifesto →
 * components → audience → proof → hardware → comparison → CTA →
 * pricing → FAQ → values → footer
 *
 * Identity: ChefIApp™ OS. Dark theme. Amber accent. Restaurant = protagonist.
 */
import { ComparisonV2 } from "./sections/ComparisonV2";
import { CTABannerV2 } from "./sections/CTABannerV2";
import { FAQV2 } from "./sections/FAQV2";
import { FooterV2 } from "./sections/FooterV2";
import { HardwareV2 } from "./sections/HardwareV2";
import { HeroV2 } from "./sections/HeroV2";
import { ManifestoV2 } from "./sections/ManifestoV2";
import { OperationalStoriesV2 } from "./sections/OperationalStoriesV2";
import { PlatformV2 } from "./sections/PlatformV2";
import { PricingV2 } from "./sections/PricingV2";
import { SocialProofV2 } from "./sections/SocialProofV2";
import { TargetAudienceV2 } from "./sections/TargetAudienceV2";
import { TechValuesV2 } from "./sections/TechValuesV2";

export const LandingV2Page = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased overflow-x-hidden">
      <HeroV2 />
      <OperationalStoriesV2 />
      <ManifestoV2 />
      <PlatformV2 />
      <CTABannerV2
        headline="Teste o sistema operacional completo"
        cta="Comecar 14 dias gratis"
        variant="warm"
      />
      <TargetAudienceV2 />
      <SocialProofV2 />
      <ComparisonV2 />
      <PricingV2 />
      <HardwareV2 />
      <FAQV2 />
      <TechValuesV2 />
      <FooterV2 />
    </div>
  );
};
