# Resposta a Incidentes — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T40-5 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Processo geral de resposta a incidentes de segurança e operacionais. Generaliza e complementa o playbook específico [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](./INCIDENT_PLAYBOOK_STOLEN_DEVICE.md). Documento canónico para ops e suporte.

---

## 1. Âmbito

Este documento define:

- **Fases** da resposta: Deteção, Contenção, Mitigação, Recuperação, Pós-incidente.
- **Tipos de incidente** considerados (sessão comprometida, vazamento de dados, indisponibilidade, abuso).
- **Quem faz o quê:** Dono do incidente, suporte, engenharia, jurídico/DPO quando aplicável.
- **Registo:** Todo o incidente deve ser registado (abertura, ações, encerramento) para auditoria; ver [AUDIT_LOG_SPEC.md](../architecture/AUDIT_LOG_SPEC.md) quando implementado.

**Playbooks específicos:** Cenários concretos (ex.: dispositivo roubado) têm playbooks dedicados; este doc é o processo geral.

---

## 2. Tipos de incidente

| Tipo | Descrição | Exemplo | Prioridade |
|------|-----------|---------|------------|
| **Sessão / identidade comprometida** | Uso indevido de credenciais ou token (ex.: dispositivo roubado, phishing) | Staff com app logado; atacante usa token | Alta |
| **Vazamento ou acesso indevido a dados** | Dados de um tenant expostos a outro ou a terceiros; acesso além do autorizado | Bug em API; falha de RLS | Crítica |
| **Indisponibilidade ou negação de serviço** | Serviço em baixo ou degradado (ex.: DDoS, falha de infra) | Core ou Auth indisponíveis | Alta |
| **Abuso ou uso indevido** | Uso do sistema em violação dos termos (ex.: spam, fraude operacional) | Pedidos falsos em massa; export abusivo | Média |
| **Vulnerabilidade ou supply chain** | Vulnerabilidade crítica conhecida; dependência comprometida | CVE em dependência; imagem Docker maliciosa | Alta |

---

## 3. Fases da resposta

### 3.1 Deteção

- **Fontes:** Alertas (Sentry, monitorização, health-checks); reporte do cliente ou do utilizador; auditoria interna.
- **Ação:** Registo do evento (data, tipo, tenant se aplicável, contacto); classificação inicial (severidade, tipo); atribuição de dono do incidente.
- **Registo:** Abrir registo de incidente (ex.: `security_incident_opened` em app_logs ou ferramenta de incidentes).

### 3.2 Contenção

- **Objetivo:** Impedir que o impacto aumente.
- **Exemplos:**
  - **Sessão comprometida:** Revogar sessões do utilizador; desativar membro (disable_at); ver [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](./INCIDENT_PLAYBOOK_STOLEN_DEVICE.md).
  - **Vazamento de dados:** Identificar vetor (API, bug); desativar funcionalidade ou corrigir em hotfix; notificar responsável (cliente) se dados pessoais afetados.
  - **Indisponibilidade:** Ativar runbooks (failover, rollback); comunicar estado aos clientes afetados.
  - **Abuso:** Bloquear conta ou tenant; rate limit; revisar permissões.
- **Ação:** Documentar todas as ações de contenção (quem, quando, o quê).

### 3.3 Mitigação (dano já ocorrido)

- **Objetivo:** Reduzir o dano já causado (ex.: cancelar pedidos falsos, reverter alterações indevidas).
- **Exemplos:** Queries de auditoria (pedidos, logs) para identificar âmbito; cancelar ou marcar pedidos suspeitos; comunicar ao cliente e, se aplicável, ao DPO.
- **Ação:** Definir janela do incidente (primeiro e último evento relevante); documentar decisões.

### 3.4 Recuperação

- **Objetivo:** Restabelecer operação normal e confiança.
- **Exemplos:** Reativar utilizador apenas após reset de senha e novo login; publicar correção; restaurar serviço; comunicar resolução.
- **Ação:** Checklist de recuperação (ex.: utilizador reativado com novo login; sessões antigas invalidadas); encerrar incidente (`security_incident_closed`).

### 3.5 Pós-incidente

- **Objetivo:** Aprender e melhorar; cumprir obrigações (notificação à autoridade, ao titular).
- **Ações:** Post-mortem interno (causa raiz, ações preventivas); atualizar playbooks e documentação; notificação à CNPD/AEPD e aos titulares se obrigatório (RGPD art. 33–34); partilha com cliente (restaurante) conforme contrato.

---

## 4. Quem faz o quê (resumo)

| Papel | Responsabilidade |
|-------|-------------------|
| **Dono do incidente** | Coordena contenção, mitigações e recuperação; garante registo e comunicação |
| **Suporte** | Primeiro contacto com cliente/utilizador; escalar para engenharia quando técnico |
| **Engenharia** | Contenção técnica (revogar sessões, hotfix, runbooks); análise forense leve; correção |
| **Jurídico / DPO** | Avaliar necessidade de notificação (RGPD); comunicação a autoridades e titulares |
| **Cliente (restaurante)** | Bloquear staff no portal (botão "Bloquear staff"); colaborar em auditoria e recuperação |

---

## 5. Registo e auditoria

- Todo o incidente deve ter: **abertura** (tipo, tenant, dono, timestamp), **ações** (quem, quando, o quê), **encerramento** (resultado, resumo).
- Eventos de segurança (ex.: user_disabled, session_revoked, security_incident_opened/closed) devem ser registados em app_logs ou no sistema de audit log conforme [AUDIT_LOG_SPEC.md](../architecture/AUDIT_LOG_SPEC.md).
- Consultar [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](./INCIDENT_PLAYBOOK_STOLEN_DEVICE.md) para queries de auditoria e checklist no cenário de dispositivo roubado.

---

## 6. Referências

- [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](./INCIDENT_PLAYBOOK_STOLEN_DEVICE.md) — Playbook: dispositivo roubado (sessão ativa)
- [THREAT_MODEL.md](../architecture/THREAT_MODEL.md) — Ameaças e mitigações
- [AUDIT_LOG_SPEC.md](../architecture/AUDIT_LOG_SPEC.md) — Especificação da trilha de auditoria
- [TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md) — Isolamento e RLS
- [RUNBOOKS.md](./RUNBOOKS.md) (índice) — Alertas, health-checks, rollback
- [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md)
