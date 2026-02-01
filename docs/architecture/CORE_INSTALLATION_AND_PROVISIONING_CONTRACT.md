# Contrato de Instalação e Provisionamento — Terminais

**Propósito:** Define formalmente o acto de soberania que é a instalação de um terminal (TPV, KDS, AppStaff, Web operacional). Instalação não é download nem UI; é provisionamento, identidade, confiança, registro no Core, permissão e heartbeat. Subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) e [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md).

**Uso:** Qualquer alteração ao fluxo de provisionamento, registro de terminal, autorização ou invalidação de dispositivo deve respeitar este contrato.

---

## 1. Âmbito

Este contrato governa:

- O que constitui "instalação" de um terminal no sistema.
- Quem pode provisionar, registrar e autorizar terminais.
- O que um terminal deve apresentar ao Core para ser considerado instalado e activo.
- O que o Core exige antes de aceitar comandos de um terminal.

Este contrato **não** governa:

- O ritual de nascimento do sistema (Bootstrap). Ver [BOOTSTRAP_CONTRACT.md](./BOOTSTRAP_CONTRACT.md).
- A identidade de humanos (staff). Ver [CORE_APPSTAFF_IDENTITY_CONTRACT.md](./CORE_APPSTAFF_IDENTITY_CONTRACT.md).
- O detalhe de hardware ou PWA de um terminal específico. Ver [TPV_INSTALLATION_CONTRACT.md](./TPV_INSTALLATION_CONTRACT.md) para TPV/KDS como superfície.
- Heartbeat e liveness. Ver [CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md](./CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md).

---

## 2. O que governa

| Dimensão | Regra |
|----------|--------|
| **Provisionamento** | O Core decide se um dispositivo ou superfície pode ser provisionado. O Kernel executa a persistência e o isolamento por tenant. Nenhum terminal opera como "instalado" sem registro no Core. |
| **Identidade do terminal** | O terminal apresenta identidade (dispositivo ou superfície) conforme definido pelo Core. O Core é a autoridade para validar essa identidade. Ver [CORE_IDENTITY_AND_TRUST_CONTRACT.md](./CORE_IDENTITY_AND_TRUST_CONTRACT.md). |
| **Chave de confiança** | O Core emite ou valida chaves de confiança. Um terminal sem chave válida não é autorizado a enviar comandos ou ler dados operacionais. |
| **Registro no Core** | O registro do terminal (quem é, a que tenant pertence, que papel tem) é persistido pelo Core. A árvore do Command Center (Terminals) reflecte apenas terminais registados e, quando aplicável, com heartbeat válido. |
| **Permissão por papel** | O Core atribui permissões por papel (TPV, KDS, AppStaff, Web). Um terminal só pode executar acções permitidas pelo seu papel e tenant. |
| **Invalidação** | O Core pode invalidar um terminal (revogar registro ou confiança). Um terminal invalidado deixa de ser autorizado; a UI deve reflectir "não instalado" ou "não autorizado". |

---

## 3. O que não governa

- Conteúdo de pedidos, pagamentos ou tarefas (outros contratos Core).
- Design da UI do "botão instalar" (Design System, OUC).
- Rede, conectividade ou protocolo de transporte (infraestrutura).

---

## 4. Quem obedece

- **Terminais (TPV, KDS, AppStaff, Web operacional):** devem obter provisionamento e registro no Core antes de operar como instalados; devem apresentar identidade e chave de confiança conforme definido pelo Core.
- **Command Center (Web):** deve mostrar na árvore apenas terminais registados e, quando aplicável, com estado de liveness conforme [CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md](./CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md).
- **Kernel:** executa persistência e gates; não decide quem é provisionado; aplica decisões do Core.

---

## 5. Proibição de bypass

É proibido:

- Permitir que um terminal opere como "instalado" ou autorizado sem registro no Core.
- Permitir que um terminal sem chave de confiança válida envie comandos ou leia dados operacionais.
- Tratar "download" ou "abrir PWA" como equivalente a "instalação" sem passar por provisionamento e registro no Core.
- Permitir que qualquer sistema externo (BaaS, terceiro) seja autoridade para provisionamento ou registro; apenas o Core o é.

---

## 6. Referências

- [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md) — Instalação como acto de soberania.
- [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md) — Terminais na árvore como "registados".
- [CORE_IDENTITY_AND_TRUST_CONTRACT.md](./CORE_IDENTITY_AND_TRUST_CONTRACT.md) — Identidade e chave de confiança do terminal.
- [CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md](./CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md) — Heartbeat e health check.
- [TPV_INSTALLATION_CONTRACT.md](./TPV_INSTALLATION_CONTRACT.md) — Detalhe TPV/KDS (PWA, hardware).

---

*Contrato de instalação e provisionamento. Alterações que permitam terminais não registados ou não autorizados a operar violam este contrato.*
