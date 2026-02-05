# FASE 5 - FASE C - LOCAL HUMAN SAFE MODE (CONTRATO)

**Objetivo:** Garantir que o humano nunca vê as "tripas" do sistema, mesmo quando a máquina falha.

## 1. Regra de Ouro da FASE C

**"Se o Core morrer, o Humano continua a sorrir."**

Em ambiente LOCAL (e apenas local/demo), se o Backend/Docker/Core estiver OFF:

1.  **Proibido:** Ecrãs de Erro, Banners Vermelhos, Logs de JSON, Spinners infinitos.
2.  **Obrigatório:** Fallback imediato para "Modo Demonstração / Visualização".
3.  **Feedback:** "Estamos em modo local/demo. O Core está a dormir, mas podes explorar."

## 2. Mudanças de UI (Safe Mode)

### A. O Banner da Morte (Core Indisponível)

- **Antes:** Vermelho, Alerta, "Erro 503", "Docker Down".
- **Agora (Phase C):**
  - Badge subtil: "Status: Modo Demonstração (Offline)"
  - Cor: Cinza ou Azul (Neutro), nunca Vermelho.
  - Tooltip (apenas se hover): "Conectividade limitada. Dados não serão gravados."

### B. O Login (Gatekeeper)

- **Antes:** Falha de rede ao tentar logar.
- **Agora:**
  - Botão "Entrar como Convidado/Demo" destaque imediato.
  - Bypass de autenticação real se Core OFF.

### C. A Navegação (Blindagem)

- Se clicar em "Novo Pedido" e RPC falhar:
  - Toast: "Simulação de pedido criada (Demo)"
  - Não travar a UI.

## 3. Checklist de Implementação Técnica

- [ ] **Global Error Boundary:** Capturar erros de fetch/RPC e transformá-los em "Demo Data".
- [ ] **CoreStatus Component:** Reescrever para ser "Status Indicator" e não "Error Banner".
- [ ] **Mock Mode Automático:** Se `fetch` falhar, usar dados estáticos locais para preencher Dashboard.

## 4. Critério de Sucesso

O utilizador abre a app sem Docker, navega 3 ecrãs e não sente medo.
Sentimento alvo: **"Ah, isto é uma maquete funcional."** (Melhor que "Isto é um sistema quebrado").
