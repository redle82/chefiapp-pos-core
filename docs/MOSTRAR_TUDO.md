# MOSTRAR TUDO - Guia de Visualização Completa

**Objetivo Único:** Subir TODOS os periféricos mínimos ao mesmo tempo, apontando para o mesmo Core, para VER o sistema funcionando.

**Não é teste. Não é demo. É visibilidade.**

---

## 🎯 O Que Você Vai Ver

Quando tudo estiver rodando simultaneamente:

| Periférico | Função | URL |
|------------|--------|-----|
| **TPV** | Criar pedido (com constraints e feedback) | `http://localhost:5175/app/tpv` |
| **KDS** | Ver pedidos em tempo real | `http://localhost:5175/kds/{restaurantId}` |
| **Dashboard** | Ver estado do sistema (observabilidade) | `http://localhost:5175/app/dashboard` |
| **Mobile** | Mesmo fluxo do TPV (simulado) | Expo Dev Tools |

**Todos ligados ao mesmo banco local. Todos reagindo em tempo real.**

---

## ▶️ COMANDO SUPREMO — "MOSTRAR TUDO"

### 1️⃣ Garantir que o Core está rodando (Supabase local)

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
supabase start
```

**Espere até ver:**
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Se já estiver rodando, pule para o próximo passo.**

---

### 2️⃣ Subir o Core + Simuladores (Docker) - Opcional

```bash
cd docker-tests
make full-system-test
```

Isso garante:
- ✅ Pedidos funcionam
- ✅ KDS reage
- ✅ Prints e eventos existem

**Nota:** Este passo é opcional. Você pode pular direto para o Merchant Portal.

---

### 3️⃣ Subir o Merchant Portal (TPV + Dashboard)

```bash
cd merchant-portal
npm run dev
```

**Aguarde até ver:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5175/
  ➜  Network: use --host to expose
```

**Abra no navegador:** `http://localhost:5175`

👉 **Aqui você DEVE ver:**
- ✅ TPV (navegue para `/app/tpv`)
- ✅ Dashboard (navegue para `/app/dashboard`)
- ✅ ActiveIssuesWidget
- ✅ ControlTowerWidget

**Mesmo sem login** (DEV_STABLE_MODE detecta localhost automaticamente).

---

### 4️⃣ Subir o KDS Isolado (Separado do TPV)

**Não precisa subir servidor separado!** O KDS roda no mesmo Merchant Portal.

**Apenas abra em nova aba:**
- `http://localhost:5175/kds/{restaurantId}`

**Para obter restaurantId:**
```bash
# Criar restaurante piloto se não tiver
npx ts-node scripts/setup-pilot-restaurant.ts

# Ver restaurantId criado
cat test-results/pilot-restaurant-*.json | grep restaurantId
```

👉 **Essa tela só mostra pedidos. Tela escura, sem sidebar, sem auth.**

---

### 5️⃣ Subir o Mobile (Simulador Visual) - Opcional

```bash
cd mobile-app
npx expo start
```

Depois:
- iOS Simulator ou
- Android Emulator

👉 **O mobile usa o mesmo Core.**

---

## 🧪 TESTE VISUAL QUE VOCÊ DEVE FAZER (AGORA)

### Teste 1: Criar Pedido no TPV

1. Abra TPV: `http://localhost:5175/app/tpv`
2. Crie um pedido
3. **Observe:**
   - ✅ Aparece no KDS (se estiver aberto)
   - ✅ Aparece no Dashboard
   - ✅ ActiveIssues muda
   - ✅ ControlTower mostra pedido ativo

### Teste 2: Quebrar Regra (Constraint)

1. No TPV, crie um pedido na mesa 1
2. Tente criar outro pedido na mesma mesa 1
3. **Observe:**
   - ✅ Mensagem clara de erro aparece
   - ✅ Sugestão automática aparece
   - ✅ Erro explica "por que não pode"

### Teste 3: Ver Core Reagindo

1. No Dashboard, veja `ActiveIssuesWidget`
2. Crie um pedido no TPV
3. **Observe:**
   - ✅ Widget atualiza automaticamente
   - ✅ Métricas mudam em tempo real
   - ✅ ControlTower mostra estado atualizado

**Se isso acontecer → o sistema está realmente vivo.**

---

## 🚨 SE ALGO NÃO APARECER

Isso não é falha conceitual, é só:
- Rota errada
- Feature flag desligada
- Widget não montado na página
- Layout mínimo não agregado

👉 **Isso se corrige em minutos, agora que o Core está certo.**

---

## 📊 Checklist de Validação

Após seguir os passos, você deve conseguir:

- [ ] Ver TPV funcionando (`/app/tpv`)
- [ ] Ver Dashboard funcionando (`/app/dashboard`)
- [ ] Ver KDS funcionando (`/kds/{restaurantId}`)
- [ ] Criar pedido no TPV
- [ ] Ver pedido aparecer no KDS (em tempo real)
- [ ] Ver widgets atualizando no Dashboard
- [ ] Ver mensagem de erro quando quebrar constraint
- [ ] Ver sugestão automática após erro

**Se todos os itens estão ✅ → Sistema está vivo e funcionando!**

---

## 💬 O QUE ME DIZER AGORA

Depois de subir o merchant-portal, me diga:

**O que você vê agora na tela depois de subir o merchant-portal?**

- **A)** TPV aparece
- **B)** Dashboard aparece  
- **C)** Tela em branco
- **D)** Erro no console
- **E)** Não sei onde olhar

**A partir disso eu te guio passo a passo até você literalmente dizer:**

**"Ok, agora estou vendo tudo."**

Sem fantasia. Sem hype. Só sistema funcionando.

---

## 🧭 Troubleshooting Rápido

### Tela em Branco
- Abra Console (F12)
- Veja erros em vermelho
- Verifique `.env` está correto
- Tente `?devStable=1` na URL

### Redireciona para Login/Wizard
- Adicione `?devStable=1` na URL
- Ou configure `DEV_STABLE_MODE=true` no `.env`

### KDS não recebe pedidos
- Verifique `restaurantId` na URL está correto
- Verifique console do KDS para erros de Realtime
- Verifique se Supabase Realtime está habilitado

### Widgets não aparecem no Dashboard
- Verifique se `restaurant?.id` existe
- Verifique console para erros
- Verifique se componentes estão importados

---

*"Subir TODOS os periféricos mínimos ao mesmo tempo, apontando para o mesmo Core, para você VER o sistema funcionando."*
