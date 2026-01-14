/**
 * DeliverooIntegrationWidget — Componente de configuração do Deliveroo
 * 
 * FASE 3: Permite configurar credenciais OAuth e testar conexão
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Input } from '../../../ui/design-system/primitives/Input';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { useToast } from '../../../ui/design-system';
import { getTabIsolated, setTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import { DeliverooAdapter } from '../../../integrations/adapters/deliveroo';

interface DeliverooConfig {
  clientId: string;
  enabled: boolean;
}

export const DeliverooIntegrationWidget: React.FC = () => {
  const { success, error } = useToast();
  const restaurantId = getTabIsolated('chefiapp_restaurant_id');

  const [config, setConfig] = useState<DeliverooConfig>({
    clientId: getTabIsolated('deliveroo_client_id') || '',
    enabled: getTabIsolated('deliveroo_enabled') === 'true',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [adapter, setAdapter] = useState<DeliverooAdapter | null>(null);

  // Carregar status da conexão
  useEffect(() => {
    if (config.clientId && config.enabled && restaurantId) {
      checkConnection();
    }
  }, []);

  const handleSave = async () => {
    try {
      // Salvar no TabIsolatedStorage
      setTabIsolated('deliveroo_client_id', config.clientId);
      setTabIsolated('deliveroo_enabled', config.enabled.toString());

      // Se habilitado, inicializar adapter
      if (config.enabled && config.clientId && restaurantId) {
        await initializeAdapter();
      } else if (adapter) {
        setAdapter(null);
        setIsConnected(false);
      }

      success('Configuração do Deliveroo salva com sucesso!');
    } catch (err) {
      error('Erro ao salvar configuração: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const initializeAdapter = async () => {
    if (!restaurantId) return;

    try {
      const newAdapter = new DeliverooAdapter({
        clientId: config.clientId,
        restaurantId,
      });

      setAdapter(newAdapter);
      const health = await newAdapter.healthCheck();
      setIsConnected(health);
      success('Deliveroo conectado com sucesso!');
    } catch (err) {
      error('Erro ao conectar Deliveroo: ' + (err instanceof Error ? err.message : 'Unknown'));
      setIsConnected(false);
    }
  };

  const checkConnection = async () => {
    if (!adapter) return;

    try {
      const health = await adapter.healthCheck();
      setIsConnected(health);
    } catch (err) {
      setIsConnected(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      if (!config.clientId) {
        error('Preencha Client ID primeiro');
        return;
      }

      await initializeAdapter();
      await checkConnection();

      if (isConnected) {
        success('Conexão com Deliveroo testada com sucesso!');
      } else {
        error('Falha ao conectar com Deliveroo. Verifique as credenciais.');
      }
    } catch (err) {
      error('Erro ao testar conexão: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card surface="base" padding="xl" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
        <div>
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 4 }}>
            🛵 Integração Deliveroo
          </Text>
          <Text size="sm" color="secondary">
            Receba pedidos do Deliveroo diretamente no seu POS
          </Text>
        </div>
        <Badge
          status={isConnected ? 'ready' : 'warning'}
          label={isConnected ? 'Conectado' : 'Desconectado'}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            style={{ width: 20, height: 20, accentColor: '#3b82f6' }}
          />
          <Text size="sm" color="primary">Ativar integração Deliveroo</Text>
        </div>

        {config.enabled && (
          <>
            <Input
              label="Client ID"
              type="text"
              value={config.clientId}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              placeholder="Seu Client ID do Deliveroo"
              fullWidth
            />

            <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, marginTop: 8 }}>
              <Text size="xs" color="tertiary">
                🔒 <strong>TASK-3.1.3:</strong> Client Secret é gerenciado no backend. Não é necessário configurá-lo aqui.
              </Text>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="primary"
                size="md"
                onClick={handleTestConnection}
                disabled={isTesting || !config.clientId}
              >
                {isTesting ? 'Testando...' : 'Testar Conexão'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleSave}
                disabled={!config.clientId}
              >
                Salvar Configuração
              </Button>
            </div>

            {isConnected && (
              <div style={{ padding: 12, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 8, marginTop: 8 }}>
                <Text size="sm" color="success" weight="bold">
                  ✅ Deliveroo conectado! Pedidos serão recebidos automaticamente.
                </Text>
              </div>
            )}

            <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, marginTop: 8 }}>
              <Text size="xs" color="tertiary">
                💡 <strong>Como obter credenciais:</strong> Acesse{' '}
                <a href="https://developer.deliveroo.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                  developer.deliveroo.com
                </a>
                {' '}e crie uma aplicação para obter Client ID. O Client Secret deve ser configurado no backend (variável de ambiente).
              </Text>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
