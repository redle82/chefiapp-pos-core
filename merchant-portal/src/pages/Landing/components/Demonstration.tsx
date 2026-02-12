import { Link } from "react-router-dom";
import { OSCopy } from "../../../ui/design-system/sovereign/OSCopy";

export const Demonstration = () => {
  return (
    <section className="py-24 bg-transparent relative">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 font-outfit text-white">
          Não é mockup.
          <br />
          <span className="text-amber-500">É sistema a funcionar.</span>
        </h2>
        <p className="text-sm text-neutral-400 max-w-2xl mx-auto mb-2">
          O Demo Guide mostra exatamente o que o cliente final vê. Sem slides.
          Sem simulação.
        </p>
        <p className="text-sm text-amber-500/90 font-medium mb-12">
          {OSCopy.landing.proofSocialSofia}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <a
            href="https://sofiagastrobaribiza.com"
            target="_blank"
            rel="noreferrer"
            className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-md bg-zinc-800 px-6 font-medium text-white transition-all duration-300 hover:bg-zinc-700 border border-zinc-700 text-sm"
          >
            <span className="mr-2">Ver página pública ↗</span>
          </a>

          <Link
            to="/auth"
            className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-md border border-white/10 px-6 font-medium text-white transition-all duration-300 hover:bg-white/5 text-sm"
          >
            <span className="mr-2">Abrir Portal ➝</span>
          </Link>
        </div>

        {/* Static capture of Sofia Gastrobar site */}
        <div className="relative mx-auto max-w-4xl w-full">
          <div className="relative rounded-xl overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.1)] border border-white/10 group">
            {/* This simulates the actual website content as shown in the specific screenshot "Magia, Fogo e Sabor" */}
            <div className="relative bg-black aspect-[16/10] flex items-center justify-center overflow-hidden">
              <img
                src="/sofiagastrobaribiza.png"
                alt="Trial Guide Preview"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
              />
              <div className="absolute bottom-6 right-6 inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                  Abrir sofiagastrobaribiza.com
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
