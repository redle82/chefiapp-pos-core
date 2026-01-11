# ARTEFATO 8 — Comparação de Mercado: ChefIApp vs Last.app

Data: 2026-01-04
Objetivo: Posicionamento competitivo, gaps críticos, oportunidades de diferenciação.

---

## 0) Resumo executivo

**Last.app** (Espanha, +1800 restaurantes) é o benchmark mais próximo. Posiciona-se como "copiloto de restaurantes", não apenas TPV. Modelo SaaS com 3 tiers (€46-160/mês).

**ChefIApp** tem arquitetura técnica sólida mas precisa de polimento em integrações e features de gestão para competir no mesmo nível.

---

## 1) Perfil do concorrente: Last.app

### 1.1 Dados gerais
| Métrica | Valor |
|---|---|
| Origem | Espanha |
| Clientes | +1800 restaurantes |
| Integrações | +250 |
| Updates/ano | +60 |
| Suporte | 365 dias (chat, mail, WhatsApp, ligação) |

### 1.2 Pricing (IVA excluído)
| Plano | Preço/mês | Licenças | Integrações | Delivery |
|---|---|---|---|---|
| Starter | €46 | 2 | 1 | 100 pedidos |
| Growth | €87 | 4 | 6 | 550 pedidos |
| Unlimited | €160 | Ilimitadas | Ilimitadas | Ilimitados |

**Taxa delivery**: 1,5% por transação
**Taxa online**: 4% + €0,20 por transação
**Setup remoto**: €400 (opcional)

### 1.3 Features destacadas
- Multiplataforma (Windows, Android, iOS)
- Funciona offline (sync quando reconecta)
- QR code para autoatendimento
- Reservas (plano básico incluído)
- Tienda online integrada
- Stock management
- Reportes em tempo real
- Multi-local
- Fichaje (ponto eletrônico)
- Verifactu compliance (fiscal Espanha)

---

## 2) Comparativo de funcionalidades

### 2.1 TPV Core
| Feature | Last.app | ChefIApp | Status |
|---|---|---|---|
| POS básico (pedidos, pagamentos) | ✅ | ✅ | PAR |
| Mapa de mesas | ✅ | ✅ | PAR |
| KDS (Kitchen Display) | ✅ | ✅ | PAR |
| Comanderos digitais | ✅ | ✅ (MiniPOS) | PAR |
| Divisão de conta | ✅ | ⚠️ Parcial | GAP |
| Gorjeta automática | ✅ | ❌ | GAP |
| Modo offline | ✅ (sync auto) | ⚠️ Detecta apenas | GAP |

### 2.2 Delivery & Online
| Feature | Last.app | ChefIApp | Status |
|---|---|---|---|
| Tienda online | ✅ | ❌ | GAP CRÍTICO |
| Integrações delivery | ✅ (+flotas) | ❌ | GAP CRÍTICO |
| QR code autoatendimento | ✅ | ⚠️ Menu apenas | GAP |
| Pedidos WhatsApp | ✅ | ❌ | GAP |

### 2.3 Gestão
| Feature | Last.app | ChefIApp | Status |
|---|---|---|---|
| Stock management | ✅ | ✅ | PAR |
| Reportes tempo real | ✅ | ✅ (Owner dash) | PAR |
| Multi-local | ✅ | ⚠️ Não testado | INCERTO |
| Fichaje (ponto) | ✅ | ⚠️ Básico | GAP |
| Reservas | ✅ (plano básico) | ❌ | GAP |
| Contabilidade export | ✅ (+integração) | ❌ | GAP |

### 2.4 Staff
| Feature | Last.app | ChefIApp | Status |
|---|---|---|---|
| App para funcionários | ⚠️ Básico | ✅ (robusto) | VANTAGEM |
| Role-based access | ✅ | ✅ | PAR |
| Task management | ❌ | ✅ | VANTAGEM |
| Gamificação | ❌ | ⚠️ Planejado | OPORTUNIDADE |

### 2.5 Técnico
| Feature | Last.app | ChefIApp | Status |
|---|---|---|---|
| API pública | ✅ (documentada) | ❌ | GAP |
| +250 integrações | ✅ | ❌ | GAP CRÍTICO |
| Suporte 365 | ✅ | ❌ | GAP |
| Updates frequentes | +60/ano | ⚠️ | ? |

---

## 3) Análise SWOT ChefIApp

### Strengths (Forças)
1. **Staff App robusto**: Arquitetura 6-layer única no mercado
2. **Task management**: Workers recebem tarefas atribuídas
3. **Onboarding estruturado**: Wizard de 7 passos guia o usuário
4. **Codebase TypeScript moderno**: Manutenível e extensível
5. **Design system próprio**: UDS consistente

### Weaknesses (Fraquezas)
1. **Zero integrações**: Ilha fechada
2. **Sem delivery/online**: Perde segmento crítico
3. **Sem API pública**: Impossível conectar com terceiros
4. **Suporte não estruturado**: Sem 365 dias
5. **Sem reservas**: Feature básica ausente

### Opportunities (Oportunidades)
1. **Gamificação staff**: Nenhum concorrente tem, diferencial único
2. **Mercado PT/BR**: Last.app é ES-focused
3. **Preço agressivo**: Competir com Starter (€46)
4. **IA-driven insights**: "Sofia" como diferencial
5. **Staff retention tools**: Único no mercado

### Threats (Ameaças)
1. **Last.app expansão**: Pode entrar em PT
2. **Toast/Square internacionalização**: Gigantes do mercado
3. **Expectativa de integrações**: Restaurantes exigem Glovo/UberEats
4. **Compliance fiscal local**: SATII (PT), NFC-e (BR)

---

## 4) Gap analysis priorizado

### 4.1 Gaps críticos (bloqueia entrada no mercado)
| # | Gap | Impacto | Esforço |
|---|---|---|---|
| 1 | Sem delivery/online | Perde 40%+ do mercado | ALTO |
| 2 | Zero integrações | Ilha fechada | ALTO |
| 3 | Sem API pública | Impossibilita parcerias | MÉDIO |

### 4.2 Gaps importantes (reduz competitividade)
| # | Gap | Impacto | Esforço |
|---|---|---|---|
| 4 | Reservas | Feature básica esperada | MÉDIO |
| 5 | Divisão de conta completa | Expectativa de usuário | BAIXO |
| 6 | Gorjeta automática | Padrão de mercado | BAIXO |
| 7 | Offline sync real | Confiança do usuário | MÉDIO |

### 4.3 Gaps menores (nice-to-have)
| # | Gap | Impacto | Esforço |
|---|---|---|---|
| 8 | QR autoatendimento completo | Diferencial | BAIXO |
| 9 | Contabilidade export | Conveniência | BAIXO |
| 10 | Suporte 365 | Confiança | OPERACIONAL |

---

## 5) Vantagens competitivas ChefIApp

### 5.1 Únicas (nenhum concorrente tem)
1. **Staff App com task routing**: Workers recebem tarefas baseadas em role
2. **6-layer state machine**: Roteamento inteligente por contexto
3. **Gamificação potencial**: Streaks, pontos, badges (não implementado ainda)
4. **"Sofia" IA assistant**: Potencial único (não implementado)

### 5.2 Equivalentes ou melhores
1. **KDS robusto**: Equivalente a Last.app
2. **Onboarding wizard**: Melhor UX que formulário tradicional
3. **Design system coeso**: UDS é diferencial técnico
4. **Codebase moderno**: TypeScript strict, testável

---

## 6) Recomendação de posicionamento

### 6.1 Mercado alvo (curto prazo)
- **Cafés/Bares pequenos**: 1-2 mesas, sem delivery
- **Food trucks**: Mobile-first, sem integrações
- **Dark kitchens iniciais**: Staff-focused operations
- **Portugal/Brasil**: Mercado sub-servido

### 6.2 Posicionamento proposto
> "O POS que cuida da sua equipe, não apenas das vendas."

**Diferencial**: Staff-centric approach, task management, (futuro) gamificação.

### 6.3 Pricing sugerido (competir com Last.app Starter)
| Plano | Preço | Licenças | Diferencial |
|---|---|---|---|
| Solo | €29/mês | 1 | Ideal para food truck |
| Team | €49/mês | 3 | Staff app incluído |
| Scale | €99/mês | Ilimitadas | Multi-local + API |

---

## 7) Roadmap competitivo

### 7 dias (go-live)
- ✅ TPV funcional
- ✅ Staff app funcional
- ⚠️ Divisão de conta básica

### 30 dias (beta público)
- [ ] Reservas básicas
- [ ] Gorjeta automática
- [ ] Offline sync real
- [ ] Gamificação v1 (staff)

### 90 dias (competir)
- [ ] API pública v1
- [ ] 3-5 integrações delivery (iFood, Glovo)
- [ ] Tienda online básica
- [ ] Compliance fiscal PT

---

## 8) Conclusão

**ChefIApp não está pronto para competir head-to-head com Last.app** no segmento de restaurantes estabelecidos. Faltam integrações e delivery.

**ChefIApp PODE competir** no nicho de:
- Operações staff-intensive
- Cafés/bares sem delivery
- Food trucks
- Early adopters que valorizam UX moderna

**Ação recomendada**: Go-live focado no nicho, build integrações em 90 dias.

---

## 9) Próximo passo

- [ ] Plano 7/30/90 consolidado
