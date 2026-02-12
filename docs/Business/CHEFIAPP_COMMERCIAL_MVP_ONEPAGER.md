# 🍴 ChefIApp — Commercial MVP One-Pager

**Versão**: 1.0 MVP
**Data**: Janeiro 2026
**Status**: Pronto para Venda

---

## 🎯 O que é o ChefIApp?

ChefIApp é um **sistema de gestão operacional para restaurantes** que centraliza operações diárias em um comando unificado: menu digital, controle de turnos, gestão de tarefas, stock em tempo real, e analytics. Desenhado para eliminar caos operacional, não apenas organizar.

**Diferencial real**: Não antecipa. Não infere. Só mostra verdade. O sistema age antes que você precise pensar — tarefas surgem automaticamente de eventos reais (stock baixo, turno esquecido, pedido pendente). Você não gerencia tarefas, você executa.

**Tecnologia**: Event sourcing + projections. Offline-first. Escala para 1000 restaurantes sem esforço. Cloud-native (Supabase + PostgreSQL + Stripe).

---

## 👤 Cliente Ideal

**Perfil**:

- Restaurante pequeno/médio (1-3 estabelecimentos)
- Atualmente usando papel, planilhas, ou POS básico sem gestão
- Equipe pequena (5-15 pessoas)
- Precisa de visibilidade operacional sem complexidade
- Valida controle de custo e redução de desperdício
- Já tem internet estável ou quer começar digital

**Não é para**:

- Grandes redes corporativas (ainda)
- Quem precisa de POS fiscal certificado **hoje** (roadmap Q2 2026)
- Restaurantes que operam 100% offline
- Quem quer customização pesada de UI

---

## 🔥 3 Features Core (Vendáveis Hoje)

### 1️⃣ **OperationalHub — Comando Central**

**O que faz**:

- Dashboard único: vendas de hoje, turnos ativos, stock baixo, canais de delivery, tarefas automáticas
- Analytics em tempo real: ticket médio, top produtos, horários de pico
- Gestão de turnos (clock in/out): quem está trabalhando agora, total de horas
- Alertas de estoque baixo com tarefas automáticas para reposição
- Integração com canais de delivery (GloriaFood, Uber Eats via webhook)

**Por que comprar**:
Visibilidade total em uma tela. Fim de "cadê o papel?" ou "quem fechou ontem?". Turnos rastreados automaticamente. Stock nunca zera sem aviso.

**Estado atual**: ✅ Operacional. Testado no Sofia Gastrobar.

---

### 2️⃣ **AppStaff — Sistema Nervoso Operacional**

**O que faz**:

- Tarefas surgem sozinhas: stock baixo → tarefa de reposição, turno esquecido → notificação, pedido delivery → tarefa de preparo
- Cada função vê só o que importa: cozinheiro não vê finanças, garçom não vê RH
- Trabalho migra automaticamente: tarefa urgente? Escala para gerente. Tarefa crítica? Aparece como alerta.
- Zero configuração: sem tags, sem categorias, sem prioridade manual

**Por que comprar**:
Equipe executa, não gerencia. Sistema pensa antes de você. Nada cai no esquecimento. Cada pessoa vê só o necessário para o turno.

**Estado atual**: ✅ Core operacional. 6 leis imutáveis implementadas.

---

### 3️⃣ **Menu Digital + Preview em Tempo Real**

**O que faz**:

- Criação de cardápio com categorias, itens, preços, fotos
- Preview do menu ao vivo (antes de publicar): vê exatamente como cliente vê
- Estados fantasma: testa mudança de preço/disponibilidade sem afetar clientes
- Versionamento: voltar para versão anterior do menu em 1 clique
- QR code automático: cliente escaneia e vê menu no celular

**Por que comprar**:
Menu sempre atualizado. Testa mudanças antes de errar com cliente. Sem impressão de cardápio, sem custo de design.

**Estado atual**: ✅ Operacional. Usado por 1 restaurante ativo (Sofia Gastrobar).

---

## ❌ O que NÃO Vendemos Ainda

**Honestidade comercial**:

- ❌ **POS Fiscal Certificado**: Roadmap Q2 2026. Hoje funciona como pré-conta, não substitui POS fiscal.
- ❌ **Impressão de Tickets Fiscais**: Integração com impressoras fiscais está em desenvolvimento.
- ❌ **Multiples Restaurantes (franquias)**: Suporta 1-3 unidades hoje. Multi-tenant corporativo é fase 2.
- ❌ **Integração Nativa com Contabilidade**: Exporta dados, mas não sincroniza direto com ERP.
- ❌ **App Mobile Nativo**: Tudo funciona no browser (mobile-friendly), mas não há app na loja.
- ❌ **Pagamentos Integrados**: Stripe Checkout funciona, mas terminal físico ainda não.

**Roadmap honesto**:

- Q2 2026: POS Fiscal + Impressoras
- Q3 2026: Multi-tenant corporativo
- Q4 2026: App mobile nativo

---

## 💶 Oferta Comercial (3 Tiers)

### 🥉 **STARTER** — €49/mês (anual: €39/mês)

**Para quem está começando digital**

✅ 1 restaurante
✅ OperationalHub completo (analytics, turnos, stock)
✅ AppStaff com tarefas automáticas
✅ Menu digital + preview + QR code
✅ Até 5 usuários
✅ Suporte por email (48h)

❌ Sem integração delivery
❌ Sem personalização de tickets

**Ideal para**: Pequeno restaurante testando gestão digital pela primeira vez.

---

### 🥈 **PROFESSIONAL** — €99/mês (anual: €79/mês)

**Para operação consolidada**

✅ 1 restaurante
✅ Tudo do Starter +
✅ **Integração delivery** (GloriaFood, Uber Eats)
✅ **Personalização de tickets** (logo, dados de contato)
✅ **Fast Mode** (venda ultrarrápida para fast service)
✅ Até 15 usuários
✅ Suporte prioritário (24h)

**Ideal para**: Restaurante com delivery ativo e equipe maior.

---

### 🥇 **ENTERPRISE** — €199/mês (anual: €159/mês)

**Para múltiplas unidades**

✅ Até 3 restaurantes
✅ Tudo do Professional +
✅ **Analytics avançados** (comparativo entre unidades)
✅ **Suporte dedicado** (WhatsApp, 4h response)
✅ **Onboarding assistido** (1h consultoria)
✅ Usuários ilimitados

**Ideal para**: Pequena rede ou restaurante com filiais.

---

## 🗣️ Pitch de 15 Segundos

**"ChefIApp é o comando central do seu restaurante. Turnos rastreados, stock controlado, tarefas automáticas, menu digital. Sua equipe executa, o sistema gerencia. Sem caos, sem papel, sem esquecimento."**

---

## ⏱️ Próximo Passo (30 minutos)

**Se você fechar hoje**:

1. **Demo Guide ao vivo** (15 min): Mostramos OperationalHub + AppStaff com dados reais do Sofia Gastrobar
2. **Setup inicial** (10 min): Criamos seu restaurante, você adiciona 5 itens do menu
3. **Go-live** (5 min): QR code pronto, dashboard ativo, equipe pode começar

**Garantia**: 14 dias trial completo. Se não servir, cancelamento imediato sem custo.

---

## ❓ FAQ Honesto

### **1. Isso substitui meu POS fiscal?**

**Não hoje, mas em breve.** Hoje o ChefIApp é pré-conta + gestão operacional. Você ainda precisa do POS fiscal para emitir nota. Em Q2 2026 teremos certificação fiscal completa.

### **2. Preciso de internet o tempo todo?**

**Sim, mas com tolerância.** O sistema funciona offline por até 5 minutos (fila otimista). Para operações críticas (pagamento, fechamento), precisa de internet ativa. Não é para lugares sem conectividade.

### **3. Quantos usuários posso ter?**

**Depende do plano.** Starter (5), Professional (15), Enterprise (ilimitado). Usuário = pessoa com login. Você pode adicionar/remover quando quiser.

### **4. Posso exportar meus dados?**

**Sim, sempre.** Exportação de pedidos, vendas, analytics em CSV/JSON a qualquer momento. Seus dados são seus, não ficam presos no sistema.

### **5. O que acontece se eu cancelar?**

**Acesso imediato ao export completo.** 30 dias para baixar tudo. Depois disso, dados arquivados por mais 90 dias (GDPR compliance). Sem lock-in, sem penalidade.

---

## 📞 Contato Comercial

**Email**: comercial@chefiapp.com
**WhatsApp**: +351 XXX XXX XXX
**Demo Guide ao vivo**: [Agendar 30 min](https://cal.com/chefiapp/demo)
**Trial gratuito**: [Começar agora](https://app.chefiapp.com/signup)

---

**Última atualização**: Janeiro 2026
**Documento vivo**: Este one-pager reflete o estado real do produto hoje. Atualizamos mensalmente.
