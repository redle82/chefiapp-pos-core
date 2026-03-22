import { Shield, Lock, Globe, RefreshCw } from "lucide-react";

const BADGES = [
  { icon: Shield, label: "RGPD Compliant", detail: "Dados protegidos na UE" },
  { icon: Lock, label: "Encriptação TLS", detail: "Comunicações seguras" },
  { icon: Globe, label: "RLS Multi-tenant", detail: "Isolamento total por restaurante" },
  { icon: RefreshCw, label: "Actualizações contínuas", detail: "Sem custos extra" },
] as const;

export function TrustBadges({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {BADGES.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.label}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
          >
            <Icon className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-sm font-medium text-white">{badge.label}</div>
              {!compact && (
                <div className="text-xs text-white/50">{badge.detail}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
