## Ritual de Validação Pós-DROP LEGACY (LOCAL)

Plano para validar que o sistema continua operacional após o DROP LEGACY, focado em **verdade operacional**, não em UX ou features futuras. Não fazer correções durante o teste; apenas observar e registar.

**Pré-requisito:** Smoke automático passou: `bash scripts/test_post_drop_local.sh` (Docker Core, tabelas gm_%, testes, http://localhost:5175). Ver [USO_REAL_PROLONGADO_PILOTO.md](../ops/USO_REAL_PROLONGADO_PILOTO.md) § 2.1 e [FASE_2.5_USO_REAL_FREEZE.md](../plans/FASE_2.5_USO_REAL_FREEZE.md).

---

## 1. Preparação (30s)

- **Mindset:** "Estou a validar verdade operacional, não UX nem promessas."
- Garantir que o ritual de DROP já foi executado e carimbado em [`docs/ops/DB_TABLE_CLASSIFICATION.md`](../ops/DB_TABLE_CLASSIFICATION.md).

---

## 2. Infra / Docker (1 min)

- **Comando:**
  - `docker compose -f docker-core/docker-compose.core.yml ps`
- **Esperado:**
  - Postgres (`chefiapp-core-postgres`) **healthy**.
  - Nginx / PostgREST / Realtime **Up**.
  - Nenhum container em restart loop.
- **Critério:**
  - Se falhar aqui → **parar tudo**, não avançar para os passos seguintes.

---

## 3. Backend / DB sanity (30s)

- **Comando:**
  - `docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "\dt"`
- **Esperado:**
  - Tabelas **CORE** e **OPERATIONAL** presentes.
  - Nenhuma tabela LEGACY que foi dropada voltou a aparecer.
  - Nenhum erro de schema.

---

## 4. Frontend sobe limpo (30s)

- **Comandos:**
  - `cd merchant-portal`
  - `npm run dev`
- **URL:**
  - `http://localhost:5175/app/dashboard` (porta oficial do merchant-portal; ver `vite.config.ts` ou variável `VITE_PORT`)
- **Esperado:**
  - Dashboard abre **sem loop**.
  - Nenhum erro vermelho no console do browser.
  - Logs silenciosos (sem spam de CoreHealth / Preflight).

---

## 5. Autoridade de navegação (1 min)

### 5.1 Dashboard

- Acessar `/app/dashboard`.
- **Esperado:**
  - Abre direto.
  - Não aparece landing, demo ou onboarding antigo.

### 5.2 Install

- Acessar manualmente `/app/install`.
- **Esperado:**
  - Página abre.
  - Não redireciona para `/`.
  - Ritual de instalação disponível.
- **Falha soberana:**
  - Se voltar para landing → registar como **falha de soberania**.

---

## 6. Ritual de Terminais (2 min)

### 6.1 Instalar TPV

- Na UI de instalação:
  - Clicar **"Instalar TPV"**.
  - Confirmar instalação.
- **Esperado:**
  - TPV marcado como instalado.
  - Sem reload infinito.
  - Sem erro de API.

### 6.2 Abrir TPV

- Acessar `/op/tpv`.
- **Esperado:**
  - TPV abre (mesmo em versão minimal).
  - Lista de produtos / estado coerente.
  - Nenhum erro de DB no console.

---

## 7. KDS (1 min)

- Acessar `/op/kds`.
- **Esperado:**
  - KDS abre.
  - Lista de pedidos vazia ou consistente com o estado actual.
  - Nenhum erro "relation does not exist".

---

## 8. Pedido real (2 min)

### 8.1 No TPV

- Criar um pedido.
- Confirmar.

### 8.2 No KDS

- Verificar que o pedido aparece.
- Mudar o estado (ex.: novo → em preparo).
- **Esperado:**
  - Pedido flui TPV → KDS.
  - Sem erros durante o fluxo.
  - Estado consistente entre TPV e KDS.

---

## 9. Turno / Operador (1 min)

- Abrir turno (se o fluxo existir na UI).
- Voltar ao dashboard.
- **Esperado:**
  - Header mostra operador / turno ativo.
  - Kernel reflete estado (Pronto / Bloqueado conforme o caso).

---

## 10. Logs (30s)

- Ver console do browser.
- Ver logs relevantes do backend/Core (quando disponíveis).
- **Esperado:**
  - Nenhum spam repetitivo.
  - Nenhum erro de tabela inexistente.
  - Logs apenas em transições reais (abrir página, criar pedido, mudar estado, etc).

---

## 11. Critério Final

- **Se TODOS os passos acima passarem:**
  - Resultado: **"Passou tudo — DROP VALIDADO"**.
- **Se QUALQUER passo falhar:**
  - Resultado: **"Quebrou aqui:"** + **1 screenshot ou 1 log** do ponto de falha.
  - Não tentar corrigir durante este ritual; apenas registar.

---

## 12. Escopo explícito (o que NÃO testar agora)

- UX bonita / polimento visual.
- Performance.
- Features futuras não cobertas pelo contrato atual.
- Multi-restaurante.
- Faturação avançada.

---

## 13. Próximo passo após o ritual

- Ao terminar, responder apenas com **uma frase**, no formato:
  - "**Passou tudo.**"
  - ou
  - "**Quebrou aqui:**" + (screenshot ou log) + (rota em que ocorreu) + (ação que disparou a falha).

A partir daí, o sistema entra oficialmente em **uso real consciente**, com o DROP LEGACY validado operacionalmente ou com um ponto concreto de quebra para investigação posterior.

---

## 14. Notas sobre serviços auxiliares (MinIO / pgAdmin)

- Loops ou falhas em serviços auxiliares como **MinIO** e **pgAdmin** podem ocorrer e **não contam, por si só, como falha soberana do Core** (TPV/KDS/Core/PostgREST), mas devem ser tratados como **higiene de infra**.
- Contam como **falha de soberania**, a registar neste ritual:
  - Loops ou redirects errados em `/app/install` (instalação de TPV/KDS).
  - Impossibilidade de abrir `/app/dashboard`, `/op/tpv` ou `/op/kds`.
  - Erros de DB nas rotas de operação (ex.: "relation does not exist" ao usar TPV/KDS).
- Para o critério de **silêncio estrutural** e anti-spam de logs, ver também `docs/ops/OBSERVABILITY_POST_CUT.md`.

