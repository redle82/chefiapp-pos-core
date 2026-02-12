/**
 * Landing v2 — Sistema Operacional do Restaurante
 *
 * Parallel to current LandingPage. Route: /v2
 * Narrative flow: OS declaration → operational stories → manifesto →
 * components → CTA → audience → proof → comparison → pricing →
 * como comecar → hardware → FAQ → values → footer
 *
 * Identity: ChefIApp™ OS. Dark theme. Amber accent. Restaurant = protagonist.
 */
import { useFadeIn } from "./hooks/useFadeIn";
import { ComoComecerV2 } from "./sections/ComoComecerV2";
import { ComparisonV2 } from "./sections/ComparisonV2";
import { CTABannerV2 } from "./sections/CTABannerV2";
import { FAQV2 } from "./sections/FAQV2";
import { FooterV2 } from "./sections/FooterV2";
import { HardwareV2 } from "./sections/HardwareV2";
import { HeroV2 } from "./sections/HeroV2";
import { ManifestoV2 } from "./sections/ManifestoV2";
import { MetricsStripV2 } from "./sections/MetricsStripV2";
import { OperationalStoriesV2 } from "./sections/OperationalStoriesV2";
import { PlatformV2 } from "./sections/PlatformV2";
import { ToolsAvoidV2 } from "./sections/ToolsAvoidV2";
import { NearMissStoryV2 } from "./sections/NearMissStoryV2";
import { PricingV2 } from "./sections/PricingV2";
import { HardObjectionsV2 } from "./sections/HardObjectionsV2";
import { SocialProofV2 } from "./sections/SocialProofV2";
import { TargetAudienceV2 } from "./sections/TargetAudienceV2";
import { TechValuesV2 } from "./sections/TechValuesV2";
import { MoneyLeaksV2 } from "./sections/MoneyLeaksV2";
import { ProblemSolutionV2 } from "./sections/ProblemSolutionV2";
import { RhythmBreakV2 } from "./sections/RhythmBreakV2";
import { ReadyToScaleV2 } from "./sections/ReadyToScaleV2";
import { HotelMirrorV2 } from "./sections/HotelMirrorV2";
import { FinalManifestoV2 } from "./sections/FinalManifestoV2";
import { InsideSystemV2 } from "./sections/InsideSystemV2";
import { SystemLimitsV2 } from "./sections/SystemLimitsV2";

/** Wrapper that fades in children on scroll */
const FadeIn = ({ children }: { children: React.ReactNode }) => {
  const ref = useFadeIn<HTMLDivElement>();
  return (
    <div ref={ref} className="fade-section">
      {children}
    </div>
  );
};

export const LandingV2Page = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased overflow-x-hidden">
      <HeroV2 />
      <FadeIn>
        <MoneyLeaksV2 />
      </FadeIn>
      <FadeIn>
        <OperationalStoriesV2 />
      </FadeIn>
      <FadeIn>
        <ProblemSolutionV2 />
      </FadeIn>
      <FadeIn>
        <InsideSystemV2 />
      </FadeIn>
      <FadeIn>
        <NearMissStoryV2 />
      </FadeIn>
      <RhythmBreakV2 />
      <FadeIn>
        <ManifestoV2 />
      </FadeIn>
      <FadeIn>
        <MetricsStripV2 />
      </FadeIn>
      <FadeIn>
        <PlatformV2 />
      </FadeIn>
      <FadeIn>
        <ToolsAvoidV2 />
      </FadeIn>
      <CTABannerV2
        headline="Teste o sistema operacional completo"
        cta="Começar 14 dias grátis"
        variant="warm"
      />
      <FadeIn>
        <TargetAudienceV2 />
      </FadeIn>
      <FadeIn>
        <SocialProofV2 />
      </FadeIn>
      <FadeIn>
        <ComparisonV2 />
      </FadeIn>
      <FadeIn>
        <ReadyToScaleV2 />
      </FadeIn>
      <FadeIn>
        <HotelMirrorV2 />
      </FadeIn>
      <FadeIn>
        <PricingV2 />
      </FadeIn>
      <FadeIn>
        <HardObjectionsV2 />
      </FadeIn>
      <FadeIn>
        <SystemLimitsV2 />
      </FadeIn>
      <FadeIn>
        <ComoComecerV2 />
      </FadeIn>
      <FadeIn>
        <HardwareV2 />
      </FadeIn>
      <FadeIn>
        <FAQV2 />
      </FadeIn>
      <FadeIn>
        <TechValuesV2 />
      </FadeIn>
      <FadeIn>
        <FinalManifestoV2 />
      </FadeIn>
      <FooterV2 />
    </div>
  );
};
