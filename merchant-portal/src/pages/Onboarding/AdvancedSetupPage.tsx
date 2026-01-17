import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../core/supabase';
import { useTenant } from '../../core/tenant/TenantContext';
import { useKernel } from '../../core/kernel/KernelContext';
import { Text } from '../../ui/design-system/primitives/Text';
import { Badge } from '../../ui/design-system/primitives/Badge';

type SetupStatus = 'not_started' | 'quick_done' | 'advanced_in_progress' | 'advanced_done';

type FormState = {
  brandPrimary: string;
  brandAccent: string;
  siteEnabled: boolean;
  siteTemplate: string;
  siteDomain: string;
  posMode: 'counter' | 'tables' | 'hybrid';
  tablesEnabled: boolean;
  tablesCount: number;
  qrEnabled: boolean;
  qrStyle: string;
  deliveryEnabled: boolean;
  deliveryChannels: string;
  hardwareProfile: string;
};

export const AdvancedSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const { status: kernelStatus, isReady: kernelReady } = useKernel();
  const [state, setState] = useState<FormState>({
    brandPrimary: '#0b0b0c',
    brandAccent: '#32d74b',
    siteEnabled: false,
    siteTemplate: 'hero',
    siteDomain: '',
    posMode: 'counter',
    tablesEnabled: false,
    tablesCount: 10,
    qrEnabled: false,
    qrStyle: 'default',
    deliveryEnabled: false,
    deliveryChannels: '',
    hardwareProfile: '{"printer":""}',
  });

  const [setupStatus, setSetupStatus] = useState<SetupStatus>('not_started');
  const [advancedProgress, setAdvancedProgress] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const restaurantId = tenantId; // Use TenantContext as source of truth

  useEffect(() => {
    const load = async () => {
      // Wait for tenant to be resolved - don't do anything while loading
      if (tenantLoading) {
        return;
      }

      // Don't redirect - let FlowGate handle authentication/tenant resolution
      // If tenant is not available, FlowGate will redirect appropriately
      if (!restaurantId) {
        console.warn('[AdvancedSetupPage] No tenantId available - FlowGate should handle this');
        setError('Restaurante não encontrado. Aguarde o carregamento...');
        setLoading(false);
        return;
      }
      // Try specific fields first, fallback to * if schema mismatch
      let data: Record<string, unknown> | null = null;
      
      const specificFields = 'brand_theme, site_enabled, site_template, site_domain, site_status, pos_mode, tables_enabled, tables_count, qr_enabled, qr_style, delivery_enabled, delivery_channels, hardware_profile, setup_status, advanced_progress';
      
      const { data: specificData, error: specificError } = await supabase
        .from('gm_restaurants')
        .select(specificFields)
        .eq('id', restaurantId)
        .single();

      if (specificError && (specificError.code === 'PGRST116' || specificError.code?.startsWith('PGRST'))) {
        // Schema mismatch - try with * instead
        console.warn('[AdvancedSetupPage] Schema mismatch detected, falling back to * select:', specificError);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('gm_restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();
        
        if (fallbackError || !fallbackData) {
          setError('Não foi possível carregar suas configurações. Verifique o schema da tabela gm_restaurants.');
          setLoading(false);
          return;
        }
        data = fallbackData;
      } else if (specificError || !specificData) {
        setError('Não foi possível carregar suas configurações.');
        setLoading(false);
        return;
      } else {
        data = specificData;
      }

      // Defensive access - fields may not exist in schema
      if (!data) {
        setError('Não foi possível carregar suas configurações.');
        setLoading(false);
        return;
      }

      // Type assertion: data is guaranteed non-null after check above
      const restaurantData = data as Record<string, unknown>;
      const brandTheme = (restaurantData.brand_theme || {}) as Record<string, string>;
      setState((prev) => ({
        ...prev,
        brandPrimary: (brandTheme?.primary as string) || prev.brandPrimary,
        brandAccent: (brandTheme?.accent as string) || prev.brandAccent,
        siteEnabled: Boolean(restaurantData.site_enabled ?? false),
        siteTemplate: (restaurantData.site_template as string) || prev.siteTemplate,
        siteDomain: (restaurantData.site_domain as string) || '',
        posMode: ((restaurantData.pos_mode as string) || 'counter') as 'counter' | 'tables' | 'hybrid',
        tablesEnabled: Boolean(restaurantData.tables_enabled ?? false),
        tablesCount: Number(restaurantData.tables_count) || prev.tablesCount,
        qrEnabled: Boolean(restaurantData.qr_enabled ?? false),
        qrStyle: (restaurantData.qr_style as string) || prev.qrStyle,
        deliveryEnabled: Boolean(restaurantData.delivery_enabled ?? false),
        deliveryChannels: Array.isArray(restaurantData.delivery_channels)
          ? restaurantData.delivery_channels.join(', ')
          : (typeof restaurantData.delivery_channels === 'string' ? restaurantData.delivery_channels : ''),
        hardwareProfile: JSON.stringify(restaurantData.hardware_profile || { printer: '' }, null, 2),
      }));

      setSetupStatus((restaurantData.setup_status as SetupStatus) || 'not_started');
      setAdvancedProgress((restaurantData.advanced_progress as Record<string, unknown>) || {});
      setLoading(false);
    };

    load();
  }, [navigate, restaurantId, tenantLoading]);

  const save = async (opts?: { markDone?: boolean }) => {
    if (!restaurantId) return;
    setSaving(true);
    setError(null);

    try {
      const parsedHardware = safeParseJSON(state.hardwareProfile, {});
      const deliveryChannels = state.deliveryEnabled
        ? state.deliveryChannels.split(',').map((c) => c.trim()).filter(Boolean)
        : [];

      const payload = {
        brand_theme: { primary: state.brandPrimary, accent: state.brandAccent },
        site_enabled: state.siteEnabled,
        site_template: state.siteTemplate,
        site_domain: state.siteDomain || null,
        site_status: state.siteEnabled ? 'queued' : 'off',
        pos_mode: state.posMode,
        tables_enabled: state.tablesEnabled,
        tables_count: state.tablesEnabled ? state.tablesCount : null,
        qr_enabled: state.qrEnabled,
        qr_style: state.qrStyle || null,
        delivery_enabled: state.deliveryEnabled,
        delivery_channels: deliveryChannels,
        hardware_profile: parsedHardware,
      };

      const { data, error: rpcError } = await supabase.rpc('update_advanced_setup', {
        p_restaurant_id: restaurantId,
        p_payload: payload,
        p_step: 'advanced_setup',
        p_mark_done: opts?.markDone ?? false,
      });

      if (rpcError) throw rpcError;

      setAdvancedProgress((data as Record<string, unknown>) || {});
      setSetupStatus(opts?.markDone ? 'advanced_done' : 'advanced_in_progress');

      // Trigger provisioning pipeline (idempotent)
      await supabase.functions.invoke('advanced-provisioner', {
        body: { restaurant_id: restaurantId },
      });
    } catch (err: unknown) {
      console.error('[AdvancedSetup] Save failed', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao salvar.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Show loading while tenant is being resolved or data is loading
  if (tenantLoading || loading) {
    return (
      <div style={pageStyle}>Carregando...</div>
    );
  }

  // If no tenant after loading, show error instead of redirecting immediately
  // (redirect happens in useEffect, but we need to show something while it processes)
  if (!restaurantId) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text size="lg" weight="bold" color="destructive">Erro: Restaurante não encontrado</Text>
          <Text size="sm" color="secondary" style={{ marginTop: 16 }}>
            Redirecionando para autenticação...
          </Text>
        </div>
      </div>
    );
  }

  // Kernel state messages
  const getKernelStatusMessage = () => {
    switch (kernelStatus) {
      case 'READY':
        return { text: 'Sistema pronto', color: '#32d74b', bg: 'rgba(50, 215, 75, 0.1)' };
      case 'BOOTING':
        return { text: 'Sistema inicializando...', color: '#ff9500', bg: 'rgba(255, 149, 0, 0.1)' };
      case 'FROZEN':
        return { text: 'Sistema em modo de estabilização', color: '#5e5ce6', bg: 'rgba(94, 92, 230, 0.1)' };
      case 'FAILED':
        return { text: 'Erro no sistema', color: '#ff453a', bg: 'rgba(255, 69, 58, 0.1)' };
      default:
        return { text: 'Estado desconhecido', color: '#8e8e93', bg: 'rgba(142, 142, 147, 0.1)' };
    }
  };

  const kernelStatusInfo = getKernelStatusMessage();
  const isSystemReady = kernelReady && kernelStatus === 'READY';

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 960, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Kernel Status Indicator */}
        <div style={{
          padding: '12px 16px',
          background: kernelStatusInfo.bg,
          border: `1px solid ${kernelStatusInfo.color}40`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: kernelStatusInfo.color
            }} />
            <Text size="sm" weight="medium" style={{ color: kernelStatusInfo.color }}>
              {kernelStatusInfo.text}
            </Text>
            {!isSystemReady && (
              <Text size="xs" color="secondary" style={{ marginLeft: 8 }}>
                Algumas configurações ficarão disponíveis em instantes.
              </Text>
            )}
          </div>
          <Badge 
            status={kernelStatus === 'READY' ? 'ready' : kernelStatus === 'FAILED' ? 'error' : 'warning'}
            label={kernelStatus}
          />
        </div>

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}>Configuração Avançada</h1>
            <p style={{ color: '#666', margin: '4px 0' }}>Configure parâmetros operacionais do restaurante.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#555', padding: '6px 10px', background: '#f3f4f6', borderRadius: 8 }}>
              Status: {setupStatus}
            </span>
            <button
              onClick={() => save({ markDone: true })}
              disabled={saving || !isSystemReady}
              title={!isSystemReady ? 'Disponível quando o sistema estiver pronto' : undefined}
              style={{
                ...primaryButton,
                opacity: (!isSystemReady || saving) ? 0.5 : 1,
                cursor: (!isSystemReady || saving) ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Salvando...' : 'Marcar como concluído'}
            </button>
          </div>
        </header>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        <section style={cardStyle}>
          <SectionHeader title="Identidade" subtitle="Cores e tema serão usados em web e TPV" />
          <div style={gridTwo}>
            <LabeledInput label="Cor Primária" value={state.brandPrimary} onChange={(v) => setState({ ...state, brandPrimary: v })} />
            <LabeledInput label="Cor de Destaque" value={state.brandAccent} onChange={(v) => setState({ ...state, brandAccent: v })} />
          </div>
          <button 
            onClick={() => save()} 
            disabled={saving || !isSystemReady}
            title={!isSystemReady ? 'Disponível quando o sistema estiver pronto' : undefined}
            style={{
              ...ghostButton,
              opacity: (!isSystemReady || saving) ? 0.5 : 1,
              cursor: (!isSystemReady || saving) ? 'not-allowed' : 'pointer'
            }}
          >
            Salvar identidade
          </button>
        </section>

        <section style={cardStyle}>
          <SectionHeader title="Site" subtitle="Provisionamento é automático e idempotente" />
          <ToggleRow
            label="Ativar site"
            checked={state.siteEnabled}
            onChange={(checked) => setState({ ...state, siteEnabled: checked })}
          />
          <div style={gridTwo}>
            <LabeledInput label="Template" value={state.siteTemplate} onChange={(v) => setState({ ...state, siteTemplate: v })} />
            <LabeledInput label="Dominio" value={state.siteDomain} onChange={(v) => setState({ ...state, siteDomain: v })} placeholder="opcional" />
          </div>
          <button 
            onClick={() => save()} 
            disabled={saving || !isSystemReady}
            title={!isSystemReady ? 'Disponível quando o sistema estiver pronto' : undefined}
            style={{
              ...ghostButton,
              opacity: (!isSystemReady || saving) ? 0.5 : 1,
              cursor: (!isSystemReady || saving) ? 'not-allowed' : 'pointer'
            }}
          >
            Salvar site
          </button>
        </section>

        <section style={cardStyle}>
          <SectionHeader title="Operação" subtitle="Modo de TPV e mesas" />
          <div style={gridThree}>
            <SelectField
              label="Modo do TPV"
              value={state.posMode}
              onChange={(v) => setState({ ...state, posMode: v as FormState['posMode'] })}
              options={[
                { value: 'counter', label: 'Balcão' },
                { value: 'tables', label: 'Mesas' },
                { value: 'hybrid', label: 'Híbrido' },
              ]}
            />
            <ToggleRow
              label="Ativar Mesas"
              checked={state.tablesEnabled}
              onChange={(checked) => setState({ ...state, tablesEnabled: checked })}
            />
            <LabeledInput
              label="Quantidade de mesas"
              type="number"
              value={String(state.tablesCount)}
              onChange={(v) => setState({ ...state, tablesCount: Number(v) || 0 })}
              disabled={!state.tablesEnabled}
            />
          </div>
          <ToggleRow
            label="Menu QR"
            checked={state.qrEnabled}
            onChange={(checked) => setState({ ...state, qrEnabled: checked })}
          />
          <LabeledInput
            label="Estilo do QR"
            value={state.qrStyle}
            onChange={(v) => setState({ ...state, qrStyle: v })}
            disabled={!state.qrEnabled}
          />
          <button 
            onClick={() => save()} 
            disabled={saving || !isSystemReady}
            title={!isSystemReady ? 'Disponível quando o sistema estiver pronto' : undefined}
            style={{
              ...ghostButton,
              opacity: (!isSystemReady || saving) ? 0.5 : 1,
              cursor: (!isSystemReady || saving) ? 'not-allowed' : 'pointer'
            }}
          >
            Salvar operação
          </button>
        </section>

        <section style={cardStyle}>
          <SectionHeader title="Delivery" subtitle="Canais externos ou próprio" />
          <ToggleRow
            label="Ativar delivery"
            checked={state.deliveryEnabled}
            onChange={(checked) => setState({ ...state, deliveryEnabled: checked })}
          />
          <LabeledInput
            label="Canais (separados por vírgula)"
            value={state.deliveryChannels}
            onChange={(v) => setState({ ...state, deliveryChannels: v })}
            placeholder="ex: ifood, rappi"
            disabled={!state.deliveryEnabled}
          />
          <button 
            onClick={() => save()} 
            disabled={saving || !isSystemReady}
            title={!isSystemReady ? 'Disponível quando o sistema estiver pronto' : undefined}
            style={{
              ...ghostButton,
              opacity: (!isSystemReady || saving) ? 0.5 : 1,
              cursor: (!isSystemReady || saving) ? 'not-allowed' : 'pointer'
            }}
          >
            Salvar delivery
          </button>
        </section>

        <section style={cardStyle}>
          <SectionHeader title="Hardware" subtitle="Salva direto no banco para provisionamento" />
          <textarea
            value={state.hardwareProfile}
            onChange={(e) => setState({ ...state, hardwareProfile: e.target.value })}
            rows={6}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', fontFamily: 'monospace' }}
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button 
              onClick={() => save()} 
              disabled={saving || !isSystemReady}
              title={!isSystemReady ? 'Disponível quando o sistema estiver pronto' : undefined}
              style={{
                ...ghostButton,
                opacity: (!isSystemReady || saving) ? 0.5 : 1,
                cursor: (!isSystemReady || saving) ? 'not-allowed' : 'pointer'
              }}
            >
              Salvar hardware
            </button>
            <button 
              onClick={() => save({ markDone: true })} 
              disabled={saving || !isSystemReady}
              title={!isSystemReady ? 'Disponível quando o sistema estiver pronto' : undefined}
              style={{
                ...primaryButton,
                opacity: (!isSystemReady || saving) ? 0.5 : 1,
                cursor: (!isSystemReady || saving) ? 'not-allowed' : 'pointer'
              }}
            >
              Concluir onboarding
            </button>
          </div>
        </section>

        <section style={cardStyle}>
          <SectionHeader title="Progresso" subtitle="Fonte única de verdade no banco" />
          <pre style={{ background: '#0b0b0c', color: '#32d74b', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(advancedProgress, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: '32px 20px',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
};

const errorStyle: React.CSSProperties = {
  background: 'rgba(255,59,48,0.08)',
  color: '#b91c1c',
  border: '1px solid rgba(255,59,48,0.4)',
  padding: 12,
  borderRadius: 10,
};

const gridTwo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12,
};

const gridThree: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

const ghostButton: React.CSSProperties = {
  padding: '12px 16px',
  background: '#0b0b0c',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  width: 'fit-content',
};

const primaryButton: React.CSSProperties = {
  ...ghostButton,
  background: '#32d74b',
  color: '#0b0b0c',
};

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <h3 style={{ margin: '0 0 4px 0' }}>{title}</h3>
    <p style={{ margin: 0, color: '#666', fontSize: 14 }}>{subtitle}</p>
  </div>
);

const ToggleRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

const LabeledInput = ({ label, value, onChange, type = 'text', placeholder, disabled }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; disabled?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontSize: 14, color: '#111' }}>{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: disabled ? '#f5f5f5' : '#fff',
      }}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontSize: 14, color: '#111' }}>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

function safeParseJSON<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    console.warn('[AdvancedSetup] Invalid JSON, using fallback');
    return fallback;
  }
}
