import { AlertTriangle, RefreshCw, ArrowRight, HelpCircle } from "lucide-react";
import type { RecoveryDiagnosis } from "../../core/recovery/RecoveryEngine";

interface RecoveryBannerProps {
  diagnosis: RecoveryDiagnosis;
  onRetry?: () => void;
  onResume?: () => void;
  onSupport?: () => void;
}

const SEVERITY_STYLES = {
  info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  critical: "bg-red-500/10 border-red-500/30 text-red-300",
};

const SEVERITY_ICON_STYLES = {
  info: "text-blue-400",
  warning: "text-amber-400",
  critical: "text-red-400",
};

export default function RecoveryBanner({
  diagnosis,
  onRetry,
  onResume,
  onSupport,
}: RecoveryBannerProps) {
  if (!diagnosis.isRecoveryNeeded) return null;

  const styles = SEVERITY_STYLES[diagnosis.severity];
  const iconStyle = SEVERITY_ICON_STYLES[diagnosis.severity];

  return (
    <div className={`rounded-xl border p-4 mb-6 ${styles}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${iconStyle}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{diagnosis.suggestedMessage}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {diagnosis.retryable && diagnosis.action === "retry_commissioning" && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tentar novamente
              </button>
            )}
            {diagnosis.retryable && diagnosis.action === "retry_install" && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retomar instalacao
              </button>
            )}
            {diagnosis.action === "resume_setup" && onResume && (
              <button
                onClick={onResume}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Continuar setup
              </button>
            )}
            {onSupport && (
              <button
                onClick={onSupport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Contactar suporte
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
