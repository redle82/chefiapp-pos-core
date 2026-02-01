# Como Testar a Landing Page

**Data:** 2026-01-28
**Status:** ✅ Servidor rodando

---

## 🚀 Servidor Ativo

**URL:** `http://localhost:5175/`

**Status:** ✅ Servidor Vite rodando na porta 5175

---

## 📋 Checklist de Teste

### 1. Acessar Landing Page

- [ ] Abrir navegador em `http://localhost:5175/`
- [ ] Verificar se página carrega (sem erros no console)
- [ ] Verificar título: "O único TPV que pensa antes do humano"

### 2. Verificar Elementos (Estrutura Principal)

- [ ] Header com logo "🧠 ChefIApp"
- [ ] Botões "Ver Demo" e "Começar Agora" visíveis
- [ ] Hero section com título e descrição
- [ ] 3 value props (Sugestões Inteligentes, Explica o Porquê, Prioriza por Urgência)
- [ ] CTA section no final
- [ ] Footer com informações básicas

### 3. Verificar Seções Intermediárias (Nível Toast)

- [ ] Seção "Veja o sistema em ação" com 2 blocos (Dashboard / System Tree)
  - [ ] Legenda do Dashboard ("visão de canais, tarefas e alertas")
  - [ ] Legenda do System Tree ("mapa vivo de módulos e dependências")
- [ ] Seção "Como funciona" com 3 passos:
  - [ ] Observe — monitora pedidos, filas, SLA, pressão da cozinha
  - [ ] Pense — calcula urgência com base em contexto de negócio
  - [ ] Sugira — sugere ação prioritária com explicação clara
- [ ] Seção "Para quem é" com 3 perfis:
  - [ ] Restaurantes Independentes (1-3 unidades)
  - [ ] Restaurantes com movimento intenso
  - [ ] Operações que querem controle real

### 4. Verificar Seções Avançadas (Feature / Web / Piloto)

- [ ] Seção "Tudo em um só lugar" (feature matrix) presente com:
  - [ ] TPV / Caixa
  - [ ] Tarefas Operacionais
  - [ ] Alertas Inteligentes
  - [ ] System Tree (Governança)
  - [ ] Pessoas & Turnos (em evolução)
  - [ ] Saúde da Operação
- [ ] Seção "Em desenvolvimento com restaurantes reais" (prova social mínima)
- [ ] Seção "Funciona 100% no navegador" com bullets:
  - [ ] Nada para instalar
  - [ ] Compatível com navegadores modernos
  - [ ] Mesmo dashboard de demo é o web app real
- [ ] Seção "Comece em modo piloto" com bullets:
  - [ ] Piloto gratuito com acompanhamento
  - [ ] Sem cartão de crédito
  - [ ] Preço definido após entender a operação

### 5. Testar CTAs

- [ ] Clicar "Ver Demo" → Deve redirecionar para `/dashboard`
- [ ] Clicar "Começar Agora" → Deve redirecionar para `/dashboard`
- [ ] Clicar "Ver Demo Agora" (seção azul) → Deve redirecionar para `/dashboard`
- [ ] Clicar CTA de piloto ("Ver Demo e Falar sobre Piloto") → Deve redirecionar para `/dashboard`
- [ ] Clicar CTA do footer ("Ver Demo Agora") → Deve redirecionar para `/dashboard`

### 4. Verificar Dashboard Modo Venda

- [ ] Após clicar CTA, deve abrir `/dashboard`
- [ ] Verificar badges "✨ Disponível para ativação" em módulos não instalados
- [ ] Verificar badges "✓ Ativo" em módulos instalados
- [ ] Verificar copy: "Ative os módulos que sua operação precisa"

---

## 🐛 Troubleshooting

### Página não carrega

- Verificar se servidor está rodando: `curl http://localhost:5175/`
- Verificar console do navegador (F12) para erros
- Verificar se rota `/` está configurada em `App.tsx`

### CTAs não funcionam

- Verificar se `useNavigate` está funcionando
- Verificar se rota `/dashboard` existe em `App.tsx`
- Verificar console para erros de React Router

### Visual não está correto

- Verificar se estilos inline estão aplicados
- Verificar se não há conflitos de CSS global
- Verificar responsividade (redimensionar janela)

---

## ✅ Resultado Esperado

**Landing Page:**

- ✅ Carrega sem erros
- ✅ Copy alinhado com "TPV que pensa"
- ✅ CTAs funcionam e redirecionam corretamente
- ✅ Visual profissional e limpo
- ✅ Seções intermediárias e avançadas visíveis (Veja o Sistema, Como Funciona, Para Quem É, Tudo em um só lugar, Web App, Piloto)

**Dashboard:**

- ✅ Modo venda ativo (badges positivos)
- ✅ Copy convidativo ("Disponível para ativação")
- ✅ Visual não assusta (não parece quebrado)

---

**Última atualização:** 2026-01-28
**Status:** ✅ Servidor rodando — Pronto para teste
