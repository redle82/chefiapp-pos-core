import { useParams } from "react-router-dom";

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Detalhe do cliente</h1>
        {id && (
          <p className="mt-1 text-sm text-gray-600">
            ID: <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{id}</code>
          </p>
        )}
      </header>
      <p className="text-sm text-gray-600">Em breve.</p>
    </section>
  );
}
