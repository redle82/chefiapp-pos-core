interface PaymentsEmptyStateProps {
  title: string;
  description?: string;
}

export function PaymentsEmptyState({ title, description }: PaymentsEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm"
      style={{ minHeight: 240 }}
    >
      <p className="mb-2 text-base font-medium text-gray-900">{title}</p>
      {description && (
        <p className="max-w-md text-sm text-gray-600">{description}</p>
      )}
    </div>
  );
}
