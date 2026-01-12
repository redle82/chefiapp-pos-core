import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../ui/design-system/layouts/AdminLayout';
import { AdminSidebar } from '../../ui/design-system/domain/AdminSidebar';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { Button } from '../../ui/design-system/primitives/Button';
import { Input } from '../../ui/design-system/primitives/Input';
import { useSettingsState } from './useSettingsState';

import { OperationStatusWidget } from './components/OperationStatusWidget'; // Opus 6.0
import { SubscriptionWidget } from './components/SubscriptionWidget';
import { GlovoIntegrationWidget } from './components/GlovoIntegrationWidget';
import { UberEatsIntegrationWidget } from './components/UberEatsIntegrationWidget';
import { DeliverooIntegrationWidget } from './components/DeliverooIntegrationWidget';
import { TableManager } from './TableManager';
import { TableProvider } from '../TPV/context/TableContext';
import { CurrencySettings } from './components/CurrencySettings'; // P5-5
import { VoiceCommandsSettings } from './components/VoiceCommandsSettings'; // P5-8
import { SecuritySettings } from './components/SecuritySettings'; // P5-9
import { LanguageSettings } from './components/LanguageSettings'; // P4-5
import { SocialMediaSettings } from './components/SocialMediaSettings'; // P6-7

// Helper for Section
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Text size="lg" weight="bold" color="primary">{title}</Text>
    {children}
  </div>
);

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { data, actions } = useSettingsState();
  const { restaurant, legal, haccp, certs, supplierSettings, riskLevel } = data;

  return (
    <AdminLayout
      sidebar={<AdminSidebar activePath="/app/settings" onNavigate={navigate} />}
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 64 }}>

          {/* 0. OPERATION STATUS (Opus 6.0) */}
          <OperationStatusWidget />

          {/* 0.1 SUBSCRIPTION PLAN */}
          <Section title="Plano & Faturamento">
            <SubscriptionWidget />
          </Section>

          {/* 1. STATUS HEADER */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Card surface="layer1" padding="lg" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text size="sm" color="tertiary">Status de Risco HACCP</Text>
                <Text size="2xl" weight="black" color={riskLevel === 'HIGH' ? 'destructive' : riskLevel === 'MEDIUM' ? 'warning' : 'success'}>
                  {riskLevel === 'HIGH' ? 'CRÍTICO' : riskLevel === 'MEDIUM' ? 'ATENÇÃO' : 'SEGURO'}
                </Text>
              </div>
              <Badge
                status={riskLevel === 'HIGH' ? 'error' : 'ready'}
                label={riskLevel === 'HIGH' ? 'Ação Necessária' : 'Conforme'}
              />
            </Card>
            <Card surface="layer1" padding="lg" style={{ flex: 1 }}>
              <Text size="sm" color="tertiary">Perfil Legal</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text size="2xl">
                  {legal.country === 'BR' ? '🇧🇷' : legal.country === 'PT' ? '🇵🇹' : '🇪🇸'}
                </Text>
                <Text size="xl" weight="bold" color="primary">
                  {legal.country === 'BR' ? 'Brasil' : legal.country === 'PT' ? 'Portugal' : 'Espanha'}
                </Text>
              </div>
            </Card>
          </div>

          {/* 2. RESTAURANT IDENTITY */}
          <Section title="Identidade do Restaurante">
            <Card surface="base" padding="xl">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <Input
                  label="Nome do Estabelecimento"
                  value={restaurant.name}
                  onChange={(e: any) => actions.updateRestaurant('name', e.target.value)}
                  fullWidth
                />
                <Input
                  label="Telefone"
                  value={restaurant.phone}
                  onChange={(e: any) => actions.updateRestaurant('phone', e.target.value)}
                  fullWidth
                />
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input
                    label="Endereço Completo"
                    value={restaurant.address}
                    onChange={(e: any) => actions.updateRestaurant('address', e.target.value)}
                    fullWidth
                  />
                </div>
              </div>
            </Card>
          </Section>

          {/* 3. HACCP & SECURITY */}
          <Section title="Segurança Alimentar (HACCP)">
            <Card surface="base" padding="xl">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Text size="sm" weight="bold" color="secondary">Cadeia Fria (Cold Chain)</Text>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={haccp.coldChainEnabled}
                      onChange={(e) => actions.updateHaccp('coldChainEnabled', e.target.checked)}
                      style={{ width: 20, height: 20 }}
                    />
                    <Text size="sm" color="primary">Ativar Monitoramento</Text>
                  </div>
                </div>

                <Input
                  label="Temp. Mínima (°C)"
                  type="number"
                  value={haccp.coldChainMinTemp}
                  onChange={(e: any) => actions.updateHaccp('coldChainMinTemp', Number(e.target.value))}
                  fullWidth
                />
                <Input
                  label="Temp. Máxima (°C)"
                  type="number"
                  value={haccp.coldChainMaxTemp}
                  onChange={(e: any) => actions.updateHaccp('coldChainMaxTemp', Number(e.target.value))}
                  fullWidth
                />
              </div>

              <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text size="md" weight="bold" color="primary">Certificados Digitais</Text>
                  <Button tone="neutral" size="sm" variant="outline">Gerenciar Arquivos</Button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {certs.map(cert => (
                    <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #333' }}>
                      <Text size="sm" color="secondary">{cert.name}</Text>
                      <Badge
                        status={cert.status === 'valid' ? 'ready' : cert.status === 'expired' ? 'error' : 'warning'}
                        label={cert.status.toUpperCase()}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Section>

          {/* 4. TABLE MANAGEMENT */}
          <Section title="Gestão de Mesas">
            <TableProvider>
              <TableManager />
            </TableProvider>
          </Section>

          {/* 5. DELIVERY INTEGRATIONS */}
          <Section title="Integrações de Delivery">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <GlovoIntegrationWidget />
              <UberEatsIntegrationWidget />
              <DeliverooIntegrationWidget />
            </div>
          </Section>

          {/* 6. SUPPLIER VISIBILITY */}
          <Section title="Parcerias & Monetização">
            <Card surface="base" padding="xl" style={{ border: '1px solid #059669' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ maxWidth: '70%' }}>
                  <Text size="lg" weight="bold" color="success">Visibilidade de Fornecedores</Text>
                  <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                    Permitir que marcas parceiras (ex: Estrella Galicia) apareçam no menu digital em troca de descontos na fatura.
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={supplierSettings.enabled}
                    onChange={(e) => actions.setSupplierSettings({ ...supplierSettings, enabled: e.target.checked })}
                    style={{ width: 24, height: 24, accentColor: '#059669' }}
                  />
                </div>
              </div>
              {supplierSettings.enabled && (
                <div style={{ marginTop: 16, padding: 12, background: 'rgba(5, 150, 105, 0.1)', borderRadius: 4 }}>
                  <Text size="xs" color="success" weight="bold">PARCEIRO ATIVO: Estrella Galicia (Campanha Verão 2025)</Text>
                </div>
              )}
            </Card>
          </Section>

          {/* P4-5: Language Settings */}
          <Section title="Idioma">
            <LanguageSettings />
          </Section>

          {/* P6-7: Social Media Settings */}
          <Section title="Redes Sociais">
            <SocialMediaSettings />
          </Section>
        </div>
      }
    />
  );
};

export default Settings;
