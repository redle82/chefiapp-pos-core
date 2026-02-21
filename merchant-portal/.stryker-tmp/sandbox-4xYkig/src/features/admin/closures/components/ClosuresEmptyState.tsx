interface ClosuresEmptyStateProps {
  onNewClosure: () => void;
}

export function ClosuresEmptyState({ onNewClosure }: ClosuresEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm"
      style={{ minHeight: 280 }}
    >
      <p className="mb-2 text-base font-medium text-gray-900">
        Nenhum fechamento programado.
      </p>
      <p className="mb-6 max-w-md text-sm text-gray-600">
        Crie um fechamento para evitar reservas ou pedidos em períodos
        específicos.
      </p>
      <button
        type="button"
        onClick={onNewClosure}
        className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
      >
        + Novo cierre temporal
      </button>
    </div>
  );
}
