import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppShell,
  TruthBadge,
  cn,
} from '../../ui/design-system';
import { Button } from '../../ui/design-system/Button';
import { Card } from '../../ui/design-system/Card';
import { Colors, Spacing } from '../../ui/design-system/tokens';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';
import './Home.css';

interface MerchantState {
  id: string;
  name: string;
  state: 'ghost' | 'live';
  slug?: string;
  setupProgress?: {
    identity: boolean;
    slug: boolean;
    menu: boolean;
    payments: boolean;
  };
  todayKPIs?: {
    orders: number;
    revenue: number;
    fairness: 'ok' | 'warning' | 'critical';
    compliance: 'ok' | 'warning' | 'critical';
  };
}

/**
 * Home: Merchant portal dashboard
 * - Ghost state: Setup checklist + next action
 * - Live state: Today's KPIs + quick actions
 */
export const Home: React.FC = () => {
  const navigate = useNavigate();

  // Hydrate from Identity (TabIsolatedStorage for now, pending API)
  const [merchant] = useState<MerchantState>(() => {
    const name = getTabIsolated('chefiapp_name') || 'Seu Restaurante';
    const slug = getTabIsolated('chefiapp_slug');
    const published = getTabIsolated('chefiapp_evt_published') === 'true';

    return {
      id: getTabIsolated('chefiapp_restaurant_id') || 'new-merchant',
      name,
      state: published ? 'live' : 'ghost',
      slug: slug || undefined,
      setupProgress: {
        identity: !!name,
        slug: !!slug,
        menu: getTabIsolated('chefiapp_evt_menu_done') === '1',
        payments: getTabIsolated('chefiapp_evt_payments_done') === '1',
      },
      todayKPIs: {
        orders: 0,
        revenue: 0,
        fairness: 'ok',
        compliance: 'ok',
      },
    };
  });

  return (
    <AppShell>
      <div className="home">
        {merchant.state === 'ghost' ? (
          <HomeGhost merchant={merchant} onNavigate={navigate} />
        ) : (
          <HomeLive merchant={merchant} onNavigate={navigate} />
        )}
      </div>
    </AppShell>
  );
};

/**
 * Ghost State: Setup in progress
 */
const HomeGhost: React.FC<{
  merchant: MerchantState;
  onNavigate: (path: string) => void;
}> = ({ merchant, onNavigate }) => {
  const progress = merchant.setupProgress || {
    identity: false,
    slug: false,
    menu: false,
    payments: false,
  };
  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = Object.keys(progress).length;
  const nextAction = !progress.identity
    ? 'identity'
    : !progress.slug
      ? 'slug'
      : !progress.menu
        ? 'menu'
        : !progress.payments
          ? 'payments'
          : 'publish';

  const nextActionLabels: Record<string, string> = {
    identity: 'Completar Identidade',
    slug: 'Definir URL',
    menu: 'Adicionar Cardápio',
    payments: 'Escolher Pagamentos',
    publish: 'Publicar',
  };

  return (
    <div className="home__container">
      {/* Header */}
      <div className="home__header">
        <h1 className="home__title">Bem-vindo ao ChefIApp</h1>
        <div className="home__badge">
          <TruthBadge state="ghost" showLabel={true} />
          <span className="home__badge-text">Em configuração</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="home__grid">
        {/* State card */}
        <Card padding="lg" className="home__card">
          <div className="home__card-header">
            <h2 className="home__card-title">Estado do Setup</h2>
            <span className="home__progress">
              {completedCount}/{totalCount}
            </span>
          </div>

          <div className="home__progress-bar">
            <div
              className="home__progress-fill"
              style={{
                width: `${(completedCount / totalCount) * 100}%`,
              }}
            />
          </div>

          {/* Checklist */}
          <div className="home__checklist">
            {[
              { key: 'identity', label: 'Identidade do Restaurante' },
              { key: 'slug', label: 'URL Pública' },
              { key: 'menu', label: 'Cardápio (5+ itens)' },
              { key: 'payments', label: 'Método de Pagamento' },
            ].map((item) => (
              <div key={item.key} className="home__checklist-item">
                <span
                  className={cn('home__checklist-icon', {
                    'home__checklist-icon--done':
                      progress[item.key as keyof typeof progress],
                  })}
                >
                  {progress[item.key as keyof typeof progress] ? '✓' : '○'}
                </span>
                <span className="home__checklist-label">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Next action card */}
        <Card padding="lg" className="home__card">
          <div className="home__card-header">
            <h2 className="home__card-title">Próxima Ação</h2>
          </div>

          <div className="home__next-action">
            <div className="home__next-action-emoji">👉</div>
            <h3 className="home__next-action-title">
              {nextActionLabels[nextAction]}
            </h3>
            <p className="home__next-action-description">
              {nextAction === 'identity' &&
                'Comece com o nome e descrição do seu restaurante.'}
              {nextAction === 'slug' &&
                'Escolha um URL único. Seus clientes usarão para acessar.'}
              {nextAction === 'menu' &&
                'Adicione pelo menos 5 itens no cardápio.'}
              {nextAction === 'payments' &&
                'Escolha entre pagamentos online ou apenas dinheiro.'}
              {nextAction === 'publish' &&
                'Tudo pronto! Publique para ficar visível.'}
            </p>
          </div>

          <Button
            fullWidth={true}
            onClick={() => onNavigate(`/start/${nextAction}`)}
          >
            Continuar →
          </Button>
        </Card>

        {/* Impact card */}
        <Card padding="lg" className="home__card home__card--impact">
          <div className="home__card-header">
            <h2 className="home__card-title">Impacto de Publicar</h2>
          </div>

          <div className="home__impact">
            <div className="home__impact-item">
              <span className="home__impact-icon">🌐</span>
              <div className="home__impact-content">
                <h4>Link Público</h4>
                <p>chefidapp.app/@{merchant.slug || 'seu-slug'}</p>
              </div>
            </div>

            <div className="home__impact-item">
              <span className="home__impact-icon">🛒</span>
              <div className="home__impact-content">
                <h4>TPV Ativado</h4>
                <p>Pedidos disponiveis apos publicar</p>
              </div>
            </div>

            <div className="home__impact-item">
              <span className="home__impact-icon">👥</span>
              <div className="home__impact-content">
                <h4>AppStaff Pronto</h4>
                <p>Equipe pode iniciar apos publicar</p>
              </div>
            </div>

            <div className="home__impact-item">
              <span className="home__impact-icon">📊</span>
              <div className="home__impact-content">
                <h4>Analytics</h4>
                <p>Métricas em tempo real (Beta)</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

/**
 * Live State: Active restaurant
 */
const HomeLive: React.FC<{
  merchant: MerchantState;
  onNavigate: (path: string) => void;
}> = ({ merchant, onNavigate }) => {
  const kpis = merchant.todayKPIs || {
    orders: 0,
    revenue: 0,
    fairness: 'ok' as const,
    compliance: 'ok' as const,
  };

  return (
    <div className="home__container">
      {/* Header */}
      <div className="home__header">
        <h1 className="home__title">{merchant.name}</h1>
        <div className="home__badge">
          <TruthBadge state="live" showLabel={true} />
          <span className="home__badge-text">
            Publicado • chefidapp.app/@{merchant.slug}
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="home__quick-actions">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onNavigate('/app/tpv')}
        >
          → Ir para TPV
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onNavigate(`/setup/identity`)}
        >
          ⚙️ Editar
        </Button>
      </div>

      {/* Main grid */}
      <div className="home__grid">
        {/* KPI cards */}
        <Card padding="lg" className="home__card home__card--kpi">
          <div className="home__kpi">
            <span className="home__kpi-icon">📦</span>
            <div className="home__kpi-content">
              <h3 className="home__kpi-label">Pedidos Hoje</h3>
              <div className="home__kpi-value">{kpis.orders}</div>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="home__card home__card--kpi">
          <div className="home__kpi">
            <span className="home__kpi-icon">💰</span>
            <div className="home__kpi-content">
              <h3 className="home__kpi-label">Receita Hoje</h3>
              <div className="home__kpi-value">
                R$ {kpis.revenue.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="home__card home__card--kpi">
          <div className="home__kpi">
            <span
              className={cn('home__kpi-icon', {
                'home__kpi-icon--warning': kpis.fairness !== 'ok',
              })}
            >
              ⚖️
            </span>
            <div className="home__kpi-content">
              <h3 className="home__kpi-label">Fairness</h3>
              <div className="home__kpi-value">
                {kpis.fairness === 'ok' ? '✓ OK' : '⚠ Verificar'}
              </div>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="home__card home__card--kpi">
          <div className="home__kpi">
            <span
              className={cn('home__kpi-icon', {
                'home__kpi-icon--warning': kpis.compliance !== 'ok',
              })}
            >
              ✓
            </span>
            <div className="home__kpi-content">
              <h3 className="home__kpi-label">Compliance</h3>
              <div className="home__kpi-value">
                {kpis.compliance === 'ok' ? 'OK' : 'Atenção'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Status sections */}
      <div className="home__sections">
        {/* TPV Status */}
        <Card padding="lg">
          <h3 className="home__section-title">TPV & Pedidos</h3>
          <p style={{ marginBottom: Spacing.md, color: Colors.neutral[500] }}>
            Sua caixa está ativo. Clientes podem fazer pedidos em tempo real.
          </p>
          <Button
            size="sm"
            onClick={() => onNavigate('/app/tpv')}
          >
            Abrir TPV
          </Button>
        </Card>

        {/* Team Status */}
        <Card padding="lg">
          <h3 className="home__section-title">Equipe</h3>
          <p style={{ marginBottom: Spacing.md, color: Colors.neutral[500] }}>
            Sua equipe pode fazer check-in e acompanhar tarefas no AppStaff.
          </p>
          <Button
            size="sm"
            onClick={() => onNavigate('/app/staff')}
          >
            AppStaff
          </Button>
        </Card>

        {/* Settings */}
        <Card padding="lg">
          <h3 className="home__section-title">Configurações</h3>
          <p style={{ marginBottom: Spacing.md, color: Colors.neutral[500] }}>
            Edite cardápio, horários, aparência e mais.
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onNavigate('/app/setup/menu')}
          >
            Setup
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Home;
