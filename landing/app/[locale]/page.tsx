import { Features } from "@/components/Features";
import { FinalCTA } from "@/components/FinalCTA";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Proof } from "@/components/Proof";

export default function LocalePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Proof />
      <FinalCTA />
    </>
  );
}
