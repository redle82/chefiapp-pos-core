// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDockerCoreFetchClient } from "../../../../core/infra/dockerCoreFetchClient";

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points_balance: number;
  total_spend_cents: number;
  visit_count: number;
  last_visit_at: string | null;
  created_at: string;
}

interface LoyaltyLog {
  id: string;
  points_amount: number;
  description: string | null;
  created_at: string;
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [logs, setLogs] = useState<LoyaltyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const core = getDockerCoreFetchClient();

    (async () => {
      setLoading(true);
      setError(null);

      const { data: cust, error: custErr } = await core
        .from("gm_customers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (custErr || !cust) {
        setError("Cliente não encontrado.");
        setLoading(false);
        return;
      }

      setCustomer(cust as CustomerDetail);

      const { data: logData } = await core
        .from("gm_loyalty_logs")
        .select("id,points_amount,description,created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      setLogs((logData as LoyaltyLog[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <section className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </section>
    );
  }

  if (error || !customer) {
    return (
      <section className="flex flex-col gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-orange-600 hover:underline"
        >
          ← Voltar
        </button>
        <p className="text-sm text-red-600">{error || "Erro desconhecido."}</p>
      </section>
    );
  }

  const totalSpent = (customer.total_spend_cents / 100).toFixed(2);
  const tierLabel =
    customer.points_balance >= 500
      ? "Platinum"
      : customer.points_balance >= 100
      ? "Gold"
      : "Silver";
  const tierColor =
    tierLabel === "Platinum"
      ? "text-purple-600"
      : tierLabel === "Gold"
      ? "text-yellow-600"
      : "text-gray-500";

  return (
    <section className="flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="self-start text-sm text-orange-600 hover:underline"
      >
        ← Voltar à lista
      </button>

      {/* Header */}
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-xl font-bold text-orange-700">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.phone}</p>
          {customer.email && (
            <p className="text-xs text-gray-400">{customer.email}</p>
          )}
        </div>
        <span
          className={`ml-auto rounded-full border px-3 py-1 text-xs font-semibold ${tierColor}`}
        >
          {tierLabel}
        </span>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard label="Pontos" value={String(customer.points_balance)} />
        <KPICard label="Visitas" value={String(customer.visit_count)} />
        <KPICard label="Total gasto" value={`€${totalSpent}`} />
        <KPICard
          label="Última visita"
          value={
            customer.last_visit_at
              ? new Date(customer.last_visit_at).toLocaleDateString("pt")
              : "—"
          }
        />
      </div>

      {/* Loyalty Log */}
      <div>
        <h2 className="mb-2 text-lg font-semibold text-gray-800">
          Histórico de pontos
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum registo de pontos.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm text-gray-700">
                    {log.description || "—"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString("pt")}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm font-semibold ${
                    log.points_amount >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {log.points_amount >= 0 ? "+" : ""}
                  {log.points_amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <p className="text-xs text-gray-300">
        Criado em {new Date(customer.created_at).toLocaleDateString("pt")} · ID:{" "}
        {customer.id}
      </p>
    </section>
  );
}

function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
