# Roadmap 30 Dias — AppStaff 0.9 para Publicação

> **Status:** EXECUTABLE
> **Objetivo:** Subir AppStaff às lojas como versão 0.9 para validação de mercado e investidores
> **Risco:** Controlado — alguns itens ficam para 1.0
> **Ref:** [MANDATORY_ARCHITECTURE_AND_PUBLICATION_READINESS.md](../architecture/MANDATORY_ARCHITECTURE_AND_PUBLICATION_READINESS.md)

---

## Visão Geral

| Semana | Foco                | Blocos   | Entregáveis principais                          |
| ------ | ------------------- | -------- | ----------------------------------------------- |
| 1      | Tenant e guards     | 1, 5     | Tenant centralizado, logout, PaymentGuard       |
| 2      | Build e runtime     | 2, 3     | EAS production, cold start, offline docs        |
| 3      | Regras das lojas    | 4        | Privacidade, termos, screenshots, native feel   |
| 4      | Integração          | 3, 4     | Testes, submissão Apple/Google, buffer          |

---

## Semana 1 — Tenant centralizado e guards

### Dias 1–2

| Tarefa | Bloco | Criticidade 0.9 | Ficheiros principais |
| ------ | ----- | --------------- | -------------------- |
| Auditoria de usos de `getTabIsolated` / `localStorage` em AppStaff | 1 | Alta | `merchant-portal/src/pages/AppStaff/**` |
| Migração para `TenantResolver` centralizado | 1 | Alta | [TenantResolver.ts](../../merchant-portal/src/core/tenant/TenantResolver.ts), [AppStaffWrapper.tsx](../../merchant-portal/src/pages/AppStaff/AppStaffWrapper.tsx) |

**Checklist:**

- [ ] Listar todas as referências a `chefiapp_restaurant_id` no AppStaff a `chefiapp_restaurant_id` no AppStaff
- [ ] Garantir fluxo principal via auth/sessão
- [ ] Documentar usos legados aceitáveis para 0.9

---

### Dias 3–4

| Tarefa | Bloco | Criticidade 0.9 | Ficheiros principais |
| ------ | ----- | --------------- | -------------------- |
| Centralizar limpeza de tenant no logout | 3 | Alta | [FlowGate.tsx](../../merchant-portal/src/core/flow/FlowGate.tsx), [authAdapter.ts](../../merchant-portal/src/core/auth/authAdapter.ts) |
| Garantir AdminTopbar e SetupLayout limpam tenant antes de signOut | 3 | Alta | [AdminTopbar.tsx](../../merchant-portal/src/features/admin/dashboard/components/AdminTopbar.tsx), [SetupLayout.tsx](../../merchant-portal/src/pages/SetupLayout.tsx) |
| Keycloak: limpar tenant antes do redirect | 3 | Alta | [authKeycloak.ts](../../merchant-portal/src/core/auth/authKeycloak.ts) |

**Checklist:**

- [ ] `clearActiveTenant()`` ou equivalente chamado em todos os pontos de logout
- [ ] Teste: logout → novo login → tenant correto

---

### Dia 5

| Tarefa | Bloco | Criticidade 0.9 | Ficheiros principais |
| ------ | ----- | --------------- | -------------------- |
| Endurecer PaymentGuard: remover bypass quando `rId === null` | 5 | Média | [PaymentGuard.tsx](../../merchant-portal/src/core/billing/PaymentGuard.tsx) |
| Tratamento de erro sem assumir `"active"` | 5 | Média | Idem |

**Checklist:**

- [ ] Sem tenant → bloquear ou redirecionar (não passar)
- [ ] Em caso de erro na API → mostrar estado seguro (loading ou erro), não assumir active

---

### Dias 6–7

| Tarefa | Bloco | Criticidade 0.9 |
| ------ | ----- | --------------- |
| Documentar o que fica para 1.0 vs mandatório já | — | — |

**Entregáveis Semana 1:**

- Tenant resolvido via auth/backend onde possível
- Logout limpa tenant em todos os fluxos
- PaymentGuard mais estrito
- Documento de "0.9 vs 1.0" atualizado

---

## Semana 2 — Build nativo e runtime

### Dias 8–9

| Tarefa | Bloco | Criticidade 0.9 | Ficheiros principais |
| ------ | ----- | --------------- | -------------------- |
| Validar EAS build: `development`, `preview`, `production` | 2 | Alta | [mobile-app/eas.json](../../mobile-app/eas.json) |
| Criar credentials na Expo se faltar | 2 | Alta | `eas credentials` |

**Checklist:**

- [ ] `eas build --profile development` OK
- [ ] `eas build --profile preview` OK
- [ ] `eas build --profile production` OK (ou preparado)
- [ ] Keystore Android gerado
- [ ] Certificates iOS configurados

---

### Dia 10

| Tarefa | Bloco | Criticidade 0.9 |
| ------ | ----- | --------------- |
| Configurar Sentry DSN em app.json | 2 | Baixa |

**Nota:** Pode ser placeholder se ainda sem conta Sentry.

---

### Dia 11

| Tarefa | Bloco | Criticidade 0.9 |
| ------ | ----- | --------------- |
| Testes de cold start e sessão persistente | 3 | Alta |
| Verificar 0 crashes em launch | 3 | Alta |

**Checklist:**

- [ ] App abre sem crash em iOS
- [ ] App abre sem crash em Android
- [ ] Sessão persiste após fechar/abrir
- [ ] Refresh token funciona

---

### Dia 12

| Tarefa | Bloco | Criticidade 0.9 | Ficheiros principais |
| ------ | ----- | --------------- | -------------------- |
| Documentar fluxo offline e fallback | 3 | Média | [PWAOpenToTPVRedirect.tsx](../../merchant-portal/src/core/operational/PWAOpenToTPVRedirect.tsx), SyncEngine |

**Entregáveis Semana 2:**

- Build production funcional
- Cold start estável
- Documentação de offline

---

## Semana 3 — Regras das lojas

### Dias 13–14

| Tarefa | Bloco | Criticidade 0.9 |
| ------ | ----- | --------------- |
| Política de privacidade pública (URL) | 4 | Obrigatória |
| Termos de uso (URL) | 4 | Obrigatória |

**Checklist:**

- [ ] Página de privacidade publicada
- [ ] Página de termos publicada
- [ ] URLs estáveis para submissão

---

### Dia 15

| Tarefa | Bloco | Criticidade 0.9 |
| ------ | ----- | --------------- |
| Descrição do app e propósito para App Store / Play Store | 4 | Obrigatória |

**Checklist:**

- [ ] Descrição curta (subtitle)
- [ ] Descrição longa
- [ ] Palavras-chave
- [ ] Categoria adequada

---

### Dia 16

| Tarefa | Bloco | Criticidade 0.9 |
| ------ | ----- | --------------- |
| Screenshots reais (iPhone + Android) | 4 | Obrigatória |

**Checklist:**

- [ ] iPhone 6.7", 6.5", 5.5" (mínimo Apple)
- [ ] Android phone e tablet (mínimo Google)
- [ ] Sem placeholders

---

### Dia 17

| Tarefa | Bloco | Criticidade 0.9 |
| ------ | ----- | --------------- |
| Verificar que AppStaff não parece "wrapper de site" | 4 | Alta |

**Checklist:**

- [ ] Sem browser chrome (address bar, etc.)
- [ ] Native feel (gestos, transições)
- [ ] Splash e ícones adequados

**Entregáveis Semana 3:**

- Política, termos, descrição e screenshots prontos
- App com aspecto nativo

---

## Semana 4 — Integração e submissão

### Dias 18–19

| Tarefa | Bloco | Criticidade 0.9 |
| ------ | ----- | --------------- |
| Testes internos em dispositivos reais (preview build) | 3 | Alta |

**Checklist:**

- [ ] TestFlight (Apple) ou Internal Testing (Google)
- [ ] Feedback de 2–3 utilizadores
- [ ] Registo de bugs críticos

---

### Dia 20

| Tarefa | Bloco |
| ------ | ----- |
| Resolver issues críticos encontrados nos testes | 3 |

---

### Dias 21–22

| Tarefa | Bloco |
| ------ | ----- |
| Submissão Apple (review 3–7 dias típico) | 4 |
| Submissão Google Play (reviews mais rápidos) | 4 |

**Checklist:**

- [ ] Build production gerado
- [ ] App Store Connect preenchido
- [ ] Google Play Console preenchido
- [ ] Submissão enviada

---

### Dias 23–30

| Tarefa |
| ------ |
| Buffer para correções após feedback da Apple/Google |

**Entregáveis Semana 4:**

- Builds submetidos
- Processo de review iniciado

---

## Referências

| Documento | Uso |
| --------- | --- |
| [MANDATORY_ARCHITECTURE_AND_PUBLICATION_READINESS.md](../architecture/MANDATORY_ARCHITECTURE_AND_PUBLICATION_READINESS.md) | Separação Arquitetura vs Prontidão |
| [SYSTEM_RULE_DEVICE_ONLY.md](../architecture/SYSTEM_RULE_DEVICE_ONLY.md) | Regra de acesso device-only |
| [BrowserBlockGuard.tsx](../../merchant-portal/src/components/operational/BrowserBlockGuard.tsx) | Enforcement de plataforma |
| [TenantResolver.ts](../../merchant-portal/src/core/tenant/TenantResolver.ts) | Resolução de tenant |
| [PaymentGuard.tsx](../../merchant-portal/src/core/billing/PaymentGuard.tsx) | Bloqueio por billing |
| [mobile-app/eas.json](../../mobile-app/eas.json) | Config EAS Build |
