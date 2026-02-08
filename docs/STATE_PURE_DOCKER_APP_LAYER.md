# ChefIApp — Restaurant Operating System (DEMO)

**Status:** ACTIVE CONTRACT
**Last reviewed:** 2026-01-28

---

## O que é este sistema

O **ChefIApp** é um **Restaurant Operating System modular**, projetado para governar de forma explícita todas as capacidades de um restaurante moderno — vendas, cozinha, tarefas, pessoas, saúde operacional e evolução futura — a partir de um **núcleo central de verdade**.

Diferente de um POS tradicional, o ChefIApp:

- trata cada funcionalidade como um **módulo governado**,
- expõe claramente o que está **ativo**, **bloqueado** ou **não instalado**,
- usa a **System Tree** como mapa vivo do sistema,
- separa rigorosamente **camada de app** e **núcleo financeiro soberano**.

Este repositório representa o **estado DEMO / DEV_STABLE** do produto.

---

## Estado atual do projeto (importante)

Este projeto está **intencionalmente** em modo DEMO, com foco em **arquitetura, coerência e productização**, não em operação financeira real.

### ✅ O que está em PURE DOCKER (App Layer)

A camada de aplicativo (`merchant-portal`) está totalmente desacoplada de cloud no runtime:

- Dashboard
- System Tree
- Runtime do restaurante
- TPV v2 (novo POS)
- Tasks (tarefas operacionais)
- Loyalty (fidelidade)
- Hooks e periféricos de UI

Essas partes usam **adapters `[CORE TODO]`**, que preservam contratos e fluxos, mas não executam persistência real.

### ⚠️ O que ainda usa Supabase (por decisão consciente)

O Supabase permanece **apenas** no núcleo soberano:

- Projeção de pedidos e fluxo financeiro (`OrderProjection`)
- Funções atômicas (caixa, pedidos, deduções)
- Scripts de manutenção/diagnóstico

Essas partes **não são tocadas nesta fase** para evitar qualquer quebra financeira silenciosa.

👉 Para mais detalhes técnicos, veja:
`docs/STATE_PURE_DOCKER_APP_LAYER.md`

---

## Como subir o sistema (modo demo)

### Pré-requisitos

- Node.js 18+
- npm

### Passos

```bash
npm install
npm -w merchant-portal run dev
```

O portal ficará disponível em modo desenvolvimento.

---

## O que olhar na demo (fluxo recomendado)

Este é o **roteiro sugerido de demo** para entender o sistema em 5–10 minutos:

1. **Dashboard**

   - Visão geral dos sistemas disponíveis
   - Cards ativos vs módulos bloqueados

2. **System Tree**

   - Mapa completo das capacidades do restaurante
   - Estados claros: instalado, não instalado, bloqueado
   - Fonte única de verdade do sistema

3. **TPV v2**

   - Fluxo de pedidos em modo demo
   - Integração com o runtime (sem persistência real)

4. **Tasks**
   - Tarefas operacionais
   - Estados, histórico e feedback (mockados, mas coerentes)

Durante a navegação, observe que:

- módulos não instalados **não quebram o fluxo**,
- o sistema sempre explica _por que_ algo está bloqueado,
- a System Tree governa a narrativa do produto.

---

## O que este sistema **não é ainda**

Para evitar mal-entendidos:

- ❌ Não é um POS financeiro pronto para produção
- ❌ Não executa vendas reais neste modo
- ❌ Não substitui sistemas fiscais ou contábeis
- ❌ Não é uma plataforma enterprise nesta fase

Este repositório é uma **base arquitetural e de produto**, pronta para:

- demo,
- validação,
- discussão técnica,
- productização gradual.

---

## Próximos passos naturais

Sem refatoração estrutural:

- melhoria de onboarding e copy,
- roteiro de demo mais guiado,
- narrativa de produto,
- validação com usuários reais,
- evolução gradual para modo ativo.

---

## Filosofia do projeto

> **Clareza antes de escala.
> Governança antes de automação.
> Sistema explícito antes de sistema mágico.**
