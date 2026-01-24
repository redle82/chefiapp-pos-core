# 🖨️ Guia de Impressão — ChefIApp

**Data:** 2026-01-30  
**Versão:** 1.0

---

## 📋 Visão Geral

O ChefIApp suporta dois métodos de impressão:

1. **Browser Print (Padrão)** — Funciona em qualquer dispositivo via `window.print()`
2. **Impressoras Térmicas Físicas** — Configuração manual via IP/porta (mobile app)

---

## 🌐 Browser Print (TPV Web)

### Como Funciona

O browser print é o método padrão e funciona automaticamente:

1. Processar pagamento no TPV
2. Clicar em "Imprimir Recibo Fiscal"
3. O navegador abrirá a janela de impressão
4. Selecionar impressora e imprimir

### Compatibilidade

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Dispositivos móveis (iOS/Android)

### Solução de Problemas

**Problema:** Pop-up bloqueado
- **Solução:** Permitir pop-ups para o site do ChefIApp nas configurações do navegador

**Problema:** Janela não abre
- **Solução:** Verificar bloqueador de pop-ups ou usar modo de navegação anônima

**Problema:** Recibo não imprime corretamente
- **Solução:** Verificar configurações de impressão do navegador (margens, tamanho de papel)

---

## 📱 Impressoras Térmicas (Mobile App)

### Configuração

1. Abrir o app mobile
2. Ir em **Configurações** → **Impressoras & Dispositivos**
3. Tocar em **"⚙️ Configurar Impressoras"**
4. Configurar:
   - **Impressora da Cozinha:** IP da impressora térmica
   - **Impressora do Balcão:** IP da impressora térmica
   - **Porta:** Geralmente 9100 (padrão)
5. Usar **"Testar Impressão"** para verificar conexão
6. Salvar configurações

### Requisitos

- Impressoras térmicas compatíveis com ESC/POS
- Impressoras conectadas na mesma rede Wi-Fi
- IP estático configurado nas impressoras (recomendado)

### Encontrar o IP da Impressora

1. **Via Menu da Impressora:**
   - Acessar menu de configurações
   - Procurar por "Network" ou "Rede"
   - Verificar "IP Address" ou "Endereço IP"

2. **Via Router:**
   - Acessar painel do roteador
   - Verificar lista de dispositivos conectados
   - Identificar impressora pelo nome do fabricante

3. **Via App do Fabricante:**
   - Usar app oficial do fabricante (Epson, Star, etc.)
   - Verificar informações de rede

### Teste de Impressão

1. Configurar IP e porta
2. Tocar em **"Testar Impressão"**
3. Verificar se a impressora recebe o comando
4. Se não funcionar:
   - Verificar se impressora está ligada
   - Verificar se está na mesma rede Wi-Fi
   - Verificar se IP e porta estão corretos
   - Verificar firewall do dispositivo

---

## 🔧 Configuração Avançada

### Porta TCP Padrão

- **9100** — Porta padrão para impressoras térmicas
- **515** — Porta alternativa (LPR)
- **631** — Porta IPP (Internet Printing Protocol)

### Tipos de Impressoras Suportadas

- ✅ Impressoras térmicas ESC/POS (80mm)
- ✅ Impressoras de rede (Ethernet/Wi-Fi)
- ⚠️ Impressoras USB (requer servidor de impressão)
- ❌ Impressoras Bluetooth (não suportado ainda)

---

## 📝 Notas Técnicas

### Browser Print

- Usa `window.print()` nativo do navegador
- HTML otimizado para impressão (80mm)
- Suporta impressão em PDF
- Funciona offline (após carregar página)

### Impressoras Térmicas

- Protocolo: TCP/IP (porta 9100)
- Formato: ESC/POS
- Encoding: UTF-8
- Largura: 80mm (padrão)

---

## 🆘 Suporte

### Problemas Comuns

**"Não foi possível conectar à impressora"**
- Verificar IP e porta
- Verificar se impressora está ligada
- Verificar rede Wi-Fi
- Testar ping no IP da impressora

**"Impressão sai cortada"**
- Verificar largura de papel (80mm)
- Verificar configurações de impressão
- Ajustar margens no navegador (browser print)

**"Caracteres especiais não aparecem"**
- Verificar encoding (UTF-8)
- Verificar suporte da impressora a caracteres especiais

---

## 🔮 Melhorias Futuras

- Descoberta automática de impressoras
- Suporte a Bluetooth
- Integração com hardware fiscal (Epson, Star)
- Preview de impressão antes de imprimir

---

**Última atualização:** 2026-01-30
