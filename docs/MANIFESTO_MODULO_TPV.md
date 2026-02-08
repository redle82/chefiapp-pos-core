# 🧩 MANIFESTO DO MÓDULO TPV
## TPV como Primeiro Módulo Instalável Exemplar

**Data:** 27/01/2026  
**Status:** ✅ Manifesto Definido — Pronto para Implementação

---

## 🎯 POR QUE TPV É O MÓDULO PERFEITO Nº1

### Ele Toca em Tudo

O TPV não é apenas um módulo. Ele é o **centro gravitacional** do sistema:

- ✅ **Pessoas** — Quem vende (operadores, caixas)
- ✅ **Mesas** — Unidades operacionais
- ✅ **Pedidos** — Transações reais
- ✅ **Estoque** — Consumo automático
- ✅ **Pagamentos** — Fluxo financeiro
- ✅ **KDS** — Comunicação com cozinha
- ✅ **Dashboard** — Visibilidade operacional
- ✅ **Eventos** — Rastreabilidade completa
- ✅ **SLA** — Performance e qualidade
- ✅ **Mentoria futura** — Base para IA

**Se o TPV é instalável, TODO o resto também é.**

---

## 🧠 O QUE DIFERENCIA O SEU TPV

### Não é:
- ❌ "Mais um POS bonito"
- ❌ "Mais um checkout"
- ❌ "Interface de venda"

### É:
- ✅ **Capacidade adquirida**
- ✅ **Sistema sabe que existe**
- ✅ **Sistema sabe por que existe**
- ✅ **Cria realidade operacional**

---

## 🔄 COMPARAÇÃO

### Toast / Square

**TPV é dado:**
- Já existe no sistema
- Você só configura
- Não há "instalação"
- Não há "ativação"

### ChefIApp

**TPV é capacidade adquirida:**
- Não existe até ser instalado
- Instalação cria entidades
- Instalação cria eventos
- Aparece no dashboard
- Entra no Core
- Passa a ser observado pela IA

**Isso muda tudo.**

---

## 🏗️ ESTRUTURA DE INSTALAÇÃO

### Fase 1 — Instalação (Config Tree)

**O que acontece:**
1. Usuário clica "Instalar TPV" no Config Tree
2. Sistema mostra aviso claro:
   - "Isso criará: operadores, caixas, permissões, eventos"
3. Usuário confirma conscientemente
4. Instalação inicia

**Critério de Pronto:**
- ✅ Toggle "Instalar TPV" no Config Tree
- ✅ Aviso claro do que será criado
- ✅ Confirmação consciente
- ✅ Feedback visual durante instalação

---

### Fase 2 — Materialização

**O que acontece:**
1. Ícone TPV aparece no dashboard
2. Rotas `/tpv` são liberadas
3. Permissões são atribuídas
4. Dados iniciais são criados:
   - Operador padrão
   - Caixa padrão
   - Configurações básicas

**Critério de Pronto:**
- ✅ Ícone aparece no dashboard automaticamente
- ✅ Rotas funcionam
- ✅ Permissões ativas
- ✅ Dados iniciais criados

---

### Fase 3 — Vida Real

**O que acontece:**
1. Primeiro pedido real é criado
2. Evento é emitido no Core
3. KDS reage (se instalado)
4. Estoque consome (se instalado)
5. Dashboard atualiza

**Critério de Pronto:**
- ✅ Pedido real funciona
- ✅ Eventos sendo emitidos
- ✅ Integrações ativas
- ✅ Sistema operacional completo

**Quando isso acontece, o ChefIApp muda de patamar.**

---

## 📋 INTERFACE DO MÓDULO

### Métodos Obrigatórios

```typescript
interface ModuleInterface {
  // Instalação
  install(restaurantId: string, config?: ModuleConfig): Promise<InstallResult>;
  
  // Desinstalação
  uninstall(restaurantId: string): Promise<UninstallResult>;
  
  // Saúde
  health(restaurantId: string): Promise<HealthStatus>;
  
  // Configuração
  configure(restaurantId: string, config: ModuleConfig): Promise<void>;
  
  // Status
  status(restaurantId: string): Promise<ModuleStatus>;
}
```

---

## 🎯 IMPLEMENTAÇÃO DO TPV

### 1. Registry no Core

**Arquivo:** `docker-core/schema/migrations/20260127_modules_registry.sql`

```sql
-- Tabela de módulos instalados
CREATE TABLE installed_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant(id),
  module_id VARCHAR NOT NULL,
  module_name VARCHAR NOT NULL,
  version VARCHAR,
  installed_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR DEFAULT 'active',
  config JSONB,
  dependencies TEXT[],
  UNIQUE(restaurant_id, module_id)
);

-- RPC: Instalar TPV
CREATE OR REPLACE FUNCTION install_tpv_module(
  p_restaurant_id UUID,
  p_config JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
  v_module_id UUID;
  v_operator_id UUID;
  v_cash_register_id UUID;
BEGIN
  -- 1. Registrar módulo
  INSERT INTO installed_modules (
    restaurant_id, module_id, module_name, version, status, config
  ) VALUES (
    p_restaurant_id, 'tpv', 'TPV (Point of Sale)', '1.0.0', 'active', p_config
  ) RETURNING id INTO v_module_id;
  
  -- 2. Criar operador padrão
  INSERT INTO employees (restaurant_id, name, role, status)
  VALUES (p_restaurant_id, 'Operador Padrão', 'cashier', 'active')
  RETURNING id INTO v_operator_id;
  
  -- 3. Criar caixa padrão
  INSERT INTO cash_registers (restaurant_id, name, status)
  VALUES (p_restaurant_id, 'Caixa 1', 'active')
  RETURNING id INTO v_cash_register_id;
  
  -- 4. Criar permissões
  INSERT INTO module_permissions (restaurant_id, module_id, role, permissions)
  VALUES 
    (p_restaurant_id, 'tpv', 'owner', ARRAY['all']),
    (p_restaurant_id, 'tpv', 'manager', ARRAY['read', 'write']),
    (p_restaurant_id, 'tpv', 'cashier', ARRAY['read', 'write']);
  
  RETURN v_module_id;
END;
$$ LANGUAGE plpgsql;
```

---

### 2. Installer no Frontend

**Arquivo:** `merchant-portal/src/core/modules/tpv/TPVInstaller.ts`

```typescript
export class TPVInstaller implements ModuleInterface {
  async install(restaurantId: string, config?: ModuleConfig): Promise<InstallResult> {
    // 1. Chamar RPC de instalação
    const { data, error } = await supabase.rpc('install_tpv_module', {
      p_restaurant_id: restaurantId,
      p_config: config || {}
    });
    
    if (error) throw error;
    
    // 2. Atualizar estado local
    await this.updateLocalState(restaurantId, 'installed');
    
    // 3. Emitir evento
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
  }
  
  async uninstall(restaurantId: string): Promise<UninstallResult> {
    // Implementar desinstalação
  }
  
  async health(restaurantId: string): Promise<HealthStatus> {
    // Verificar saúde do módulo
  }
}
```

---

### 3. UI no Config Tree

**Arquivo:** `merchant-portal/src/pages/Config/ConfigModulesPage.tsx`

```typescript
export function ConfigModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);
  
  const handleInstall = async (moduleId: string) => {
    setInstalling(moduleId);
    try {
      const installer = getInstaller(moduleId);
      await installer.install(restaurantId);
      // Atualizar lista
      await refreshModules();
    } finally {
      setInstalling(null);
    }
  };
  
  return (
    <div>
      <h1>Módulos Instalados</h1>
      {modules.map(module => (
        <ModuleCard
          key={module.id}
          module={module}
          onInstall={() => handleInstall(module.id)}
          installing={installing === module.id}
        />
      ))}
    </div>
  );
}
```

---

## ⚠️ O QUE NÃO FAZER

### Dispersão Perigosa

- ❌ **Não instalar 2 módulos ao mesmo tempo**
- ❌ **Não "adiantar" banco de horas, reservas, etc.**
- ❌ **Não refatorar UI sem necessidade**

**Você quer um módulo exemplar, não vários medianos.**

---

## ✅ CRITÉRIO DE SUCESSO

**TPV está completo quando:**
- ✅ Pode ser instalado via Config Tree
- ✅ Aparece no dashboard automaticamente
- ✅ Funcionalidades ativadas
- ✅ Primeiro pedido real funciona
- ✅ Eventos sendo emitidos
- ✅ Demonstração clara do conceito
- ✅ Pronto para mostrar a investidores/parceiros

---

## 🚀 PRÓXIMO PASSO

**Quando você disser "vamos instalar o TPV":**

1. ✅ Manifesto definido (este documento)
2. ⏳ Implementar `install()`, `uninstall()`, `health()`
3. ⏳ Ligar ao Config Tree
4. ⏳ Testar instalação completa
5. ⏳ Validar com primeiro pedido real

---

## 📝 FRASE FINAL

> **"Eles vendem software.  
> Você instala capacidades."**

**Terreno firme. Arquitetura certa.  
Agora é execução com calma — porque o difícil você já fez.**

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Manifesto Consolidado — Pronto para Implementação
