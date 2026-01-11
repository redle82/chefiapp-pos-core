/**
 * PortioningDashboard.tsx — Custo Real (Anti-doação Invisível)
 * 
 * UI dedo-único para porcionamento matemático e cálculo de custo real
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { Input } from '../../ui/design-system/primitives/Input';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { useToast } from '../../ui/design-system';
import { CONFIG } from '../../config';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

interface BaseProduct {
  id: string;
  name: string;
  cost_total_cents: number;
  weight_total_g: number;
  loss_percent: number;
  portion_weight_g: number;
  thickness_mm: number;
  currency: string;
  cost_per_gram_cents: number;
  cost_per_portion_cents: number;
  theoretical_portions: number;
  real_portions: number;
}

interface PortioningAlert {
  id: string;
  alert_type: string;
  message: string;
  severity: 'warning' | 'critical';
  base_product_id: string;
  avg_variation_g: number;
  impact_monthly_cents: number;
  impact_yearly_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

export function PortioningDashboard() {
  const { success, error } = useToast();
  const [restaurantId] = useState<string | null>(getTabIsolated('chefiapp_restaurant_id'));
  const [activeTab, setActiveTab] = useState<'products' | 'simulator' | 'alerts'>('products');
  const [products, setProducts] = useState<BaseProduct[]>([]);
  const [alerts, setAlerts] = useState<PortioningAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BaseProduct | null>(null);

  // Simulator state
  const [simulatorError, setSimulatorError] = useState(10);
  const [simulatorMonthlySales, setSimulatorMonthlySales] = useState(1000);
  const [simulatorCostPerGram, setSimulatorCostPerGram] = useState(0.05);
  const [simulatorCurrency, setSimulatorCurrency] = useState('EUR');

  useEffect(() => {
    if (restaurantId) {
      loadData();
    }
  }, [restaurantId]);

  const loadData = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [productsRes, alertsRes] = await Promise.all([
        fetch(`${CONFIG.API_BASE}/api/portioning/base-products?restaurant_id=${restaurantId}`),
        fetch(`${CONFIG.API_BASE}/api/portioning/alerts?restaurant_id=${restaurantId}&status=open`),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error loading portioning data:', err);
      error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const calculateImpact = (errorG: number, monthlySales: number, costPerGramCents: number, currency: string) => {
    const costPerGram = costPerGramCents / 100;
    const impactPerPortion = Math.abs(errorG) * costPerGram;
    const impactMonthly = impactPerPortion * monthlySales;
    const impactYearly = impactMonthly * 12;

    return {
      monthly: formatCurrency(Math.round(impactMonthly * 100), currency),
      yearly: formatCurrency(Math.round(impactYearly * 100), currency),
    };
  };

  const handleSaveProduct = async (product: Partial<BaseProduct>) => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/portioning/base-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          ...product,
          cost_total_cents: Math.round((product.cost_total_cents || 0) * 100), // Convert to cents if needed
        }),
      });

      if (response.ok) {
        success('Produto salvo');
        setShowProductForm(false);
        setEditingProduct(null);
        loadData();
      } else {
        error('Erro ao salvar produto');
      }
    } catch (err) {
      error('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleAckAlert = async (alertId: string) => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/portioning/alerts/${alertId}/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acknowledged_by: 'current_user', // TODO: get from auth
        }),
      });

      if (response.ok) {
        success('Alerta confirmado');
        loadData();
      } else {
        error('Erro ao confirmar alerta');
      }
    } catch (err) {
      error('Erro ao confirmar alerta');
    } finally {
      setLoading(false);
    }
  };

  const simulatorImpact = calculateImpact(
    simulatorError,
    simulatorMonthlySales,
    Math.round(simulatorCostPerGram * 100),
    simulatorCurrency
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
          💰 Custo Real (Anti-doação Invisível)
        </Text>
        <Text color="secondary">
          Porcionamento matemático para recuperar lucro perdido
        </Text>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Button
          onClick={() => setActiveTab('products')}
          variant={activeTab === 'products' ? 'primary' : 'outline'}
          size="sm"
        >
          Peças
        </Button>
        <Button
          onClick={() => setActiveTab('simulator')}
          variant={activeTab === 'simulator' ? 'primary' : 'outline'}
          size="sm"
        >
          Simulador
        </Button>
        <Button
          onClick={() => setActiveTab('alerts')}
          variant={activeTab === 'alerts' ? 'primary' : 'outline'}
          size="sm"
        >
          Alertas {alerts.length > 0 && `(${alerts.length})`}
        </Button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <Card surface="layer1" padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text size="lg" weight="bold" color="primary">
              Peças Base ({products.length})
            </Text>
            <Button onClick={() => { setShowProductForm(true); setEditingProduct(null); }} variant="primary">
              + Nova Peça
            </Button>
          </div>

          {showProductForm && (
            <ProductForm
              product={editingProduct}
              onSave={handleSaveProduct}
              onCancel={() => { setShowProductForm(false); setEditingProduct(null); }}
              currency={simulatorCurrency}
            />
          )}

          {products.length === 0 ? (
            <Text color="secondary">Nenhuma peça cadastrada</Text>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {products.map((product) => (
                <Card key={product.id} surface="layer2" padding="md">
                  <Text weight="bold" size="sm" style={{ marginBottom: 8 }}>{product.name}</Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                    <Text color="secondary">
                      Custo/porção: {formatCurrency(product.cost_per_portion_cents, product.currency)}
                    </Text>
                    <Text color="secondary">
                      Porções reais: {product.real_portions}
                    </Text>
                    <Text color="secondary">
                      Gramatura: {product.portion_weight_g}g / {product.thickness_mm}mm
                    </Text>
                  </div>
                  <Button
                    onClick={() => { setEditingProduct(product); setShowProductForm(true); }}
                    variant="outline"
                    size="sm"
                    style={{ marginTop: 12 }}
                  >
                    Editar
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Simulator Tab */}
      {activeTab === 'simulator' && (
        <Card surface="layer1" padding="lg">
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            Simulador de Impacto
          </Text>
          <Text color="secondary" style={{ marginBottom: 24 }}>
            Simule o impacto de erros de porcionamento no seu custo mensal/anual
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Error buttons */}
            <div>
              <Text weight="bold" size="sm" style={{ marginBottom: 12 }}>Erro de porcionamento:</Text>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  onClick={() => setSimulatorError(10)}
                  variant={simulatorError === 10 ? 'primary' : 'outline'}
                  size="sm"
                >
                  +10g
                </Button>
                <Button
                  onClick={() => setSimulatorError(20)}
                  variant={simulatorError === 20 ? 'primary' : 'outline'}
                  size="sm"
                >
                  +20g
                </Button>
                <Button
                  onClick={() => setSimulatorError(40)}
                  variant={simulatorError === 40 ? 'primary' : 'outline'}
                  size="sm"
                >
                  +40g
                </Button>
              </div>
            </div>

            {/* Monthly sales */}
            <div>
              <Text weight="bold" size="sm" style={{ marginBottom: 8 }}>Vendas mensais:</Text>
              <Input
                type="number"
                value={simulatorMonthlySales}
                onChange={(e) => setSimulatorMonthlySales(parseInt(e.target.value) || 0)}
                placeholder="1000"
                fullWidth
              />
            </div>

            {/* Cost per gram */}
            <div>
              <Text weight="bold" size="sm" style={{ marginBottom: 8 }}>Custo por grama ({simulatorCurrency}):</Text>
              <Input
                type="number"
                step="0.01"
                value={simulatorCostPerGram}
                onChange={(e) => setSimulatorCostPerGram(parseFloat(e.target.value) || 0)}
                placeholder="0.05"
                fullWidth
              />
            </div>

            {/* Results */}
            <Card surface="layer2" padding="md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <Text weight="bold" size="sm" color="error" style={{ marginBottom: 12 }}>
                Impacto Estimado
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <Text size="xs" color="secondary">Por mês:</Text>
                  <Text size="xl" weight="bold" color="error">{simulatorImpact.monthly}</Text>
                </div>
                <div>
                  <Text size="xs" color="secondary">Por ano:</Text>
                  <Text size="2xl" weight="bold" color="error">{simulatorImpact.yearly}</Text>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <Card surface="layer1" padding="lg">
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            Alertas ({alerts.length})
          </Text>

          {alerts.length === 0 ? (
            <Text color="secondary">Nenhum alerta aberto</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAck={() => handleAckAlert(alert.id)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function ProductForm({
  product,
  onSave,
  onCancel,
  currency,
}: {
  product: BaseProduct | null;
  onSave: (product: Partial<BaseProduct>) => void;
  onCancel: () => void;
  currency: string;
}) {
  const [name, setName] = useState(product?.name || '');
  const [costTotal, setCostTotal] = useState(product ? product.cost_total_cents / 100 : 0);
  const [weightTotal, setWeightTotal] = useState(product?.weight_total_g || 0);
  const [lossPercent, setLossPercent] = useState(product?.loss_percent || 0);
  const [portionWeight, setPortionWeight] = useState(product?.portion_weight_g || 0);
  const [thickness, setThickness] = useState(product?.thickness_mm || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: product?.id,
      name,
      cost_total_cents: Math.round(costTotal * 100),
      weight_total_g: weightTotal,
      loss_percent: lossPercent,
      portion_weight_g: portionWeight,
      thickness_mm: thickness,
      currency,
    });
  };

  return (
    <Card surface="layer2" padding="md" style={{ marginBottom: 16 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Nome da peça"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <Input
            label={`Custo total (${currency})`}
            type="number"
            step="0.01"
            value={costTotal}
            onChange={(e) => setCostTotal(parseFloat(e.target.value) || 0)}
            required
            fullWidth
          />
          <Input
            label="Peso total (g)"
            type="number"
            value={weightTotal}
            onChange={(e) => setWeightTotal(parseInt(e.target.value) || 0)}
            required
            fullWidth
          />
          <Input
            label="Perda (%)"
            type="number"
            step="0.1"
            value={lossPercent}
            onChange={(e) => setLossPercent(parseFloat(e.target.value) || 0)}
            fullWidth
          />
          <Input
            label="Gramatura por porção (g)"
            type="number"
            value={portionWeight}
            onChange={(e) => setPortionWeight(parseInt(e.target.value) || 0)}
            required
            fullWidth
          />
          <Input
            label="Espessura (mm)"
            type="number"
            value={thickness}
            onChange={(e) => setThickness(parseInt(e.target.value) || 0)}
            fullWidth
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit" variant="primary">Salvar</Button>
            <Button type="button" onClick={onCancel} variant="outline">Cancelar</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function AlertCard({
  alert,
  onAck,
  formatCurrency,
}: {
  alert: PortioningAlert;
  onAck: () => void;
  formatCurrency: (cents: number, currency: string) => string;
}) {
  return (
    <Card
      surface="layer2"
      padding="md"
      style={{
        borderLeft: `4px solid ${alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <Text weight="bold" size="sm" style={{ marginBottom: 4 }}>{alert.message}</Text>
          <Text size="xs" color="secondary">
            Variação média: {alert.avg_variation_g.toFixed(1)}g
          </Text>
        </div>
        <Badge
          label={alert.severity === 'critical' ? 'Crítico' : 'Aviso'}
          variant={alert.severity === 'critical' ? 'error' : 'warning'}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <Text size="xs" color="secondary">Impacto mensal:</Text>
          <Text weight="bold">{formatCurrency(alert.impact_monthly_cents, alert.currency)}</Text>
        </div>
        <div>
          <Text size="xs" color="secondary">Impacto anual:</Text>
          <Text weight="bold" size="lg" color="error">
            {formatCurrency(alert.impact_yearly_cents, alert.currency)}
          </Text>
        </div>
      </div>
      <Button onClick={onAck} variant="primary" size="sm" fullWidth>
        Confirmar re-treinamento
      </Button>
    </Card>
  );
}

