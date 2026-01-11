import { Hero } from './components/Hero';
import { Problem } from './components/Problem';
import { Solution } from './components/Solution';
import { TargetAudience } from './components/TargetAudience';
import { SetupReal } from './components/SetupReal'; // Comparison Table
import { Testimonial } from './components/Testimonial';
import { HowItWorks } from './components/HowItWorks'; // Timeline Pilot
import { Demonstration } from './components/Demonstration';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

/**
 * 🟡 SOVEREIGN LANDING PAGE
 * 
 * Strict Sequence (Visual Match 2026):
 * 1. Hero (Gold/Dark, no red)
 * 2. Problem (Clean cards, no fire)
 * 3. Solution (Cycle Diagram)
 * 4. TargetAudience (Restaurants, Bars, Dark Kitchens)
 * 5. SetupReal (Comparison Table: Traditional vs ChefIApp)
 * 6. Testimonial (Sofia Gastrobar Quote)
 * 7. HowItWorks (Timeline 14 Days)
 * 8. Demonstration (Live Capture + Buttons)
 * 9. FAQ & Footer
 */
export const LandingPage = () => {
    return (
        <main className="min-h-screen bg-neutral-950 font-sans text-neutral-200 relative overflow-hidden">
            {/* Global Gradient: Black Fire to Yellow Transition */}
            {/* 
              Global Scroll Gradient (Absolute = Moving with Scroll)
              Creates the "Black Fire -> Yellow" physical transition.
            */}
            <div className="absolute inset-0 pointer-events-none z-0 w-full h-full">
                {/* 1. Base Dark (Top) to Amber (Bottom) */}
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-amber-950" />

                {/* 2. The "Fire" Middle Band (Problem Section) - Subtle & Blended */}
                <div className="absolute top-[15%] h-[25%] w-full bg-gradient-to-b from-transparent via-red-900/40 to-transparent blur-3xl mix-blend-screen" />

                {/* 3. The "Gold" Bottom Glow (Solution/Footer) */}
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
