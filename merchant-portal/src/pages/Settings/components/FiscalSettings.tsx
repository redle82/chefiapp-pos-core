/**
 * FiscalSettings — Componente de configuração fiscal
 * 
 * Permite configurar credenciais InvoiceXpress e testar conexão
 * P0-1 FIX: API key nunca é exposta - salva no backend criptografada
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/design-system/primitives/Card';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Button } from '../../../ui/design-system/primitives/Button';
import { Input } from '../../../ui/design-system/primitives/Input';
import { Badge } from '../../../ui/design-system/primitives/Badge';
import { useToast } from '../../../ui/design-system';
import { supabase } from '../../../core/supabase';
import { getTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import { CONFIG } from '../../../config';

interface FiscalConfig {
  provider: 'invoice_xpress' | 'mock' | 'saft_pt' | 'ticketbai';
  invoicexpress?: {
    apiKey: string;
    accountName: string;
  };
}

export const FiscalSettings: React.FC = () => {
  const { success, error } = useToast();
  const restaurantId = getTabIsolated('chefiapp_restaurant_id');
  const apiBase = CONFIG.API_BASE;

  const [config, setConfig] = useState<FiscalConfig>({
    provider: 'mock',
    invoicexpress: {
      apiKey: '',
      accountName: '',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar configuração existente
  useEffect(() => {
    if (restaurantId) {
      loadFiscalConfig();
    }
  }, [restaurantId]);

  const loadFiscalConfig = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('gm_restaurants')
        .select('fiscal_provider, fiscal_config')
        .eq('id', restaurantId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[FiscalSettings] Error loading config:', fetchError);
        return;
      }

      if (data) {
        const fiscalConfig = (data.fiscal_config as any) || {};
        setConfig({
          provider: (data.fiscal_provider as any) || 'mock',
          invoicexpress: {
            apiKey: fiscalConfig.invoicexpress?.apiKey ? '••••••••' : '',
            accountName: fiscalConfig.invoicexpress?.accountName || '',
          },
        });
        setIsConfigured(!!fiscalConfig.invoicexpress?.apiKey);
      }
    } catch (err) {
      console.error('[FiscalSettings] Failed to load config:', err);
    }
  };

  const handleSave = async () => {
    if (!restaurantId) {
      error('Restaurante não identificado');
      return;
    }

    if (config.provider === 'invoice_xpress') {
      if (!config.invoicexpress?.accountName) {
        error('Account Name é obrigatório');
        return;
      }
      if (!config.invoicexpress?.apiKey || config.invoicexpress.apiKey === '••••••••') {
        error('API Key é obrigatória');
        return;
      }
    }

    setIsSaving(true);
    try {
      // Salvar via backend (API key será criptografada)
      const token = getTabIsolated('x-chefiapp-token') || '';
      const response = await fetch(`${apiBase}/api/restaurants/${restaurantId}/fiscal-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-chefiapp-token': token,
        },
        body: JSON.stringify({
          fiscal_provider: config.provider,
          fiscal_config: {
            invoicexpress: config.provider === 'invoice_xpress' ? {
              accountName: config.invoicexpress.accountName,
              apiKey: config.invoicexpress.apiKey, // Backend criptografa
            } : undefined,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar configuração');
      }

      success('Configuração fiscal salva com sucesso!');
      setIsConfigured(true);
      
      // Recarregar para mostrar API key mascarada
      await loadFiscalConfig();
    } catch (err) {
      error('Erro ao salvar configuração: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!restaurantId || !config.invoicexpress?.accountName) {
      error('Configure Account Name antes de testar');
      return;
    }

    setIsTesting(true);
    try {
      const token = getTabIsolated('x-chefiapp-token') || '';
      const response = await fetch(`${apiBase}/api/fiscal/invoicexpress/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-chefiapp-token': token,
        },
        body: JSON.stringify({
          accountName: config.invoicexpress.accountName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao testar conexão');
      }

      success('Conexão com InvoiceXpress testada com sucesso!');
    } catch (err) {
      error('Erro ao testar conexão: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card surface="base" padding="xl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text size="lg" weight="bold" color="primary">Configuração Fiscal</Text>
            <Text size="sm" color="tertiary" style={{ marginTop: 4 }}>
              Configure credenciais para emissão de faturas fiscais
            </Text>
          </div>
          {isConfigured && (
            <Badge status="ready" label="Configurado" />
          )}
        </div>

        {/* Provider Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Text size="sm" weight="bold" color="secondary">Provedor Fiscal</Text>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="fiscal_provider"
                value="invoice_xpress"
                checked={config.provider === 'invoice_xpress'}
                onChange={() => setConfig({ ...config, provider: 'invoice_xpress' })}
              />
              <Text size="sm">InvoiceXpress (Portugal)</Text>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="fiscal_provider"
                value="mock"
                checked={config.provider === 'mock'}
                onChange={() => setConfig({ ...config, provider: 'mock' })}
              />
              <Text size="sm">Mock (Desenvolvimento)</Text>
            </label>
          </div>
        </div>

        {/* InvoiceXpress Configuration */}
        {config.provider === 'invoice_xpress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Account Name"
              value={config.invoicexpress?.accountName || ''}
              onChange={(e) => setConfig({
                ...config,
                invoicexpress: {
                  ...config.invoicexpress,
                  accountName: e.target.value,
                } as any,
              })}
              placeholder="nome-da-conta"
              fullWidth
              helperText="Nome da sua conta InvoiceXpress (sem .app.invoicexpress.com)"
            />

            <Input
              label="API Key"
              type="password"
              value={config.invoicexpress?.apiKey || ''}
              onChange={(e) => setConfig({
                ...config,
                invoicexpress: {
                  ...config.invoicexpress,
                  apiKey: e.target.value,
                } as any,
              })}
              placeholder={isConfigured ? '••••••••' : 'sua-api-key'}
              fullWidth
              helperText="API Key do InvoiceXpress (será criptografada no servidor)"
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || !config.invoicexpress?.accountName}
                loading={isTesting}
              >
                Testar Conexão
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
                loading={isSaving}
              >
                Salvar Configuração
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div style={{ padding: 16, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <Text size="sm" color="primary" weight="bold" style={{ marginBottom: 8 }}>
            ℹ️ Como obter credenciais InvoiceXpress
          </Text>
          <Text size="xs" color="secondary" style={{ lineHeight: 1.6 }}>
            1. Acesse https://www.invoicexpress.com<br />
            2. Faça login na sua conta<br />
            3. Vá para <strong>Settings → API</strong><br />
            4. Copie a <strong>API Key</strong> e o <strong>Account Name</strong>
          </Text>
        </div>
      </div>
    </Card>
  );
};
