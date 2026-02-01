# 🚀 PROMPT — INSTALAR TPV COMO MÓDULO
## Implementação Completa do Primeiro Módulo Instalável

**Objetivo:** Transformar o TPV em um módulo instalável exemplar, demonstrando completamente a capacidade de instalação viva do ChefIApp.

**Tempo estimado:** 4 semanas

---

## 📋 FASE 1: REGISTRY DE MÓDULOS (1 semana)

### Tarefa 1.1: Criar Tabela de Módulos

**Arquivo:** `docker-core/schema/migrations/20260127_modules_registry.sql`

```sql
-- Tabela de módulos instalados
CREATE TABLE installed_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant(id) ON DELETE CASCADE,
  module_id VARCHAR NOT NULL,
  module_name VARCHAR NOT NULL,
  version VARCHAR DEFAULT '1.0.0',
  installed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  config JSONB DEFAULT '{}'::JSONB,
  dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  UNIQUE(restaurant_id, module_id)
);

CREATE INDEX idx_installed_modules_restaurant ON installed_modules(restaurant_id);
CREATE INDEX idx_installed_modules_status ON installed_modules(status);

-- Tabela de permissões de módulos
CREATE TABLE module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant(id) ON DELETE CASCADE,
  module_id VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  permissions TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, module_id, role)
);
```

### Tarefa 1.2: Criar RPCs de Instalação

**Arquivo:** `docker-core/schema/migrations/20260127_install_tpv_module.sql`

```sql
-- RPC: Instalar módulo TPV
CREATE OR REPLACE FUNCTION install_tpv_module(
  p_restaurant_id UUID,
  p_config JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
  v_module_id UUID;
  v_operator_id UUID;
  v_cash_register_id UUID;
  v_owner_id UUID;
BEGIN
  -- 1. Verificar se restaurante existe
  IF NOT EXISTS (SELECT 1 FROM restaurant WHERE id = p_restaurant_id) THEN
    RAISE EXCEPTION 'Restaurant not found: %', p_restaurant_id;
  END IF;
  
  -- 2. Verificar se já está instalado
  IF EXISTS (SELECT 1 FROM installed_modules WHERE restaurant_id = p_restaurant_id AND module_id = 'tpv') THEN
    RAISE EXCEPTION 'TPV module already installed for restaurant: %', p_restaurant_id;
  END IF;
  
  -- 3. Registrar módulo
  INSERT INTO installed_modules (
    restaurant_id, module_id, module_name, version, status, config
  ) VALUES (
    p_restaurant_id, 'tpv', 'TPV (Point of Sale)', '1.0.0', 'active', p_config
  ) RETURNING id INTO v_module_id;
  
  -- 4. Criar operador padrão (se não existir)
  SELECT id INTO v_operator_id FROM employees 
  WHERE restaurant_id = p_restaurant_id AND role = 'cashier' 
  LIMIT 1;
  
  IF v_operator_id IS NULL THEN
    INSERT INTO employees (restaurant_id, name, role, status)
    VALUES (p_restaurant_id, 'Operador Padrão', 'cashier', 'active')
    RETURNING id INTO v_operator_id;
  END IF;
  
  -- 5. Criar caixa padrão
  INSERT INTO cash_registers (restaurant_id, name, status)
  VALUES (p_restaurant_id, 'Caixa 1', 'active')
  RETURNING id INTO v_cash_register_id;
  
  -- 6. Criar permissões padrão
  INSERT INTO module_permissions (restaurant_id, module_id, role, permissions)
  VALUES 
    (p_restaurant_id, 'tpv', 'owner', ARRAY['all']),
    (p_restaurant_id, 'tpv', 'manager', ARRAY['read', 'write', 'close']),
    (p_restaurant_id, 'tpv', 'cashier', ARRAY['read', 'write']);
  
  -- 7. Emitir evento (se houver sistema de eventos)
  -- INSERT INTO events (restaurant_id, type, data) VALUES (...);
  
  RETURN v_module_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Desinstalar módulo TPV
CREATE OR REPLACE FUNCTION uninstall_tpv_module(
  p_restaurant_id UUID
) RETURNS VOID AS $$
BEGIN
  -- 1. Verificar se está instalado
  IF NOT EXISTS (SELECT 1 FROM installed_modules WHERE restaurant_id = p_restaurant_id AND module_id = 'tpv') THEN
    RAISE EXCEPTION 'TPV module not installed for restaurant: %', p_restaurant_id;
  END IF;
  
  -- 2. Remover permissões
  DELETE FROM module_permissions WHERE restaurant_id = p_restaurant_id AND module_id = 'tpv';
  
  -- 3. Marcar módulo como inativo (não deletar, manter histórico)
  UPDATE installed_modules
  SET status = 'inactive', updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id AND module_id = 'tpv';
  
  -- 4. Emitir evento
  -- INSERT INTO events (restaurant_id, type, data) VALUES (...);
END;
$$ LANGUAGE plpgsql;

-- RPC: Verificar saúde do módulo TPV
CREATE OR REPLACE FUNCTION check_tpv_module_health(
  p_restaurant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_module_status VARCHAR;
  v_has_operators BOOLEAN;
  v_has_cash_registers BOOLEAN;
BEGIN
  -- Verificar status do módulo
  SELECT status INTO v_module_status
  FROM installed_modules
  WHERE restaurant_id = p_restaurant_id AND module_id = 'tpv';
  
  IF v_module_status IS NULL THEN
    RETURN jsonb_build_object(
      'installed', false,
      'status', 'not_installed'
    );
  END IF;
  
  -- Verificar dependências
  SELECT 
    EXISTS(SELECT 1 FROM employees WHERE restaurant_id = p_restaurant_id AND role = 'cashier'),
    EXISTS(SELECT 1 FROM cash_registers WHERE restaurant_id = p_restaurant_id)
  INTO v_has_operators, v_has_cash_registers;
  
  -- Construir resultado
  v_result := jsonb_build_object(
    'installed', true,
    'status', v_module_status,
    'health', CASE 
      WHEN v_module_status = 'active' AND v_has_operators AND v_has_cash_registers THEN 'healthy'
      WHEN v_module_status = 'active' THEN 'degraded'
      ELSE 'unhealthy'
    END,
    'checks', jsonb_build_object(
      'operators', v_has_operators,
      'cash_registers', v_has_cash_registers
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

**Critério de Pronto:**
- ✅ Tabela `installed_modules` criada
- ✅ Tabela `module_permissions` criada
- ✅ RPC `install_tpv_module()` funcionando
- ✅ RPC `uninstall_tpv_module()` funcionando
- ✅ RPC `check_tpv_module_health()` funcionando

---

## 📋 FASE 2: INSTALLER NO FRONTEND (2 semanas)

### Tarefa 2.1: Criar Interface de Módulo

**Arquivo:** `merchant-portal/src/core/modules/types.ts`

```typescript
export interface ModuleInterface {
  install(restaurantId: string, config?: ModuleConfig): Promise<InstallResult>;
  uninstall(restaurantId: string): Promise<UninstallResult>;
  health(restaurantId: string): Promise<HealthStatus>;
  configure(restaurantId: string, config: ModuleConfig): Promise<void>;
  status(restaurantId: string): Promise<ModuleStatus>;
}

export interface ModuleConfig {
  [key: string]: any;
}

export interface InstallResult {
  success: boolean;
  moduleId: string;
  message: string;
  warnings?: string[];
}

export interface UninstallResult {
  success: boolean;
  message: string;
}

export interface HealthStatus {
  installed: boolean;
  status: 'active' | 'inactive' | 'error' | 'not_installed';
  health: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: boolean;
  };
}

export interface ModuleStatus {
  installed: boolean;
  version?: string;
  installedAt?: Date;
  status?: string;
}
```

### Tarefa 2.2: Implementar TPVInstaller

**Arquivo:** `merchant-portal/src/core/modules/tpv/TPVInstaller.ts`

```typescript
import { supabase } from '../../supabase';
import type { ModuleInterface, ModuleConfig, InstallResult, UninstallResult, HealthStatus, ModuleStatus } from '../types';

export class TPVInstaller implements ModuleInterface {
  async install(restaurantId: string, config?: ModuleConfig): Promise<InstallResult> {
    try {
      // 1. Chamar RPC de instalação
      const { data, error } = await supabase.rpc('install_tpv_module', {
        p_restaurant_id: restaurantId,
        p_config: config || {}
      });
      
      if (error) {
        throw new Error(`Failed to install TPV module: ${error.message}`);
      }
      
      // 2. Atualizar estado local (se necessário)
      await this.updateLocalState(restaurantId, 'installed');
      
      // 3. Emitir evento (se houver sistema de eventos)
      await this.emitEvent('module_installed', {
        module: 'tpv',
        restaurantId,
        timestamp: new Date()
      });
      
      return {
        success: true,
        moduleId: data,
        message: 'TPV instalado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        moduleId: '',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  async uninstall(restaurantId: string): Promise<UninstallResult> {
    try {
      const { error } = await supabase.rpc('uninstall_tpv_module', {
        p_restaurant_id: restaurantId
      });
      
      if (error) {
        throw new Error(`Failed to uninstall TPV module: ${error.message}`);
      }
      
      // Atualizar estado local
      await this.updateLocalState(restaurantId, 'uninstalled');
      
      return {
        success: true,
        message: 'TPV desinstalado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  async health(restaurantId: string): Promise<HealthStatus> {
    try {
      const { data, error } = await supabase.rpc('check_tpv_module_health', {
        p_restaurant_id: restaurantId
      });
      
      if (error) {
        throw error;
      }
      
      return data as HealthStatus;
    } catch (error) {
      return {
        installed: false,
        status: 'not_installed',
        health: 'unhealthy',
        checks: {}
      };
    }
  }
  
  async configure(restaurantId: string, config: ModuleConfig): Promise<void> {
    // Implementar configuração
  }
  
  async status(restaurantId: string): Promise<ModuleStatus> {
    // Implementar verificação de status
  }
  
  private async updateLocalState(restaurantId: string, state: string): Promise<void> {
    // Atualizar estado local (localStorage, context, etc.)
  }
  
  private async emitEvent(type: string, data: any): Promise<void> {
    // Emitir evento (se houver sistema de eventos)
  }
}

export const tpvInstaller = new TPVInstaller();
```

**Critério de Pronto:**
- ✅ Interface `ModuleInterface` definida
- ✅ Classe `TPVInstaller` implementada
- ✅ Métodos `install()`, `uninstall()`, `health()` funcionando
- ✅ Tratamento de erros implementado

---

## 📋 FASE 3: UI NO CONFIG TREE (1 semana)

### Tarefa 3.1: Criar Página de Módulos

**Arquivo:** `merchant-portal/src/pages/Config/ConfigModulesPage.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { tpvInstaller } from '../../core/modules/tpv/TPVInstaller';
import { supabase } from '../../core/supabase';

export function ConfigModulesPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>('');

  useEffect(() => {
    // Buscar restaurante atual
    const fetchRestaurant = async () => {
      // Implementar busca de restaurant_id
    };
    
    fetchRestaurant();
    refreshModules();
  }, []);

  const refreshModules = async () => {
    if (!restaurantId) return;
    
    const { data, error } = await supabase
      .from('installed_modules')
      .select('*')
      .eq('restaurant_id', restaurantId);
    
    if (!error && data) {
      setModules(data);
    }
  };

  const handleInstall = async (moduleId: string) => {
    setInstalling(moduleId);
    try {
      if (moduleId === 'tpv') {
        const result = await tpvInstaller.install(restaurantId);
        if (result.success) {
          alert('TPV instalado com sucesso!');
          await refreshModules();
        } else {
          alert(`Erro: ${result.message}`);
        }
      }
    } catch (error) {
      alert(`Erro ao instalar módulo: ${error}`);
    } finally {
      setInstalling(null);
    }
  };

  const handleUninstall = async (moduleId: string) => {
    if (!confirm('Tem certeza que deseja desinstalar este módulo?')) return;
    
    try {
      if (moduleId === 'tpv') {
        const result = await tpvInstaller.uninstall(restaurantId);
        if (result.success) {
          alert('TPV desinstalado com sucesso!');
          await refreshModules();
        } else {
          alert(`Erro: ${result.message}`);
        }
      }
    } catch (error) {
      alert(`Erro ao desinstalar módulo: ${error}`);
    }
  };

  const isInstalled = (moduleId: string) => {
    return modules.some(m => m.module_id === moduleId && m.status === 'active');
  };

  return (
    <div>
      <h1>Módulos Instalados</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
        {/* Módulo TPV */}
        <div style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0 }}>TPV (Point of Sale)</h3>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
              Sistema de vendas e caixa para o restaurante
            </p>
          </div>
          <div>
            {isInstalled('tpv') ? (
              <button
                onClick={() => handleUninstall('tpv')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Desinstalar
              </button>
            ) : (
              <button
                onClick={() => handleInstall('tpv')}
                disabled={installing === 'tpv'}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: installing === 'tpv' ? 'not-allowed' : 'pointer',
                  opacity: installing === 'tpv' ? 0.6 : 1
                }}
              >
                {installing === 'tpv' ? 'Instalando...' : 'Instalar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Tarefa 3.2: Adicionar ao Config Tree

**Arquivo:** `merchant-portal/src/components/config/ConfigSidebar.tsx`

Adicionar seção "Módulos" na lista de seções:

```typescript
{ 
  id: 'modules', 
  label: 'Módulos', 
  icon: '🧩', 
  description: 'Instale e gerencie módulos',
  path: '/config/modules'
}
```

**Critério de Pronto:**
- ✅ Página `ConfigModulesPage` criada
- ✅ Lista de módulos disponíveis
- ✅ Botão "Instalar" funciona
- ✅ Botão "Desinstalar" funciona
- ✅ Feedback visual durante instalação
- ✅ Seção adicionada ao Config Tree

---

## 🧪 TESTE DE VALIDAÇÃO

### Cenário End-to-End

1. Acessar `/config/modules`
2. Ver módulo TPV disponível
3. Clicar "Instalar TPV"
4. Verificar: módulo instalado no banco
5. Verificar: ícone TPV aparece no dashboard
6. Acessar `/tpv`
7. Verificar: TPV funciona normalmente
8. Criar primeiro pedido real
9. Verificar: evento emitido no Core
10. Verificar: KDS reage (se instalado)

**Critério de Pronto:**
- ✅ Fluxo completo funciona
- ✅ Módulo instalado corretamente
- ✅ Dashboard atualiza automaticamente
- ✅ Primeiro pedido real funciona
- ✅ Sistema operacional completo

---

## ✅ CRITÉRIO DE SUCESSO FINAL

**TPV está completo quando:**
- ✅ Pode ser instalado via Config Tree
- ✅ Aparece no dashboard automaticamente
- ✅ Funcionalidades ativadas
- ✅ Primeiro pedido real funciona
- ✅ Eventos sendo emitidos
- ✅ Demonstração clara do conceito
- ✅ Pronto para mostrar a investidores/parceiros

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Prompt Completo — Pronto para Execução
