// LEGACY: secção de problema da landing antiga. A formulação atualizada de
// dores vive em `LandingV2/sections/ProblemSolutionV2.tsx`.
import { OSCopy } from '../../../ui/design-system/sovereign/OSCopy';

export const Problem = () => {
    return (
        <section className="py-32 relative overflow-hidden bg-transparent">
            {/* Background handled by LandingPage global gradient */}
            <div className="hidden" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <div className="inline-flex items-center gap-2 mb-6">
                        <span className="text-2xl">🔥</span>
                        <h2 className="text-2xl md:text-3xl font-bold text-white/90">
                            {OSCopy.landing.problemTitle}
                        </h2>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto space-y-0 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50 rounded-full" />

                    {OSCopy.landing.problemItems.map((item, idx) => (
                        <div key={idx} className="pl-8 py-6 group relative">
                            {/* Marker */}
                            <div className="absolute left-[-5px] top-8 w-3 h-3 rounded-full bg-red-400 group-hover:bg-amber-400 transition-colors shadow-lg shadow-red-500/50" />

                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-200 transition-colors">{item.title}</h3>
                            <p className="text-white/60 text-base">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-2xl md:text-3xl font-semibold text-white leading-relaxed">
                        Você não precisa de mais um app. <br />
                        <span className="text-amber-400">{OSCopy.landing.problemSubtitleHighlight}</span>
                    </p>
                </div>
            </div>
        </section>
    );
};
