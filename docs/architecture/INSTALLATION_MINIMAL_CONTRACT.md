# Pilot Closure — Installation Minimal Contract (v0)

**Purpose:** Definir estritamente o que significa "instalação" durante o Piloto Fechado.

**Status:** REQUIRED FOR PILOT. OPTIONAL BEYOND PILOT.
**Authority:** Docker Core.

---

## 1. Escopo de Instalação (Minimal)

Para fins de encerramento do piloto, uma "instalação válida" consiste unicamente na seguinte topologia:

1.  **1 (Um) Docker Core:** Instância única do backend (PostgreSQL + PostgREST) rodando em máquina local ou servidor dedicado. A API Gateway (PostgREST) é exposta obrigatoriamente no porto **3001**.
2.  **1 (Um) TPV (Terminal Ponto de Venda):** Uma instância da aplicação `sovereign-terminals/tpv` ou `merchant-portal` em modo TPV.
3.  **1 (Um) KDS (Kitchen Display System):** Uma instância da aplicação `sovereign-terminals/kds`.
4.  **2 a 5 AppStaff:** Instâncias do aplicativo mobile rodando em dispositivos iOS/Android.

Qualquer outra configuração (ex: múltiplos TPVs, múltiplos KDS, tablets de auto-atendimento) está **EXPLICITAMENTE FORA DO ESCOPO DO PILOTO**.

## 2. Processo de Instalação (Manual)

Não existe fluxo de "wizard" ou auto-discovery no piloto. A instalação é um ato manual de soberania:

1.**Provisionamento:** O operador (técnico) configura o Docker Core. 2.**Apontamento:** Os terminais são configurados manualmente (via `.env` ou settings locais) para apontar para o IP/URL do Docker Core. 3.**Validação:** A instalação é considerada "sucesso" se, e somente se, o terminal conseguir conectar ao Core e receber uma resposta de sucesso (HTTP 200/204) no endpoint de healthcheck ou configuração.

## 3. Regras de Falha

- **Terminal Invisível:** Se um terminal não aparece no Command Center ou logs do Core, ele é considerado **NÃO INSTALADO**.
- **Conectividade:** Falha de rede durante a instalação aborta o processo. Não há "offline setup".

## 4. O que NÃO ESTÁ INCLUÍDO (Out of Scope)

Para clareza jurídica e técnica, o seguinte **NÃO EXISTE** neste contrato de piloto:

- **Criptografia de Transporte:** Instalação assume rede local confiável ou VPN. (TLS opcional, não mandatório para fechar piloto).
- **Auto-Discovery:** Terminais não "acham" o servidor sozinhos.
- **QR Code Pairing:** Fluxo de pareamento visual está fora do escopo.
- **Gestão de Versão:** Não há verificação de compatibilidade de versão entre Terminal e Core durante a instalação.

---

**Conclusão:** Se os 4 tipos de nós acima estiverem comunicando, o sistema está "Instalado" para fins do Piloto.
