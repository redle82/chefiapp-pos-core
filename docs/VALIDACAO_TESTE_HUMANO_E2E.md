# Validação — Teste Humano End-to-End (Contrato do Produto)

**Objetivo:** Validar como um humano real que o produto funciona do primeiro contacto até ao uso real, sem crashes, loops ou ambiguidades.

**Cursor-ready:** Copiar, colar e seguir. Sem conversa nem interpretação.

**Refs:** [PROVIDERS_ARCHITECTURE.md](architecture/PROVIDERS_ARCHITECTURE.md) · [VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md) · [VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md](VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md)

---

## Ambientes

- **DEV:** http://localhost:5175/
- **PREVIEW (build):** http://127.0.0.1:4173/
- Usar janela normal e depois aba anónima.

---

## Executar na ordem (sem saltar)

### 1) Landing = Produto

- Abrir `/`
- **Confirmar:**
  - TPV visível em modo trial
  - Overlay visível
  - Preço 79 €/mês
  - Botões "Começar agora" e "Explorar primeiro"
  - Barra "Modo Trial"

### 2) Explorar primeiro

- Clicar "Explorar primeiro"
- **Confirmar:**
  - Overlay desaparece
  - TPV continua utilizável
  - Criar 1 pedido simples
  - Barra "Modo Trial" continua visível

### 3) Começar agora

- Clicar "Começar agora"
- **Confirmar:**
  - Navega para `/auth`
  - Nenhum erro / crash / ecrã em branco

### 4) Auth

- **Confirmar:**
  - Página de login/signup renderiza
  - Sem erro de useContext
- (Opcional) Criar conta de teste

### 5) Fluxo real mínimo (se autenticado)

- Criar restaurante (bootstrap)
- Criar 1 produto
- Abrir TPV real
- Registar 1 pedido
- Aceder a `/app/billing`
- **Confirmar:**
  - Preço visível
  - Botão "Ativar agora" ativo

### 6) Aba anónima

- Abrir nova aba anónima
- Repetir passos 1 → 3
- **Confirmar:**
  - Trial funciona sem sessão
  - CTAs funcionam igual

---

## Critérios de sucesso (todos obrigatórios)

- Nenhum erro de useContext null
- Navegação coerente: `/` → `/auth` → app
- Trial totalmente utilizável sem login
- CTA leva sempre ao próximo passo correto

---

## Resultado final (uma frase)

**"Agora vejo."**

---

## Se falhar

Anotar exatamente:

- URL
- Ação clicada
- O que apareceu vs o esperado

Depois corrigir copy, CTA ou gating, nunca arquitetura sem prova.

---

## Próximo passo automático (após "Agora vejo")

1. [VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md)
2. [VALIDACAO_DOMINIO_PRODUCAO.md](VALIDACAO_DOMINIO_PRODUCAO.md)
3. [VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md](VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md)

---

Este é o contrato humano do produto. Se isto passa, o produto está vendável.
