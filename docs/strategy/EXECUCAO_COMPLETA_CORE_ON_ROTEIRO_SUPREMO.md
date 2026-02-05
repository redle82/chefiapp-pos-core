# Execução completa — Core ON + Roteiro Supremo

**Objetivo:** Executar o Roteiro Supremo com Core ON, validando o ciclo TPV → KDS → Fecho, mantendo o Core Docker ligado no final (estado operacional real).

**Contexto:** Core Docker configurado como ENTERPRISE; seed aplicado (restaurante, menu, caixa, membro owner). Frontend em <http://localhost:5175>. Core é autoridade única (Postgres + PostgREST + Realtime).

---

## Passos (ordem exata)

### 1) Subir o Core (se já estiver no ar, apenas validar)

```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

### 2) Validar serviços do Core

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/
```

**Critério:** HTTP 200 e containers ativos.

### 3) Abrir o Dashboard

- **URL:** <http://localhost:5175/dashboard>
  **Critério esperado:** Cartão Operação = Pronto (verde); nenhum blocker CORE_OFFLINE; botão Abrir TPV ativo.

### 4) Abrir TPV

- Clicar em **Abrir TPV** ou ir a <http://localhost:5175/op/tpv>

### 5) No TPV, iniciar operação

- Clicar **Abrir Turno**
  **Critério:** Toast de sucesso; produtos carregados; nenhuma mensagem de Core offline.

### 6) Criar pedido

- Selecionar **Mesa** ou **Balcão**; adicionar **1 produto**
  **Critério:** Pedido nasce (estado OPEN).

### 7) Enviar à cozinha

- Clicar **Preparar / Enviar à cozinha**
  **Critério:** Pedido muda para IN_PREP.

### 8) Abrir KDS

- **URL:** <http://localhost:5175/op/kds>
  **Critério:** Pedido visível na cozinha.

### 9) Na KDS

- **Marcar item como Pronto**
  **Critério:** Item/pedido passa para READY.

### 10) Voltar ao TPV

**Critério:** Pedido aparece como READY.

### 11) Servir pedido

**Critério:** Transição correta (READY → SERVED ou equivalente).

### 12) Pagar

- Executar fluxo de pagamento
  **Critério:** Pagamento aceite; pedido fechado.

### 13) Validar estado final

**Critério:** Pedido = CLOSED; caixa continua aberto; turno ativo; nenhum erro de estado.

### 14) Validar coerência global

- Dashboard, TPV e KDS mostram a mesma realidade; nenhum refresh forçado necessário.

### 15) Encerramento

- **NÃO** desligar o Core. Core permanece ON para testes contínuos.

---

## Roteiro rápido: Criar pedido no TPV e ver no KDS

**TPV (TPV Mínimo)** = `/op/tpv` · **KDS (KDS Mínimo)** = `/op/kds` (as rotas “mini” redirecionam para estas).

1. **Core a correr**
   `cd docker-core && docker compose -f docker-compose.core.yml up -d`

2. **Abrir TPV**
   <http://localhost:5175/op/tpv>

   - Se aparecer “Caixa Fechado”, clicar **Abrir Turno** até ver sucesso.
   - Confirmar que há produtos na lista (ex.: Bruschetta, Pizza, Água).

3. **Criar pedido no TPV**

   - Escolher **Balcão** (ou uma mesa).
   - Clicar em **1 ou mais produtos** para adicionar ao carrinho.
   - Clicar em **Criar pedido** / finalizar.
   - Ver mensagem de sucesso (ex.: “Pedido #… criado” ou “pago (cash)”).

4. **Abrir KDS**
   <http://localhost:5175/op/kds>

   - O pedido deve aparecer na lista (status OPEN). Pedidos já pagos (CLOSED) não aparecem — criar no TPV e abrir/Actualizar o KDS antes de pagar.
   - Se aparecer “Nenhum pedido ativo”, clicar **Actualizar**; a consola deve mostrar `[KDS] loadOrders: N pedido(s) ativo(s) para restaurante 00000000…` com N ≥ 1.

5. **No KDS (opcional)**
   - Clicar **Enviar à cozinha** no pedido → status IN_PREP.
   - **Marcar item como Pronto** → item READY.

**Nota:** TPV e KDS usam o mesmo restaurante (seed `00000000-0000-0000-0000-000000000100`) quando o backend é Docker; os pedidos criados no TPV aparecem no KDS para esse restaurante.

---

## Resultado esperado (binário)

- Estados fluem: **OPEN → IN_PREP → READY → CLOSED**
- Core é autoridade única
- Sistema operacional validado de ponta a ponta

**Se todos os critérios passarem:** ChefIApp está operacional em modo real ENTERPRISE.

---

## Referências

- Roteiro Supremo: `docs/strategy/ROTEIRO_SUPREMO_CORE_ON.md`
- Execução (estado A verificado): `docs/strategy/EXECUCAO_ROTEIRO_SUPREMO.md`
