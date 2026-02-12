# Pilot Closure — Terminal Identity Minimal Contract (v0)

**Purpose:** Definir identidade de terminal para o piloto sem complexidade criptográfica.

**Status:** REQUIRED FOR PILOT. OPTIONAL BEYOND PILOT.
**Authority:** Docker Core (via configuração estática).

---

## 1. Identidade Estática

Para o piloto, a identidade é um atributo estático confiado:

- **Identificador:** `terminal_id` (string/UUID).
- **Persistência:** Salvo no armazenamento local do dispositivo ou arquivo de configuração (`.env`, `config.json`).
- **Atribuição:** Manual. O técnico define "Este é o TPV-01".

## 2. Modelo de Confiança (Trust Model)

- **Trust on First Use (Simplificado):** O Core aceita comandos vindos de um `terminal_id` conhecido/cadastrado.
- **Sem Criptografia de Sessão:** Não é exigida rotação de chaves, tokens JWT assinados ou mTLS para a identidade do terminal em si (apenas para o transporte, se aplicável).
- **Sem Login de Terminal:** O terminal não faz "login" com usuário e senha. Ele _é_ o terminal.

## 3. Proibições Explícitas (Pilot Constraints)

- **PROIBIDO:** Identidade Dinâmica (IP-based, fingerprinting de browser).
- **PROIBIDO:** Confiança baseada em Login de Usuário (o terminal deve ter identidade mesmo sem usuário logado).
- **PROIBIDO:** Rotação de Identidade (o ID deve ser fixo durante a vida do piloto).

## 4. Relação com AppStaff

Para AppStaff, a identidade do dispositivo é secundária à identidade do _humano_ (usuário logado). No entanto, para fins de auditoria técnica, o AppStaff deve enviar um `device_id` estático gerado na instalação do app.

## 5. Device Gate e bloqueio remoto (Fase 1 — 1000-ready)

- **Device Gate obrigatório:** TPV e KDS só iniciam quando o dispositivo instalado está ativo na Config (`gm_equipment`). Quando `TERMINAL_INSTALLATION_TRACK` está ativo, não há entrada sem passar no Device Gate. Ver [CONFIG_RUNTIME_CONTRACT.md](../contracts/CONFIG_RUNTIME_CONTRACT.md) §2.2.
- **Bloqueio remoto:** Desativar o equipamento na Config (`gm_equipment.is_active = false`) equivale a bloqueio remoto: o Device Gate nega e o ecrã de bloqueio é mostrado. Sem necessidade de ação no dispositivo.

---

**Conclusão:** Identidade é um crachá fixo. Quem tem o crachá entra. Segurança física e de rede é assumida como controle compensatório para o piloto.
