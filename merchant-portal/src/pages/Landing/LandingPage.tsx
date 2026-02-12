/**
 * LANDING ÚNICA — Sovereign + Last.app
 *
 * Usa OSFrame context="landing" para o mesmo design system do produto (Fire System: ignition).
 * Sequência: Hero → Problem → Solution → TargetAudience → SetupReal → Testimonial → HowItWorks → Demonstration → FAQ → Footer.
 * Conectada: /auth, /op/tpv?mode=trial, WhatsApp e email no footer.
 */
import { OSFrame } from "../../ui/design-system/sovereign/OSFrame";
import { Demonstration } from "./components/Demonstration";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Problem } from "./components/Problem";
import { SetupReal } from "./components/SetupReal";
import { Solution } from "./components/Solution";
import { TargetAudience } from "./components/TargetAudience";
import { Testimonial } from "./components/Testimonial";

export const LandingPage = () => {
  return (
    <OSFrame
      context="landing"
      className="min-h-screen font-sans overflow-hidden"
    >
      <div className="relative z-10 w-full">
        <Hero />
        <Problem />
        <Solution />
        <TargetAudience />
        <SetupReal />
        <Testimonial />
        <HowItWorks />
        <Demonstration />
        <FAQ />
        <Footer />
      </div>
    </OSFrame>
  );
};
