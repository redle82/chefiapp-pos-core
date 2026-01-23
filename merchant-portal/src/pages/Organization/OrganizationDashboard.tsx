import { useEffect, useState } from 'react';
import { useCurrency } from '../../core/currency/useCurrency';
import { supabase } from '../../core/supabase';
import { AppShell } from '../../ui/design-system/AppShell';
import { Button } from '../../ui/design-system/Button';
import { Card } from '../../ui/design-system/Card';
import { Text } from '../../ui/design-system/primitives/Text';

interface RestaurantSummary {
  id: string;
  name: string;
  slug: string;
  is_headquarters: boolean;
  total_sales_cents: number;
  active_orders: number;
  status: 'online' | 'offline'; // Mocked for now
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export const OrganizationDashboard = () => {
  const [org, setOrg] = useState<Organization | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      // 1. Get User's Organization (Assuming single org for MVP)
      const { data: orgs, error: orgError } = await supabase
        .from('gm_organizations')
        .select('id, name, slug')
        .limit(1);

      if (orgError) throw orgError;
      if (!orgs || orgs.length === 0) {
        setLoading(false);
        return;
      }

      const activeOrg = orgs[0];
      setOrg(activeOrg);

      // 2. Get Restaurants for this Org
      const { data: rests, error: restError } = await supabase
        .from('gm_restaurants')
        .select(`
          id, name, slug, is_headquarters,
          gm_orders(count, total_cents)
        `)
        .eq('organization_id', activeOrg.id);
        // Note: Deep aggregate queries might be slow, for MVP fetch separate or use RPC if needed
        // For strict MVP, we'll fetch restaurants and real-time stats separately or just list them.

      if (restError) throw restError;

      // Mocking stats for MVP display since complex aggregates need RPC
      const summary: RestaurantSummary[] = rests.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        is_headquarters: r.is_headquarters,
        total_sales_cents: 0, // Placeholder
        active_orders: 0, // Placeholder
        status: 'online'
      }));

      setRestaurants(summary);

    } catch (err) {
      console.error('Failed to load org data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AppShell>Loading Enterprise View...</AppShell>;

  if (!org) return (
    <AppShell>
      <div className="p-8 text-center">
        <Text variant="h1">Nenhuma Organização Encontrada</Text>
        <Text>Este recurso é para redes de restaurantes.</Text>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Text variant="h2" className="text-gray-900">{org.name}</Text>
            <Text className="text-gray-500">Enterprise Dashboard</Text>
          </div>
          <div className="space-x-2">
            <Button variant="outline">Configurações da Rede</Button>
            <Button variant="primary">Novo Restaurante</Button>
          </div>
        </div>

        {/* Aggregate Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <Text className="text-gray-500 text-sm">Vendas Hoje (Rede)</Text>
            <Text variant="h2" className="text-emerald-600">{formatAmount(0)}</Text>
          </Card>
          <Card className="p-4">
            <Text className="text-gray-500 text-sm">Restaurantes Ativos</Text>
            <Text variant="h2">{restaurants.length}</Text>
          </Card>
          <Card className="p-4">
            <Text className="text-gray-500 text-sm">Ticket Médio (Rede)</Text>
            <Text variant="h2">{formatAmount(0)}</Text>
          </Card>
        </div>

        {/* Restaurants List */}
        <div className="bg-white rounded-lg shadowoverflow-hidden border border-gray-100">
           <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between">
              <Text variant="h4">Unidades Operacionais</Text>
           </div>
           <div className="divide-y divide-gray-100">
              {restaurants.map(r => (
                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                   <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${r.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <Text variant="h4" className="m-0">{r.name}</Text>
                          {r.is_headquarters && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Matriz</span>}
                        </div>
                        <Text className="text-sm text-gray-400">slug: {r.slug}</Text>
                      </div>
                   </div>

                   <div className="flex items-center space-x-8">
                      <div className="text-right">
                         <Text className="text-xs text-gray-400 uppercase">Vendas</Text>
                         <Text className="font-mono">{formatAmount(r.total_sales_cents)}</Text>
                      </div>
                      <div className="text-right">
                         <Text className="text-xs text-gray-400 uppercase">Pedidos</Text>
                         <Text className="font-mono">{r.active_orders}</Text>
                      </div>
                      <Button size="sm" variant="ghost">Acessar &rarr;</Button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </AppShell>
  );
};
