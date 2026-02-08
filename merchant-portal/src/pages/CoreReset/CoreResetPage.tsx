/**
 * CORE RESET PAGE — Tela Neutra (Human Safe Mode)
 *
 * Local Human Safe Mode (Phase C):
 * Quando o Core está indisponível, em vez de bloquear a UI ou mostrar erros técnicos,
 * apresentamos uma interface amigável para explorar o sistema.
 *
 * Regra de Ouro: "Se o Core morrer, o Humano continua a sorrir."
 */

import { PlayCircle, ServerOff } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";

export function CoreResetPage() {
  const { runtime } = useRestaurantRuntime();
  const navigate = useNavigate();
  const coreReachable = runtime.coreReachable ?? false;

  // Se o Core está OK → destino final direto (ORE/FlowGate já validaram). Sem tela intermédia.
  useEffect(() => {
    if (coreReachable) navigate("/dashboard", { replace: true });
  }, [coreReachable, navigate]);

  const handleDemoStart = () => {
    navigate("/dashboard?demo=true");
  };

  if (coreReachable) return null;

  // --- HUMAN SAFE MODE (CORE UNREACHABLE) ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        {/* Ícone Humano (não técnico) */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
          <div className="relative w-full h-full bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center shadow-2xl">
            <ServerOff className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        {/* Título e Copy Seguro */}
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Explorar o sistema
          </h1>
          <p className="text-neutral-400 leading-relaxed">
            A ligação está a ser preparada. Pode explorar a interface e testar
            as funcionalidades com dados de exemplo.
          </p>
        </div>

        {/* Call to Action Claro e Seguro */}
        <button
          onClick={handleDemoStart}
          className="group w-full bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 h-14 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
        >
          <PlayCircle className="w-5 h-5 text-neutral-900 group-hover:scale-110 transition-transform" />
          <span>Continuar a explorar</span>
        </button>

        {/* Rodapé Antigravity (Verdade Transparente mas Suave) */}
        <div className="pt-8 border-t border-neutral-800/50">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/50 border border-neutral-800 text-xs text-neutral-500">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Ambiente Local Seguro • Dados não serão salvos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
