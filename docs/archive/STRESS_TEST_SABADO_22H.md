# 🔥 STRESS TEST: SÁBADO 22H

> **Cenário**: Restaurante cheio, WiFi instável, 3 dispositivos simultâneos, cozinha sob pressão.
> **Objetivo**: Encontrar onde o sistema **realmente** quebra antes do cliente encontrar.

---

## 🎯 REGRAS DO TESTE

1. **Não trapacear** — Use DevTools throttling, não "simule mentalmente"
2. **Documentar tudo** — Screenshot de cada falha
3. **Testar em sequência** — Não pular para "os fáceis"
4. **Assumir o pior** — Se "pode falhar", vai falhar

---

## 📋 CHECKLIST CRUEL

### 🍳 KDS (Kitchen Display System)

| # | Cenário | Como Testar | Esperado | Real | Status |
|---|---------|-------------|----------|------|--------|
| K1 | **Offline 5s** | DevTools > Network > Offline | Banner vermelho, título "⚠️ OFFLINE" | | ⬜ |
| K2 | **Offline 60s + pedidos criados** | Offline, criar 3 pedidos em outro device, reconectar | Todos aparecem em <10s | | ⬜ |
| K3 | **Ação offline** | Offline, clicar "Iniciar Preparo" | Bloqueado com feedback visual | | ⬜ |
| K4 | **Realtime channel drop** | `supabase.removeChannel()` via console | Polling 30s detecta, refetch acontece | | ⬜ |
| K5 | **Burst de 10 pedidos** | Criar 10 pedidos em <5s | Todos aparecem, sem duplicatas | | ⬜ |
| K6 | **Som desligado + pedido novo** | Desligar som, criar pedido | Flash visual + badge "NOVO!" funciona | | ⬜ |
| K7 | **Tab em background** | Minimizar tab KDS, criar pedido | Ao retornar, pedido está lá | | ⬜ |
| K8 | **localStorage cheio** | Encher localStorage, criar pedido | Graceful degradation, sem crash | | ⬜ |
| K9 | **2 KDS simultâneos** | Abrir KDS em 2 browsers | Ambos sincronizam corretamente | | ⬜ |
| K10 | **F5 durante pedido** | Refresh enquanto pedido sendo criado | Estado consistente após reload | | ⬜ |

### 🌐 WEB ORDERING (Cliente Público)

| # | Cenário | Como Testar | Esperado | Real | Status |
|---|---------|-------------|----------|------|--------|
| W1 | **Timeout 15s** | DevTools > Network > Slow 3G | Progress spinner, mensagem "Quase lá..." | | ⬜ |
| W2 | **3 retries esgotados** | Offline total durante submit | Mensagem "Pode ter sido recebido" + clear cart | | ⬜ |
| W3 | **Double-click submit** | Clicar 2x rapidamente em "Confirmar" | Idempotência bloqueia, mostra "Já enviado" | | ⬜ |
| W4 | **5 pedidos em 60s** | Enviar 5 pedidos seguidos | Rate limit ativa no 6º, countdown aparece | | ⬜ |
| W5 | **Refresh durante retry** | F5 durante backoff exponencial | Cart preservado, pode reenviar | | ⬜ |
| W6 | **Carrinho grande (50 itens)** | Adicionar 50 itens, checkout | Submit funciona, não trunca | | ⬜ |
| W7 | **web_ordering_enabled=false** | Desativar via Supabase | Mensagem clara, não permite checkout | | ⬜ |
| W8 | **Restaurante inexistente** | /public/slug-que-nao-existe | Erro claro, não crash | | ⬜ |
| W9 | **Menu vazio** | Restaurante sem produtos | Mensagem clara, não crash | | ⬜ |
| W10 | **auto_accept=true → KDS** | Enviar pedido, verificar KDS | Pedido aparece direto (não airlock) | | ⬜ |
| W11 | **auto_accept=false → TPV** | Enviar pedido, verificar TPV | Pedido em gm_order_requests, aguardando | | ⬜ |

### 🔌 SUPABASE / INFRAESTRUTURA

| # | Cenário | Como Testar | Esperado | Real | Status |
|---|---------|-------------|----------|------|--------|
| S1 | **RLS bloqueio** | Tentar query como anon em tabela protegida | Erro claro, não crash | | ⬜ |
| S2 | **Quota realtime** | 100+ inserts rápidos | Throttling gracioso | | ⬜ |
| S3 | **Session expirada** | Esperar JWT expirar (ou forçar) | Redirect login, não loop infinito | | ⬜ |
| S4 | **Supabase down** | Mock API retornando 500 | Todas as telas mostram erro claro | | ⬜ |
| S5 | **DNS failure** | Bloquear supabase.co no hosts | Timeout claro, não hang eterno | | ⬜ |

### 💳 TPV (Ponto de Venda)

| # | Cenário | Como Testar | Esperado | Real | Status |
|---|---------|-------------|----------|------|--------|
| T1 | **Criar pedido offline** | Offline, criar pedido | Bloqueado ou queued com feedback | | ⬜ |
| T2 | **Pagamento parcial** | Pagar 50% de um pedido | Estado correto, pode completar depois | | ⬜ |
| T3 | **Caixa não aberto** | Tentar operação sem caixa | Erro claro, não permite | | ⬜ |
| T4 | **2 operadores mesmo pedido** | Editar pedido em 2 tabs | Última edição vence, sem corrupção | | ⬜ |
| T5 | **Cancelar pedido pago** | Tentar cancelar após PAID | Bloqueado com razão | | ⬜ |

---

## 🚨 EDGE CASES LETAIS

Coisas que "nunca acontecem" mas acontecem em produção:

| # | Cenário | Probabilidade | Impacto | Status |
|---|---------|--------------|---------|--------|
| E1 | **UUID collision** | ~0% | Catastrófico | ⬜ |
| E2 | **Fuso horário incorreto** | 5% | Alto | ⬜ |
| E3 | **Emoji em nome de produto** | 20% | Médio | ⬜ |
| E4 | **Preço = 0** | 10% | Alto | ⬜ |
| E5 | **Preço negativo** | 2% | Crítico | ⬜ |
| E6 | **Quantidade = 0** | 5% | Médio | ⬜ |
| E7 | **Quantidade > 1000** | 1% | Médio | ⬜ |
| E8 | **Caracteres especiais (SQL injection)** | 5% | Crítico | ⬜ |
| E9 | **XSS em notas** | 5% | Crítico | ⬜ |
| E10 | **Dois pagamentos simultâneos** | 3% | Crítico | ⬜ |

---

## 🔧 COMO EXECUTAR

### Setup

```bash
# Terminal 1: Dev server
cd merchant-portal && npm run dev

# Terminal 2: Supabase local (se usando)
supabase start

# Browser 1: KDS
open http://localhost:5175/kds/{restaurantId}

# Browser 2: TPV
open http://localhost:5175/tpv

# Browser 3 (Incognito): Web Ordering
open http://localhost:5175/public/{slug}
```

### DevTools Network Throttling

```
Chrome: DevTools > Network > Throttling dropdown
- Fast 3G: 100ms latency, 1.4Mbps down
- Slow 3G: 500ms latency, 400kbps down
- Offline: No connection
```

### Simulação de Realtime Failure

```javascript
// No console do browser:
// Listar channels ativos
supabase.getChannels()

// Forçar desconexão
supabase.getChannels().forEach(ch => supabase.removeChannel(ch))
```

### Simulação de localStorage Cheio

```javascript
// No console:
try {
  const data = 'x'.repeat(5 * 1024 * 1024); // 5MB
  localStorage.setItem('fill', data);
} catch (e) {
  console.log('localStorage cheio');
}
```

---

## 📊 RESULTADO ESPERADO

Após executar todos os testes:

| Métrica | Meta | Real |
|---------|------|------|
| Testes passando | 100% | |
| Crashes encontrados | 0 | |
| Dados corrompidos | 0 | |
| UX confusa | 0 ocorrências | |
| Tempo médio de recuperação | <10s | |

---

## 🏁 CRITÉRIO DE GO/NO-GO

### ✅ GO (Pronto para produção)

- [ ] Todos os K* passando (KDS crítico)
- [ ] Todos os W* passando (Web ordering é receita)
- [ ] S1-S3 passando (Supabase básico)
- [ ] T1, T3, T5 passando (TPV mínimo)
- [ ] E8, E9 passando (Segurança)

### ❌ NO-GO (Precisa fix antes)

- Qualquer crash não tratado
- Dados inconsistentes entre dispositivos
- Perda silenciosa de pedido
- Loop infinito de requests
- Erro sem mensagem clara

---

## 📝 NOTAS DE EXECUÇÃO

```
Data: ____/____/______
Executor: ______________
Versão: commit __________

Observações:
_________________________________
_________________________________
_________________________________
```

---

> **Lembre-se**: Se passou aqui, passa às 22h de sábado.
> Se falhou aqui, ia falhar com cliente olhando.
