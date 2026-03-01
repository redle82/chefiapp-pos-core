# Arquitetura Mandatória e Prontidão para Publicação

> **Status:** CANONICAL
> **Tipo:** Documento de separação — fronteira entre regras imutáveis e blocos de prontidão
> **Ref:** SYSTEM_RULE_DEVICE_ONLY.md, DESKTOP_DISTRIBUTION_CONTRACT.md, OPERATIONAL_INSTALLATION_CONTRACT.md

---

## Objetivo

Este documento estabelece a fronteira clara entre:

1. **Arquitetura Mandatória** — regras imutáveis do sistema (não negociáveis)
2. **Prontidão para Publicação** — cinco blocos que determinam quando o AppStaff pode ser submetido às lojas

Evita confusão entre "o que o sistema exige" e "o que falta para publicar".

---

## Parte 1 — Arquitetura Mandatória (Não Negociável)

### Leis do Sistema

- **TPV** → Desktop only (Electron ou PWA instalada com bloqueio de browser)
- **KDS** → Desktop only (idem)
- **AppStaff** → Mobile only (app nativo via Expo EAS)
- **Waiter** → Mobile only (idem)
- **Nenhum** destes abre como web comum no browser

O painel web Admin é a única parte do ChefIApp acessível pelo navegador.

### Implicações Técnicas

| Módulo   | Formato                  | Guard ativo                   | Sem fallback /web |
| -------- | ------------------------ | ----------------------------- | ----------------- |
| TPV      | Electron / PWA desktop   | `BrowserBlockGuard(desktop)`  | Sim               |
| KDS      | Electron / PWA desktop   | `BrowserBlockGuard(desktop)`  | Sim               |
| AppStaff | App nativo (Expo/RN)     | `BrowserBlockGuard(mobile)`   | Sim               |
| Waiter   | App nativo (Expo/RN)     | `BrowserBlockGuard(mobile)`   | Sim               |

### Enforcement

- **Ficheiro:** `merchant-portal/src/components/operational/BrowserBlockGuard.tsx`
- **Rotas:** `merchant-portal/src/routes/OperationalRoutes.tsx`
- **Docs:** [SYSTEM_RULE_DEVICE_ONLY.md](./SYSTEM_RULE_DEVICE_ONLY.md), [DESKTOP_DISTRIBUTION_CONTRACT.md](./DESKTOP_DISTRIBUTION_CONTRACT.md)

---

## Parte 2 — Prontidão para Publicação (5 Blocos)

### Bloco 1 — Isolamento Arquitetural

**Objetivo:** AppStaff não depende de storage local para identidade de tenant.

| Requisito                         | Estado atual / Meta                                  |
| --------------------------------- | ---------------------------------------------------- |
| Tenant via auth token / backend   | Migrar de `getTabIsolated("chefiapp_restaurant_id")` |
| Sem `localStorage` para tenant    | Reduzir usos diretos; centralizar em TenantResolver  |
| TenantResolver como fonte única   | Em progresso                                         |

**Violação:** Se o AppStaff ainda usar `localStorage.getItem("chefiapp_restaurant_id")` ou `getTabIsolated("chefiapp_restaurant_id")` como fonte primária de tenant → não está pronto.

---

### Bloco 2 — Build Nativo Real

**Objetivo:** AppStaff com build production real para iOS e Android.

| Requisito                          | Estado atual / Meta                      |
| ---------------------------------- | ---------------------------------------- |
| EAS build configurado              | `mobile-app/eas.json`                    |
| Android keystore                   | Gerido pela Expo (EAS Credentials)       |
| Apple certificates + provisioning  | Gerido pela Expo                         |
| Bundle identifier fixo             | `com.goldmonkey.chefiapp` (app.json)     |

Sem isto, não existe subida às lojas.

---

### Bloco 3 — Runtime Stability

**Objetivo:** App estável e previsível antes de publicar.

| Requisito                          | Meta                                      |
| ---------------------------------- | ----------------------------------------- |
| 0 crash em cold start              | Testar em dispositivos reais              |
| 0 dependência de web routing       | AppStaff funciona como app nativo         |
| Offline com fallback elegante      | Documentar o que existe (PWAOpenToTPV...) |
| Sessão persiste corretamente       | Validar fluxo login / refresh             |
| Logout limpa tenant                | Centralizar em authAdapter / FlowGate     |

**Violação:** Se logout mantém tenant em storage → rejeição futura pelas lojas.

---

### Bloco 4 — Regras das Lojas

**Objetivo:** Cumprir requisitos da Apple e Google.

| Requisito                           | Obrigatório |
| ----------------------------------- | ----------- |
| Política de privacidade pública     | Sim         |
| Termos de uso                       | Sim         |
| Justificativa de coleta de dados    | Sim         |
| Descrição clara do propósito        | Sim         |
| Screenshots reais                   | Sim         |
| App não parece "wrapper de site"    | Sim         |
| targetSdk atualizado (Android)      | Sim         |
| Permissões mínimas                  | Sim         |

---

### Bloco 5 — Billing e Autorização

**Objetivo:** AppStaff não permite acesso indevido quando billing está suspenso.

| Requisito                                  | Meta                                              |
| ------------------------------------------ | ------------------------------------------------- |
| Sem acesso sem tenant válido                | PaymentGuard + RequireOperational                 |
| Bloqueio quando billing suspenso            | Remover bypass em `rId === null`                  |
| Tratamento de erro sem assumir `"active"`   | Não fazer fallback para active em caso de falha   |

**Ficheiro:** `merchant-portal/src/core/billing/PaymentGuard.tsx`

---

## Parte 3 — O que é Aceitável na 0.9 (Risco Controlado)

Para a versão **0.9** (validação de mercado / investidores), é aceitável:

| Item                                    | Justificação                              |
| --------------------------------------- | ----------------------------------------- |
| Trial mode a permitir browser            | Validação de demos                        |
| PWA standalone aceite pelo guard         | Ponte até builds nativos estáveis         |
| Alguns usos de getTabIsolated em fluxos  | Se o fluxo principal for via auth/tenant  |
| secundários                              |                                           |
| Sentry como placeholder                  | Se ainda sem conta                         |
| Documentação de lojas em progresso       | App Store Connect / Play Console           |

---

## Parte 4 — O que Fica para 1.0

Para a versão **1.0** (produto final estável), será mandatório:

- Trial sem bypass de browser para operacionais (ou fluxo dedicado)
- Tenant 100% via auth/backend, sem storage local
- PaymentGuard sem exceções
- Sentry e monitorização completos
- Documentação de publicação completa

---

## Referências Cruzadas

| Documento                                                  | Uso                                               |
| ---------------------------------------------------------- | ------------------------------------------------- |
| [SYSTEM_RULE_DEVICE_ONLY.md](./SYSTEM_RULE_DEVICE_ONLY.md) | Regra imutável de acesso                          |
| [DESKTOP_DISTRIBUTION_CONTRACT.md](./DESKTOP_DISTRIBUTION_CONTRACT.md) | TPV/KDS Electron                                |
| [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) | Instalação e provisioning                 |
| [PRODUCTION_READINESS_CONTRACT.md](./PRODUCTION_READINESS_CONTRACT.md) | Runtime production vs demo               |
| [../roadmap/APPSTAFF_09_PUBLICATION_ROADMAP_30D.md](../roadmap/APPSTAFF_09_PUBLICATION_ROADMAP_30D.md) | Roadmap executável 30 dias                 |
