/**
 * LANDING ÚNICA — Sovereign + Last.app
 *
 * Sequência: Hero → Problem → Solution → TargetAudience → SetupReal → Testimonial → HowItWorks → Demonstration → FAQ → Footer.
 * Copy Last.app (WhatsApp, 49€, 3 passos) integrada no Hero e Footer.
 * Conectada: /auth (entrar), /demo (ver demonstração), WhatsApp e email no footer.
 * Não existe outra landing; /demo é tour explicativo ligado por links.
 */
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
        <main className="min-h-screen bg-neutral-950 font-sans text-neutral-200 relative overflow-hidden">
            {/* Global Gradient: Black Fire to Yellow Transition */}
            <div className="absolute inset-0 pointer-events-none z-0 w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-amber-950" />
                <div className="absolute top-[15%] h-[25%] w-full bg-gradient-to-b from-transparent via-red-900/40 to-transparent blur-3xl mix-blend-screen" />
                <div className="absolute bottom-0 h-[40%] w-full bg-gradient-to-t from-amber-600/20 via-amber-900/10 to-transparent blur-2xl" />
            </div>

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
        </main>
    );
};
