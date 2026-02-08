/**
 * LANDING ÚNICA — Sovereign + Last.app
 *
 * Usa OSFrame context="landing" para o mesmo design system do produto (Fire System: ignition).
 * Sequência: Hero → Problem → Solution → TargetAudience → SetupReal → Testimonial → HowItWorks → Demonstration → FAQ → Footer.
 * Conectada: /auth, /op/tpv?mode=demo, WhatsApp e email no footer.
 */
import { OSFrame } from '../../ui/design-system/sovereign/OSFrame';
import { Problem } from './components/Problem';
import { Solution } from './components/Solution';
import { TargetAudience } from './components/TargetAudience';
import { SetupReal } from './components/SetupReal';
import { Testimonial } from './components/Testimonial';
import { HowItWorks } from './components/HowItWorks';
import { Demonstration } from './components/Demonstration';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';

export const LandingPage = () => {
    return (
        <OSFrame context="landing" className="min-h-screen font-sans overflow-hidden">
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
