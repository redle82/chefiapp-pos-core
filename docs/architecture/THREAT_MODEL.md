# Threat Model — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T40-1 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Modelo de ameaças, ativos e mitigações para priorização de controles de segurança. Documento canónico para auditoria e backlog de hardening. Implementação de controles = Onda 2/3.

---

## 1. Âmbito

Este documento descreve:

- **Ativos** relevantes (dados, sistemas, reputação).
- **Ameaças** plausíveis (STRIDE ou equivalente simplificado).
- **Mitigações** existentes ou planeadas.
- **Backlog** de controles (prioridade e dono a definir).

Não substitui uma avaliação de risco formal; serve de referência para produto, engenharia e auditoria.

---

## 2. Ativos

| Ativo | Descrição | Confidencialidade | Integridade | Disponibilidade |
|-------|------------|-------------------|-------------|-----------------|
| **Dados multi-tenant** | Pedidos, turnos, menu, equipa, configuração por restaurante | Alto (isolamento obrigatório) | Alto | Alto |
| **Identidade e sessões** | JWT, refresh tokens, membros (gm_restaurant_members) | Alto | Alto | Médio |
| **Dados financeiros/auditoria** | Movimentos de caixa, pagamentos, logs de auditoria | Alto | Crítico (imutabilidade) | Alto |
| **Infraestrutura Core** | API, Postgres, Docker Core, rede interna | — | Alto | Alto |
| **Reputação** | Confiança do cliente (restaurante) e do utilizador final (staff) | Alto | — | — |

---

## 3. Ameaças e mitigações (resumo)

### 3.1 Vazamento entre tenants (cross-tenant)

| Ameaça | Cenário | Mitigação existente | Gap / backlog |
|--------|---------|---------------------|---------------|
| Leitura de dados de outro restaurante | Atacante ou bug expõe dados de tenant B ao tenant A | RLS 100% tabelas multi-tenant; `restaurant_id` em todas as queries; fail-closed | Testes E2E de isolamento em todo PR; revisão de novas tabelas |
| Escrita em outro tenant | Injeção de `restaurant_id` ou bypass de contexto | Backend deriva `restaurant_id` do Auth Context; nunca confiar no cliente em escrita | Auditoria de todos os pontos de escrita |
| IDs previsíveis | Enumeração de entidades entre tenants | UUIDv4 para entidades externas | Verificar ausência de sequential IDs expostos |

### 3.2 Compromisso de sessão / identidade

| Ameaça | Cenário | Mitigação existente | Gap / backlog |
|--------|---------|---------------------|---------------|
| Dispositivo roubado (sessão ativa) | Atacante usa token em app aberto | RLS limita dano ao tenant; playbook revogar sessão / desativar membro; [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](../ops/INCIDENT_PLAYBOOK_STOLEN_DEVICE.md) | Automatizar revogação em massa; alertas de login anómalo |
| Roubo de credenciais | Phishing, reutilização de senha | Supabase Auth; MFA quando disponível | Promover MFA para Owner/Manager |
| Token longo ou não revogável | Uso indevido após fim de relação laboral | Sessões curtas; refresh tokens; desativar membro (disabled_at) | Política de revogação ao desligar colaborador |

### 3.3 Integridade de dados (alteração ou apagamento indevido)

| Ameaça | Cenário | Mitigação existente | Gap / backlog |
|--------|---------|---------------------|---------------|
| Alteração de dados financeiros/auditoria | Overwrite de pedidos, pagamentos, logs | [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md); correções por evento compensatório | Trilha de auditoria imutável (AUDIT_LOG_SPEC); implementação Onda 2/3 |
| Escalação de privilégios (ver/editar além do papel) | Manager aceder a Billing; Waiter aceder a Daily Total | Matriz de acesso (Owner/Manager/Waiter/KDS); RLS por papel | [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md); revisão de novas funcionalidades |

### 3.4 Disponibilidade e negação de serviço

| Ameaça | Cenário | Mitigação existente | Gap / backlog |
|--------|---------|---------------------|---------------|
| DDoS ou abuso de API | Sobrecarga do Core ou da Auth | Rate limiting; rede isolada; Core em Docker | Definir SLO e alertas; runbooks |
| Ransomware / destruição de dados | Perda de dados ou indisponibilidade | Backups; disaster recovery; [ops/disaster-recovery.md](../ops/disaster-recovery.md) | Testes de restore; backup imutável |

### 3.5 Cadeia de fornecedores e dependências

| Ameaça | Cenário | Mitigação existente | Gap / backlog |
|--------|---------|---------------------|---------------|
| Compromisso de Supabase / BaaS | Acesso indevido a dados ou auth | RLS; JWT com claims mínimos; contrato DPA | Revisão periódica de permissões e dependências |
| Dependência maliciosa ou vulnerável (npm, etc.) | Supply chain attack | Auditoria de dependências; lockfile | Automatizar (ex.: Dependabot, auditoria em CI) |

---

## 4. Matriz de mitigações (E1 Onda 3)

Cada ameaça está mapeada a mitigações, controles existentes ou em falta, dono e estado em **[THREAT_MODEL_MITIGATION_MATRIX.md](./THREAT_MODEL_MITIGATION_MATRIX.md)**. Usar essa matriz para priorizar o backlog e auditoria.

---

## 5. Resumo de prioridades (backlog) — ver também matriz

| Prioridade | Controle | Referência |
|------------|----------|------------|
| 1 | Trilha de auditoria imutável (quem fez o quê, quando) | [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md); Onda 2/3 |
| 2 | Testes E2E de isolamento em todo PR | [TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md) |
| 3 | MFA para Owner/Manager | Produto / Auth |
| 4 | Revisão de novas tabelas/APIs para RLS e tenant context | Processo de PR |
| 5 | Rate limiting e SLO/alertas | Ops; [SLO_SLI.md](./SLO_SLI.md); rate limit em Core + cliente: [RATE_LIMITING_AND_INPUT_VALIDATION.md](./RATE_LIMITING_AND_INPUT_VALIDATION.md) |

---

## 6. Revisão

- Este modelo deve ser revisto quando houver alteração significativa de arquitetura, novos vectores de ataque conhecidos ou após incidente.
- Mitigações e backlog devem ser atualizados em função de testes de penetração ou auditorias externas.

---

**Riscos operacionais (POS autónomo):** Latência e autoridade cognitiva (override, transparência) estão formalizados em [AUTONOMOUS_POS_RISK_REGISTER_AND_BOWTIE.md](../audit/AUTONOMOUS_POS_RISK_REGISTER_AND_BOWTIE.md) — risk register, Bowtie, thresholds e protocolos de teste. Este THREAT_MODEL foca ameaças de segurança; aquele documento complementa para riscos operacionais.

**Referências:** [THREAT_MODEL_MITIGATION_MATRIX.md](./THREAT_MODEL_MITIGATION_MATRIX.md) · [RATE_LIMITING_AND_INPUT_VALIDATION.md](./RATE_LIMITING_AND_INPUT_VALIDATION.md) · [TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md) · [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) · [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) · [INCIDENT_RESPONSE.md](../ops/INCIDENT_RESPONSE.md) · [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
