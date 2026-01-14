/**
 * PendingExternalIdsPage - Lista de Pedidos Aguardando External ID
 * 
 * Página dedicada para visualizar e gerenciar pedidos fiscais
 * que estão aguardando External ID ou que falharam.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, Clock, XCircle } from 'lucide-react';

interface PendingExternalId {
  id: string;
  order_id: string;
  restaurant_id: string;
  status: string;
  external_id_status: 'PENDING_EXTERNAL_ID' | 'CONFIRMED_EXTERNAL_ID' | 'FAILED_EXTERNAL_ID';
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  last_error_at: string | null;
  created_at: string;
  minutes_since_created: number;
  table_number?: string;
  total_amount?: number;
}

export function PendingExternalIdsPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [pending, setPending] = useState<PendingExternalId[]>([]);
  const [failed, setFailed] = useState<PendingExternalId[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!restaurantId) return;

    setRefreshing(true);
    try {
      const response = await fetch(`/api/fiscal/pending-external-ids?restaurantId=${restaurantId}`, {
        headers: {
          'x-restaurant-id': restaurantId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending external IDs');
      }

      const data = await response.json();
      setPending(data.pending || []);
      setFailed(data.failed || []);
    } catch (error) {
      console.error('[PendingExternalIdsPage] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  const total = pending.length + failed.length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos Fiscais Pendentes</h1>
          <p className="text-gray-600 mt-1">
            {total} pedido{total === 1 ? '' : 's'} aguardando External ID do provedor fiscal
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Pedidos Pendentes */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Aguardando External ID ({pending.length})
            </h2>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pedido</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Mesa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tentativas</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aguardando</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pending.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {item.order_id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.table_number || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.retry_count}/{item.max_retries}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatMinutes(item.minutes_since_created)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      €{(item.total_amount || 0) / 100}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pedidos Falhados */}
      {failed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Falharam após Múltiplas Tentativas ({failed.length})
            </h2>
          </div>
          <div className="bg-red-50 rounded-lg shadow border border-red-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-red-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Pedido</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Mesa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Tentativas</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Último Erro</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-200">
                {failed.map((item) => (
                  <tr key={item.id} className="hover:bg-red-100">
                    <td className="px-4 py-3 text-sm font-mono text-red-900">
                      {item.order_id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-red-800">
                      {item.table_number || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-800">
                      {item.retry_count}/{item.max_retries}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-800 max-w-md truncate">
                      {item.last_error || 'Erro desconhecido'}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-800">
                      €{(item.total_amount || 0) / 100}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-red-100 rounded-lg border border-red-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  Ação Necessária
                </p>
                <p className="text-sm text-red-800 mt-1">
                  Estes pedidos falharam após {failed[0]?.max_retries || 10} tentativas.
                  Verifique as credenciais do provedor fiscal ou entre em contato com o suporte.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {total === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <AlertCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum pedido pendente
          </h3>
          <p className="text-gray-600">
            Todos os pedidos fiscais têm External ID confirmado.
          </p>
        </div>
      )}
    </div>
  );
}
