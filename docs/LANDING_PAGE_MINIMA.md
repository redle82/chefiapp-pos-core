# Landing Page Mínima — ChefIApp

**Data:** 2026-01-28
**Status:** ✅ **IMPLEMENTADA**
**Objetivo:** Criar ponto de entrada comercial (marketing) separado do produto

---

## 🎯 O Que Foi Criado

### Landing Page Pública (`/`)

**Localização:** `merchant-portal/src/pages/Landing/LandingPage.tsx`

**Estrutura:**

1. **Header** — Logo + navegação (Ver Demo / Começar Agora)
2. **Hero Section** — Título + descrição + CTAs principais
3. **Value Props** — 3 diferenciais principais (Sugestões, Explica, Prioriza)
4. **Veja o Sistema em Ação** — Screenshots do Dashboard e System Tree
5. **Como Funciona** — 3 passos (Observe, Pense, Sugira)
6. **Para Quem É** — 3 públicos-alvo (Restaurantes Independentes, Grupos Pequenos, Operações que Querem Controle)
7. **CTA Section** — Call-to-action final destacado
8. **Footer** — Informações básicas

---

## 📝 Copy Implementado

### Hero Principal (Dobra)

**Título (headline):**

> O sistema operacional que organiza decisões no restaurante.

**Subtítulo (descrição):**

> Enquanto outros sistemas só registram vendas, o ChefIApp observa o que está acontecendo no restaurante — mesas esperando, pedidos atrasados, contas esquecidas — e indica a próxima ação mais importante em tempo real.

### Value Props (3 diferenciais)

1. **⚡ Sugestões Inteligentes**

   - "O sistema analisa contexto e sugere uma ação prioritária por vez."

2. **🧠 Explica o Porquê**

   - "Cada sugestão vem com explicação clara: 'Mesa 5 quer pagar há 5 minutos.'"

3. **🎯 Prioriza por Urgência**
   - "Sistema calcula urgência automaticamente: crítico → urgente → atenção."

### CTAs (hero)

- **Primário:** `Ver como funciona` (azul, destacado)
  - micro-copy (opcional, discreto, abaixo do botão):
    - `Demonstração interativa. Sem dados reais.`
- **Secundário:** `Criar conta gratuita` (outline)

---

## 🎨 Design

### Cores

- **Primária:** #667eea (azul)
- **Texto:** #1a1a1a (preto suave)
- **Secundário:** #666 (cinza)
- **Fundo:** #ffffff (branco) / #f8f9fa (cinza claro)

### Tipografia

- **Título:** 56px, bold
- **Subtítulo:** 20px
- **Body:** 14px-16px

### Layout

- **Max-width:** 900px (hero), 100% (value props)
- **Padding:** 40px-80px
- **Grid:** Responsivo (auto-fit, minmax 250px)

---

## 🔗 Fluxo de Navegação

```
Landing (/)
  ↓
CTAs → /dashboard
  ↓
Dashboard (modo venda)
  ↓
Sistema operacional
```

**Separação clara:**

- `/` = Marketing (público, sem auth)
- `/dashboard` = Produto (requer auth/onboarding)

---

## ✅ O Que Está Funcionando

- ✅ Landing page renderiza em `/`
- ✅ CTAs redirecionam para `/dashboard`
- ✅ Copy alinhado com posicionamento "TPV que pensa"
- ✅ Design minimalista e profissional
- ✅ Responsivo (grid adaptativo)
- ✅ Seção "Veja o Sistema em Ação" (com placeholders)
- ✅ Seção "Como Funciona" (3 passos visuais)
- ✅ Seção "Para Quem É" (3 públicos-alvo)
- ✅ CTA final destacado (fundo azul)

---

## ✅ Seções Adicionadas (Nível Toast)

### 1. Veja o Sistema em Ação ✅

- Placeholders para screenshots do Dashboard e System Tree
- Copy: "Não é um POS. É um sistema operacional."
- **Próximo passo:** Substituir placeholders por screenshots reais

### 2. Como Funciona (3 Passos) ✅

- **Observe:** Sistema lê contexto operacional
- **Pense:** Analisa impacto, urgência e risco
- **Sugira:** Recomenda ação com explicação
- Visual: Números circulares destacados

### 3. Para Quem É ✅

- Restaurantes Independentes (15-30 mesas)
- Grupos Pequenos (2-5 unidades)
- Operações que Querem Controle Real
- Cards visuais com ícones

### 4. CTA Final Melhorado ✅

- Fundo azul (#667eea) com texto branco
- Copy: "Veja o sistema em ação em menos de 5 minutos"
- Destaque visual maior

## 🚀 Próximos Passos (Opcional)

### Curto Prazo (Melhorias Visuais)

1. **Substituir Placeholders por Screenshots Reais**

   - Screenshot do Dashboard modo venda
   - Screenshot do System Tree
   - **Impacto:** Prova visual do produto

2. **Adicionar Testimonial** (após primeiro piloto)

   - "Sofia Gastrobar usa ChefIApp há X meses"
   - Métricas reais (se disponíveis)

3. **Melhorar CTAs** (futuro)
   - "Ver Demo" → modal com vídeo ou tour guiado
   - "Começar Grátis" → redireciona para onboarding

### Médio Prazo (Funcionalidades)

1. **Formulário de Contato**

   - "Agendar demo" (opcional)
   - Email/telefone

2. **Página de Preços**

   - `/pricing` (futuro, quando billing estiver pronto)

3. **Página de Features**
   - `/features` (detalhamento de módulos)

---

## 📊 Comparação com Mercado

### Estrutura Similar a:

- **Stripe:** Landing simples → app.stripe.com
- **Shopify:** Landing → app.shopify.com
- **Notion:** Landing → app.notion.so

### Diferencial:

- Copy focado em **"TPV que pensa"** (único no mercado)
- Não promete ERP completo
- Foca em diferencial operacional

---

## 🎯 Critérios de Sucesso

- ✅ Visitante entende o que é ChefIApp em <10 segundos
- ✅ Copy comunica diferencial único ("pensa antes do humano")
- ✅ CTAs claros e visíveis
- ✅ Design profissional (não parece MVP)
- ✅ Separação clara: Landing (marketing) vs Dashboard (produto)

---

## 📝 Arquivos Criados/Modificados

### Criados

- `merchant-portal/src/pages/Landing/LandingPage.tsx` — Landing page completa

### Modificados

- `merchant-portal/src/App.tsx` — Rota `/` adicionada

---

## ✅ Resultado

**Antes:** Apenas sistema operacional (sem ponto de entrada comercial)
**Depois:** Landing page + Dashboard (marketing + produto separados)

**Status:** Landing page completa (nível Toast) implementada e funcional. Inclui seções essenciais: Hero, Value Props, Veja o Sistema, Como Funciona, Para Quem É, e CTA destacado. Pronta para receber visitantes e converter em demos. **Próximo passo:** Substituir placeholders por screenshots reais.

---

**Última atualização:** 2026-01-28
**Próxima revisão:** Após adicionar seções opcionais ou melhorar CTAs
