/**
 * GlovoIntegrationWidget — Componente de configuração do Glovo
 * 
 * Permite configurar credenciais OAuth e testar conexão
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Input } from '../../../ui/design-system/primitives/Input';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { useToast } from '../../../ui/design-system';
import { getTabIsolated, setTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import { GlovoAdapter } from '../../../integrations/adapters/glovo';
import { IntegrationRegistry } from '../../../integrations';

interface GlovoConfig {
  clientId: string;
  clientSecret: string;
  enabled: boolean;
}

export const GlovoIntegrationWidget: React.FC = () => {
  const { success, error, info } = useToast();
  const restaurantId = getTabIsolated('chefiapp_restaurant_id');

  const [config, setConfig] = useState<GlovoConfig>({
    clientId: getTabIsolated('glovo_client_id') || '',
    clientSecret: getTabIsolated('glovo_client_secret') || '',
    enabled: getTabIsolated('glovo_enabled') === 'true',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [adapter, setAdapter] = useState<GlovoAdapter | null>(null);

  // Carregar status da conexão
  useEffect(() => {
    if (config.clientId && config.clientSecret && config.enabled) {
      checkConnection();
    }
  }, []);

  const handleSave = async () => {
    try {
      // Salvar no TabIsolatedStorage
      setTabIsolated('glovo_client_id', config.clientId);
      setTabIsolated('glovo_client_secret', config.clientSecret);
      setTabIsolated('glovo_enabled', config.enabled.toString());

      // Se habilitado, inicializar adapter
      if (config.enabled && config.clientId && config.clientSecret) {
        await initializeAdapter();
      } else if (adapter) {
        // Se desabilitado, remover adapter
        await IntegrationRegistry.unregister('glovo');
        setAdapter(null);
        setIsConnected(false);
      }

      success('Configuração do Glovo salva com sucesso!');
    } catch (err) {
      error('Erro ao salvar configuração: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  };

  const initializeAdapter = async () => {
    try {
      const newAdapter = new GlovoAdapter();
      await newAdapter.initialize({
        restaurantId: restaurantId || '',
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        enabled: config.enabled,
      });

      // Registrar no sistema
      await IntegrationRegistry.register(newAdapter);

      setAdapter(newAdapter);
      setIsConnected(true);
      success('Glovo conectado com sucesso!');
    } catch (err) {
      error('Erro ao conectar Glovo: ' + (err instanceof Error ? err.message : 'Unknown'));
      setIsConnected(false);
    }
  };

  const checkConnection = async () => {
    if (!adapter) return;

    try {
      const status = await adapter.healthCheck();
      setIsConnected(status.status === 'healthy' || status.status === 'degraded');
    } catch (err) {
      setIsConnected(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      if (!config.clientId || !config.clientSecret) {
        error('Preencha Client ID e Client Secret primeiro');
        return;
      }

      await initializeAdapter();
      await checkConnection();

      if (isConnected) {
        success('Conexão com Glovo testada com sucesso!');
      } else {
        error('Falha ao conectar com Glovo. Verifique as credenciais.');
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
            🚴 Integração Glovo
          </Text>
          <Text size="sm" color="secondary">
            Receba pedidos do Glovo diretamente no seu POS
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
          <Text size="sm" color="primary">Ativar integração Glovo</Text>
        </div>

        {config.enabled && (
          <>
            <Input
              label="Client ID"
              type="text"
              value={config.clientId}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              placeholder="Seu Client ID do Glovo"
              fullWidth
            />

            <Input
              label="Client Secret"
              type="password"
              value={config.clientSecret}
              onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
              placeholder="Seu Client Secret do Glovo"
              fullWidth
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="primary"
                size="md"
                onClick={handleTestConnection}
                disabled={isTesting || !config.clientId || !config.clientSecret}
              >
                {isTesting ? 'Testando...' : 'Testar Conexão'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleSave}
                disabled={!config.clientId || !config.clientSecret}
              >
                Salvar Configuração
              </Button>
            </div>

            {isConnected && (
              <div style={{ padding: 12, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 8, marginTop: 8 }}>
                <Text size="sm" color="success" weight="bold">
                  ✅ Glovo conectado! Pedidos serão recebidos automaticamente.
                </Text>
              </div>
            )}

            <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, marginTop: 8 }}>
              <Text size="xs" color="tertiary">
                💡 <strong>Como obter credenciais:</strong> Acesse{' '}
                <a href="https://developers.glovoapp.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                  developers.glovoapp.com
                </a>
                {' '}e crie uma aplicação para obter Client ID e Client Secret.
              </Text>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
