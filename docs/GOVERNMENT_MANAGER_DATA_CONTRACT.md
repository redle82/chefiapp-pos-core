# Government Manager - Contrato de Dados

**Data**: 2025-01-27  
**Status**: 📋 **CONTRATO DEFINIDO** (Implementação futura)

---

## 🎯 Objetivo

Documentar o contrato de dados para o Government Manager real, garantindo que quando a implementação acontecer, não será necessário redesenhar a estrutura.

---

## 📊 Schema Proposto

### Tabela: `compliance_status`

```sql
CREATE TABLE IF NOT EXISTS compliance_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('haccp', 'legal', 'fiscal', 'certification')),
    status TEXT NOT NULL CHECK (status IN ('compliant', 'warning', 'critical', 'pending', 'expired')),
    title TEXT NOT NULL, -- Ex: "Certificado HACCP", "Alvará de Funcionamento"
    description TEXT,
    expires_at TIMESTAMPTZ, -- NULL se não expira
    responsible_user_id UUID REFERENCES auth.users(id), -- Quem é responsável
    document_url TEXT, -- URL do documento (se houver)
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(restaurant_id, type, title)
);

CREATE INDEX idx_compliance_restaurant ON compliance_status(restaurant_id);
CREATE INDEX idx_compliance_expires ON compliance_status(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_compliance_status ON compliance_status(status);
```

---

## 🔄 Integração com Componente

### Interface TypeScript

```typescript
interface ComplianceStatus {
    haccp: 'compliant' | 'warning' | 'critical' | 'pending';
    legal: 'compliant' | 'warning' | 'pending';
    fiscal: 'compliant' | 'warning' | 'pending';
    alerts: number; // Contagem de itens expirando em < 30 dias
}

interface ComplianceItem {
    id: string;
    type: 'haccp' | 'legal' | 'fiscal' | 'certification';
    status: 'compliant' | 'warning' | 'critical' | 'pending' | 'expired';
    title: string;
    description?: string;
    expiresAt?: string;
    responsibleUserId?: string;
    documentUrl?: string;
}
```

### Query de Agregação

```typescript
// Função para calcular status agregado
async function getComplianceStatus(restaurantId: string): Promise<ComplianceStatus> {
    const { data } = await supabase
        .from('compliance_status')
        .select('*')
        .eq('restaurant_id', restaurantId);

    // Agregar por tipo
    const haccp = data?.filter(d => d.type === 'haccp') || [];
    const legal = data?.filter(d => d.type === 'legal') || [];
    const fiscal = data?.filter(d => d.type === 'fiscal') || [];

    // Calcular status mais crítico por categoria
    const getWorstStatus = (items: ComplianceItem[]) => {
        if (items.some(i => i.status === 'critical' || i.status === 'expired')) return 'critical';
        if (items.some(i => i.status === 'warning')) return 'warning';
        if (items.some(i => i.status === 'pending')) return 'pending';
        return 'compliant';
    };

    // Contar alertas (expirando em < 30 dias)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const alerts = data?.filter(d => 
        d.expires_at && 
        new Date(d.expires_at) <= thirtyDaysFromNow &&
        d.status !== 'expired'
    ).length || 0;

    return {
        haccp: getWorstStatus(haccp),
        legal: getWorstStatus(legal),
        fiscal: getWorstStatus(fiscal),
        alerts
    };
}
```

---

## 🎨 Estados Visuais

### Badge de Risco

```typescript
const getRiskLevel = (status: ComplianceStatus): 'low' | 'medium' | 'high' => {
    if (status.haccp === 'critical' || status.alerts > 3) return 'high';
    if (status.haccp === 'warning' || status.legal === 'warning' || status.alerts > 0) return 'medium';
    return 'low';
};
```

### Cores e Semântica

- **compliant** → `colors.success.base` (Verde)
- **warning** → `colors.warning.base` (Amarelo)
- **critical** → `colors.destructive.base` (Vermelho)
- **pending** → `colors.tertiary` (Cinza)

---

## 📋 Tipos de Compliance

### HACCP
- Certificado HACCP
- Plano de HACCP
- Registro de treinamentos

### Legal
- Alvará de funcionamento
- Licença sanitária
- Seguro de responsabilidade civil

### Fiscal
- NIF/CNPJ ativo
- Declarações fiscais em dia
- Certidões negativas

### Certifications
- Certificações específicas (ex: orgânico, halal, kosher)

---

## 🔔 Sistema de Alertas

### Regras de Alerta

1. **Crítico** (vermelho):
   - Status = 'expired'
   - Expira em < 7 dias

2. **Atenção** (amarelo):
   - Expira em < 30 dias
   - Status = 'warning'

3. **Conforme** (verde):
   - Status = 'compliant'
   - Expira em > 30 dias (ou não expira)

### Notificações

- Email ao responsável quando:
  - Item expira em < 7 dias
  - Status muda para 'critical'

---

## 🚀 Próximos Passos (Quando Implementar)

1. **Criar migration** com schema acima
2. **Criar API endpoints**:
   - `GET /api/compliance/:restaurantId` - Status agregado
   - `GET /api/compliance/:restaurantId/items` - Lista completa
   - `POST /api/compliance/:restaurantId/items` - Criar item
   - `PUT /api/compliance/:restaurantId/items/:id` - Atualizar
   - `DELETE /api/compliance/:restaurantId/items/:id` - Remover

3. **Atualizar `GovernmentManagerCard`**:
   - Substituir mock por query real
   - Adicionar link para página completa de compliance

4. **Criar página completa**:
   - `/app/govern/compliance`
   - Lista de todos os itens
   - Formulário de adicionar/editar
   - Upload de documentos

---

## 📝 Notas Técnicas

- **Responsável**: Campo `responsible_user_id` permite rastrear quem é responsável por cada item
- **Expiração**: Campo `expires_at` permite alertas automáticos
- **Documentos**: Campo `document_url` permite armazenar links para documentos (S3, Supabase Storage, etc.)
- **Auditoria**: Campos `created_at`, `updated_at`, `last_verified_at` permitem rastreamento completo

---

**Status**: 📋 **CONTRATO DEFINIDO - PRONTO PARA IMPLEMENTAÇÃO FUTURA**

