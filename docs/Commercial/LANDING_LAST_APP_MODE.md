# Landing — Modo Last.app

## Uma página. Vende em 30 segundos. CTA = WhatsApp

**Objetivo:** Ter algo como Last.app — URL pública, produto funcionando, dá para instalar hoje, dá para cobrar. Sem filosofia. Sem escolha. Sem README.

**Regra:** Restaurante não lê README. Restaurante precisa de 1 página feia, honesta e funcional.

---

## 1. Estrutura da página (ordem)

1. **Hero** — headline + subheadline + 3 ticks + 1 CTA (WhatsApp)
2. **Opcional (se couber na dobra):** 1 linha de preço + “Teste grátis”
3. **Opcional:** 3 passos (“Criar conta → Configurar mesa → Começar a vender”) — só se não poluir
4. **Footer:** WhatsApp de novo + email

Sem menu de navegação complexo. Sem “Recursos”, “Preços”, “Empresa”. Uma página, um objetivo: **Fale comigo no WhatsApp**.

---

## 2. Copy (PT) — colar direto

### Hero

**Headline (H1)**
ChefIApp — POS que pensa

**Subheadline**
Veja pedidos em tempo real. Receba alertas. Cobre em 2 toques.

**3 ticks (checkmarks)**
✔️ Funciona hoje
✔️ Sem contrato
✔️ Teste grátis

**CTA (único botão)**
👉 Fale comigo no WhatsApp

_(link: <https://wa.me/351XXXXXXXXX> — trocar pelo número real)_

---

### Linha de preço (opcional, abaixo do CTA)

A partir de **49 €/mês**. Primeiro mês de teste grátis.

_(ou: “Primeiro mês grátis. Depois 49 €/mês.”)_

---

### 3 passos (opcional, só se a página ficar curta)

1. **Criar conta** — 2 minutos
2. **Configurar restaurante e mesa** — 5 minutos
3. **Começar a vender** — hoje

Instalação em **15 minutos**. Você começa a usar **hoje**.

---

### Footer

Dúvidas? **WhatsApp** ou **<email@dominio.com>**

---

## 3. Copy (EN) — same structure

**H1:** ChefIApp — POS that thinks

**Subheadline:** See orders in real time. Get alerts. Charge in 2 taps.

**Ticks:** ✔️ Works today | ✔️ No contract | ✔️ Free trial

**CTA:** 👉 Contact me on WhatsApp

**Price line (optional):** From **€49/month**. First month free trial.

**Footer:** Questions? **WhatsApp** or **<email@domain.com>**

---

## 4. Implementação mínima

- **Uma única rota:** `/` ou `/landing` (a que for a primeira coisa que o domínio mostra).
- **Sem login no caminho:** o botão WhatsApp não leva para signup; leva para WhatsApp.
- **Número de telefone:** variável de ambiente ou config (ex.: `VITE_CONTACT_WHATSAPP=351XXXXXXXXX`).
- **Sem “Ver demo” obrigatório:** demo pode existir, mas o CTA principal é WhatsApp.
- **Mobile-first:** a maioria vai abrir no telemóvel; botão grande, legível.

---

## 5. O que NÃO colocar nesta página

- Explicação de arquitetura, soberania, cogumelos.
- Comparação longa com concorrentes.
- Múltiplos planos ou tabela de preços complexa (um preço, uma linha).
- Menu “Produto”, “Preços”, “Contactos” — um CTA só.

---

## 6. Checklist “modo Last.app”

- [ ] URL pública resolve para esta landing
- [ ] Headline + 3 ticks + CTA visíveis em 30 segundos
- [ ] CTA = WhatsApp (número real)
- [ ] Uma linha de preço (ex.: 49 €/mês, teste grátis)
- [ ] Sem obrigar a criar conta para “ver mais”
- [ ] Mobile legível e botão clicável

---

**Resumo:** Uma página. Vende em 30 segundos. CTA = WhatsApp. O resto é conversa humana.
