# Contrato de Identidade e Confiança — Terminais

**Propósito:** Define formalmente quem é a autoridade para a identidade de terminais (dispositivos e superfícies) e para chaves de confiança. O Core valida identidade e chaves; nenhum terminal opera com autoridade sem identidade válida e confiança estabelecida. Subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) e [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md).

**Uso:** Qualquer alteração a credenciais de terminal, validação de dispositivo ou chaves de confiança deve respeitar este contrato.

---

## 1. Âmbito

Este contrato governa:

- Quem é a autoridade para a identidade de um terminal (dispositivo ou superfície TPV, KDS, AppStaff, Web operacional).
- Quem emite ou valida chaves de confiança para terminais.
- O que um terminal deve apresentar para ser considerado identificado e confiável.
- O que o Core exige antes de aceitar que um pedido ou acção venha de um terminal válido.

Este contrato **não** governa:

- Identidade de humanos (staff, utilizador). Ver [CORE_APPSTAFF_IDENTITY_CONTRACT.md](./CORE_APPSTAFF_IDENTITY_CONTRACT.md).
- Autenticação de sessão de utilizador (login). Isso é camada de auth (Supabase ou futuro Core auth); este contrato é sobre **terminal como entidade**.
- Provisionamento e registro (quem é registado). Ver [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md).

---

## 2. O que governa

| Dimensão | Regra |
|----------|--------|
| **Autoridade** | O Core é a autoridade para identidade de terminais e para chaves de confiança. O Kernel executa gates e persistência; não define quem é "este dispositivo". |
| **Identidade do terminal** | Um terminal apresenta um identificador (dispositivo ou superfície) conforme esquema definido pelo Core. O Core valida esse identificador contra o registro de provisionamento. |
| **Chave de confiança** | O Core emite ou associa chaves de confiança a terminais registados. Pedidos ou comandos sem chave válida são rejeitados pelo Core. |
| **Revogação** | O Core pode revogar a confiança de um terminal. Após revogação, o terminal deixa de ser autorizado até novo provisionamento ou re-emissão. |
| **Sem inventar identidade** | Nenhum terminal pode inventar ou alterar a própria identidade ou chave de confiança de forma que contorne o Core. |

---

## 3. O que não governa

- Conteúdo de pedidos, pagamentos ou tarefas.
- Heartbeat ou liveness (ver [CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md](./CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md)).
- UI de login ou selecção de restaurante (Design System, fluxos de auth).

---

## 4. Quem obedece

- **Terminais:** devem apresentar identidade e chave de confiança válidas para todas as operações que exijam autoridade. Não podem falsificar identidade nem chave.
- **Core:** valida identidade e chave em cada pedido que exija autoridade; rejeita pedidos sem credenciais válidas.
- **Kernel:** aplica gates (ex.: isolamento por tenant); não emite chaves; obedece às decisões do Core sobre validade.

---

## 5. Proibição de bypass

É proibido:

- Permitir que um terminal opere com autoridade sem identidade válida e chave de confiança aceite pelo Core.
- Permitir que qualquer sistema externo (BaaS, terceiro) seja autoridade para identidade ou chaves de terminais; apenas o Core o é.
- Permitir que um terminal altere ou falsifique a própria identidade ou chave de forma a obter acesso não autorizado.
- Tratar "mesmo IP" ou "mesma sessão browser" como substituto de identidade de terminal quando o Core exige identificador e chave.

---

## 6. Referências

- [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md) — Identidade do terminal, chave de confiança.
- [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md) — Provisionamento e registro; identidade e confiança são parte do acto de instalação.

---

*Contrato de identidade e confiança para terminais. Alterações que permitam terminais sem identidade ou chave válida a operar com autoridade violam este contrato.*
