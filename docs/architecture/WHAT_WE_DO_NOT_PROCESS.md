# O que o ChefIApp™ não processa — Defesa legal e limites de scope

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T50-2 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Documento canónico que explicita o que o ChefIApp **não** processa nem armazena, para defesa legal, due diligence e alinhamento com clientes e reguladores.

---

## 1. Âmbito deste documento

Este documento declara **limites de processamento de dados** e **limites de produto** do ChefIApp. Não substitui a política de privacidade nem os termos de serviço; complementa-os como referência técnica e jurídica.

**Público-alvo:** Equipa jurídica, DPO, auditoria, clientes enterprise, due diligence.

---

## 2. O que o ChefIApp não é

| Categoria | Declaração |
|-----------|------------|
| **TPV genérico** | O ChefIApp não é um terminal de pagamento genérico. Orquestra operações de restaurante (KDS, tarefas, turnos, equipa); integra com TPV/pagamentos externos quando configurado, mas não processa dados de cartão (PAN, CVV, etc.) como responsável. |
| **ERP** | O ChefIApp não é um ERP de back-office. Não substitui contabilidade geral, inventário completo nem gestão de fornecedores fora do âmbito operacional do restaurante. |
| **Processador de pagamentos (PCI-DSS)** | O ChefIApp não armazena nem processa dados sensíveis de pagamento (cardholder data) no seu core. O processamento de pagamentos é delegado a processadores externos (PSP) conforme contrato com o cliente. |
| **Rede social ou marketing de terceiros** | O ChefIApp não processa dados para publicidade dirigida de terceiros nem vende dados a data brokers. |

---

## 3. Dados que o ChefIApp não processa (ou não é responsável por)

| Tipo de dado | Declaração |
|--------------|------------|
| **Dados de cartão (PAN, CVV, track)** | Não são armazenados nem processados pelo core ChefIApp. Pagamentos são tratados por PSP; o ChefIApp pode armazenar referências de transação (ID, valor, estado) para reconciliação, não dados de cartão. |
| **Dados de saúde (registos clínicos)** | O ChefIApp não processa dados de saúde para fins clínicos ou de seguro. Pode processar informação mínima de ausência/baixa quando necessária para gestão de turnos (ex.: “ausente por motivo X”), dentro do âmbito laboral e conforme instruções do cliente. |
| **Biometria** | O ChefIApp não recolhe nem processa dados biométricos (impressão digital, reconhecimento facial) para identificação ou controlo de acesso, salvo se o cliente integrar sistemas de terceiros sob sua própria responsabilidade. |
| **Dados de menores** | O ChefIApp não é dirigido a menores. O processamento de dados de colaboradores menores (ex.: em regime de formação) é da responsabilidade do cliente/empregador, que deve assegurar base legal e autorização. |
| **Dados para fins de crédito ou scoring** | O ChefIApp não usa dados pessoais para decisões de crédito, scoring ou seguros. |
| **Dados vendidos ou cedidos a terceiros para marketing** | O ChefIApp não vende nem cede dados pessoais a terceiros para marketing ou publicidade. |

---

## 4. Limites de responsabilidade

- **Cliente = responsável pelos dados:** O restaurante/cliente é o responsável pelo tratamento dos dados que introduz (equipa, horários, pedidos no seu contexto). O ChefIApp atua como processador quando aplicável (ex.: RGPD art. 28).
- **Integrações:** Dados que fluam para sistemas de terceiros (TPV, delivery, contabilidade) são governados pelos respetivos contratos e políticas; o ChefIApp documenta as integrações suportadas, não assume responsabilidade pelo tratamento fora do seu perímetro.
- **Conteúdo introduzido pelo utilizador:** Texto livre em notas, nomes de pratos, etc., é da responsabilidade do cliente; o ChefIApp não modera conteúdo além do necessário para operação e segurança do serviço.

---

## 5. O que o ChefIApp processa (resumo)

Para contexto, e sem substituir o [GDPR_MAPPING.md](./GDPR_MAPPING.md):

- **Identidade e acesso:** identificadores de utilizador, funções, associação a restaurante/location (multi-tenant).
- **Operação:** tarefas, turnos, check-in/check-out, pedidos, estado de KDS, menu, configuração do restaurante.
- **Auditoria e conformidade:** logs de eventos operacionais e de segurança conforme [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md).

Detalhe completo de categorias, finalidades e bases legais: [GDPR_MAPPING.md](./GDPR_MAPPING.md).

---

## 6. Revisão e aprovação

- **Revisão:** Este documento deve ser revisto com equipa jurídica/DPO antes de uso em contexto regulatório ou comercial.
- **Alterações:** Qualquer alargamento de tipos de dados processados deve ser refletido aqui e no GDPR_MAPPING; alterações ao scope de produto devem ser aprovadas conforme [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md).

---

**Referências:** [GDPR_MAPPING.md](./GDPR_MAPPING.md) · [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) · [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
