const PROOF_ITEMS = [
  { value: "1", label: "Restaurante em produção", note: "Sofia Gastrobar, Ibiza" },
  { value: "5+", label: "Superfícies integradas", note: "TPV, KDS, Staff, Web, Admin" },
  { value: "3", label: "Idiomas nativos", note: "PT, EN, ES" },
  { value: "24/7", label: "Sistema operacional", note: "Offline-first, sempre disponível" },
] as const;

export function SocialProofBar() {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {PROOF_ITEMS.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-500">
              {item.value}
            </div>
            <div className="text-sm font-medium text-white mt-1">{item.label}</div>
            <div className="text-xs text-white/50 mt-0.5">{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
