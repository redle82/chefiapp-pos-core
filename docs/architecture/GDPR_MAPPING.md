# Mapeamento GDPR — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T50-1 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Mapeamento de dados pessoais processados pelo ChefIApp: categorias, finalidades, bases legais (RGPD) e retenção. Documento canónico para DPO, auditoria e conformidade.

---

## 1. Âmbito

Este mapeamento cobre o processamento de dados pessoais no **core ChefIApp** (plataforma multi-tenant de orquestração operacional para restaurantes). Não cobre sistemas de terceiros integrados (TPV, delivery, contabilidade), que têm as suas próprias políticas e responsabilidades.

**Responsável pelo tratamento (em contexto B2B):** O cliente (restaurante/empresa) na qualidade de responsável; o ChefIApp atua como **processador** (RGPD art. 28) quando processa dados em nome do cliente.

---

## 2. Categorias de dados pessoais

| Categoria | Descrição | Exemplos |
|-----------|-----------|----------|
| **Identidade e conta** | Dados necessários para identificação e acesso ao sistema | Nome, email, identificador de utilizador, associação a restaurante/location (tenant) |
| **Função e organização** | Dados de contexto laboral/operacional | Função (role), permissões, equipa, local de trabalho |
| **Registo de atividade operacional** | Dados gerados no uso do sistema (turnos, tarefas, pedidos) | Check-in/check-out, tarefas atribuídas, eventos de KDS, timestamps |
| **Dados de auditoria** | Registos de ações para segurança e conformidade | Quem fez o quê, quando; logs de eventos (conforme [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md)) |
| **Conteúdo operacional** | Dados introduzidos pelo cliente (menu, notas) | Nomes de pratos, notas de pedido, configuração do restaurante — minimamente pessoais quando associados a utilizador |

---

## 3. Finalidades e bases legais (RGPD)

| Finalidade | Categorias de dados | Base legal (RGPD) | Nota |
|------------|----------------------|-------------------|------|
| Prestação do serviço (acesso, orquestração operacional) | Identidade, função, organização, atividade operacional | Art. 6(1)(b) — execução de contrato | Necessário para o serviço contratado |
| Gestão de turnos e tarefas | Identidade, função, atividade operacional | Art. 6(1)(b) e/ou (c) — contrato / obrigação legal | Conforme contexto laboral do cliente |
| Segurança e prevenção de fraude | Identidade, auditoria | Art. 6(1)(f) — interesse legítimo | Interesse do responsável e do processador |
| Cumprimento de obrigações legais (ex.: trabalho, fiscal) | Atividade operacional, auditoria | Art. 6(1)(c) — obrigação legal | Quando aplicável ao cliente |
| Melhoria do produto (analytics internos, não revenda) | Dados agregados ou pseudonimizados | Art. 6(1)(f) — interesse legítimo | Sem identificação direta para terceiros; ver política de dados |

---

## 4. Retenção

| Tipo de dado | Critério de retenção | Referência |
|--------------|----------------------|------------|
| Dados de conta e identidade | Enquanto a conta existir; após fim de contrato conforme política de purge e obrigações legais | Contrato de processamento; [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) |
| Registos operacionais (turnos, tarefas, pedidos) | Conforme política do Core; dados financeiros e de auditoria sujeitos a imutabilidade e retenção definida pelo Core | [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) |
| Logs de auditoria | Período definido pelo Core; não inferior ao necessário para obrigações legais e disputas | Idem |
| Dados pseudonimizados para analytics | Conforme política interna; sem identificação reversível além do necessário | A definir em política de dados |

**Nota:** O documento técnico [RETENTION_POLICY.md](./RETENTION_POLICY.md) (Onda 1) consolidará prazos concretos por categoria quando aprovados.

---

## 5. Destinatários e transferências

| Destinatário | Finalidade | Transferência internacional |
|--------------|------------|-----------------------------|
| Infraestrutura (hospedagem do serviço) | Execução do serviço | Conforme DPA e cláusulas contratuais (ex.: SCC); a documentar por ambiente |
| Processadores de pagamentos (PSP) | Pagamentos; ChefIApp não processa dados de cartão | Responsabilidade do cliente/PSP |
| Entidades subcontratadas pelo ChefIApp | Conforme DPA e art. 28 RGPD | Idem |

**Transferências fora do EEE:** Documentadas no contrato de processamento e DPA; cláusulas tipo da Comissão ou mecanismos equivalentes quando aplicável.

---

## 6. Direitos dos titulares (DSR)

Os direitos de acesso, retificação, apagamento, portabilidade, limitação e oposição são exercidos perante o **responsável** (cliente). O ChefIApp, como processador, apoia o cumprimento conforme [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) (processo e prazos).

---

## 7. Revisão

- Este mapeamento deve ser revisto com DPO/jurídico e atualizado quando houver alteração de finalidades, categorias de dados ou bases legais.
- Alterações devem ser refletidas no [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md) e, se aplicável, nos termos e política de privacidade.

---

**Referências:** [WHAT_WE_DO_NOT_PROCESS.md](./WHAT_WE_DO_NOT_PROCESS.md) · [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) · [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) · [RETENTION_POLICY.md](./RETENTION_POLICY.md) (a criar) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
