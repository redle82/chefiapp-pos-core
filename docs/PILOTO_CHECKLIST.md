# CHECKLIST PILOTO REAL — ChefIApp

Data: 2026-01-04
Modo: Operação controlada (1 estabelecimento, 7 dias)

---

## 🎯 Objetivo

Validar que **pessoas reais conseguem usar o sistema sem explicação técnica**.

---

## ✅ PRÉ-PILOTO (fazer agora)

### Infra (obrigatório)
- [ ] Supabase projeto produção criado
- [ ] Variáveis de ambiente configuradas (`.env.production`)
- [ ] Build de produção sem erros (`npm run build`)
- [ ] Deploy em URL acessível (Vercel/Netlify/próprio)
- [ ] SSL ativo (HTTPS)

### Dados mínimos
- [ ] 1 tenant criado (via onboarding ou seed)
- [ ] Cardápio com 5-10 itens reais
- [ ] 2-3 mesas configuradas
- [ ] 1 usuário owner + 1 worker de teste

### Quick wins (4h estimadas)
- [ ] Toast de sucesso ao completar task
- [ ] Mensagem clara no erro de join remoto
- [ ] Botão "Voltar" no WorkerTaskFocus
- [ ] Flag "PILOTO" visível no Manager dashboard

---

## 📋 DIA DO PILOTO

### Setup local (30 min antes)
- [ ] Tablet/celular carregado
- [ ] Wi-Fi estável testado
- [ ] URL aberta e logada
- [ ] Caixa aberto no sistema

### Fluxo a testar (ordem)
1. [ ] Owner faz login
2. [ ] Owner abre caixa
3. [ ] Worker faz check-in (nome simples)
4. [ ] Criar pedido → adicionar 2-3 itens
5. [ ] Pagar pedido (cash ou card)
6. [ ] Fechar pedido
7. [ ] Worker completa 1 task
8. [ ] Owner vê dashboard com venda

---

## 📝 O QUE OBSERVAR (não perguntar, observar)

### Fricções silenciosas
| Momento | O que observar |
|---|---|
| Login | Hesitação? Erro de URL? |
| Check-in | Digita nome errado? Confunde campo? |
| Criar pedido | Procura botão? Demora? |
| Adicionar item | Scroll confuso? Categoria errada? |
| Pagamento | Sabe qual botão? Modal confunde? |
| Task | Entende o que fazer? Long-press funciona? |

### Perguntas que surgem naturalmente
- "Onde vejo X?"
- "Como faço Y?"
- "Isso salvou?"

👉 **Anote exatamente a frase**. Essa é a verdade.

---

## 📊 MÉTRICAS DE SUCESSO (7 dias)

| Métrica | Meta | Como medir |
|---|---|---|
| Pedidos criados | >20 | Supabase count |
| Pedidos pagos | >15 | `status = 'paid'` |
| Crashes | 0 | Console/Sentry |
| "Não entendi" | <5 | Anotação manual |
| Abandono | 0 | Operação parou? |

---

## 🚨 ABORT CRITERIA

Encerrar piloto se:
- [ ] 3+ pedidos perdidos (dados não salvaram)
- [ ] Caixa não fecha corretamente
- [ ] Pagamento não registra
- [ ] Staff não consegue completar task crítica

---

## 📞 SUPORTE DURANTE PILOTO

| Problema | Ação |
|---|---|
| Tela branca | Refresh + console |
| Dado não salvou | Verificar Supabase |
| Botão não funciona | Screenshot + log |
| Confusão de UX | Anotar, não explicar |

---

## 🔄 PÓS-PILOTO (dia 8)

- [ ] Coletar todas as anotações
- [ ] Classificar por P0/P1/P2
- [ ] Decidir: continuar / pausar / pivotar
- [ ] Atualizar PLANO_7_30_90.md com aprendizados

---

## Estabelecimento piloto

**Nome**: _________________
**Tipo**: [ ] Café  [ ] Bar  [ ] Restaurante
**Contato**: _________________
**Data início**: _________________
**Data fim**: _________________

---

**Lema do piloto**: *Se precisou explicar, o produto falhou.*
