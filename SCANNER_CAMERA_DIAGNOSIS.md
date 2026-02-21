# Scanner Camera — Diagnóstico Ultra-Detalhado

## Situação Atual

- ✅ Mensagem "Câmera indisponível" agora aparece e **fica visível**
- ❌ Câmera não está a funcionar (getUserMedia está a falhar)
- 🔍 Precisamos de logs detalhados para descobrir onde exatamente falha

---

## Como Ver os Logs Detalhados

### **No iPhone + Safari**

#### **Opção 1: Remote Inspection (Melhor Opção)**

1. **Desktop Mac + iPhone conectado por USB**

   - Abre Safari no Desktop
   - Menu: **Develop** → [Seu iPhone] → [Este Page]
   - Abre a aba "Console"

2. **Carrega ou refresh no iPhone Safari**

3. **Vê os logs `[Scanner]` em tempo real**

#### **Opção 2: Alert Box (Se não tens USB)**

Se não consegues fazer remote inspection, vou adicionar uma janela de debug na própria app que mostra os logs.

---

## Passos de Teste

### **1. Abre o Scanner**

- iPhone → Safari → `/app/staff/home`
- Scroll até encontrar o botão da câmera
- Clica no tab "📷 Câmera"

### **2. Abre DevTools (F12 no Desktop)**

- Desktop: Safari → Develop → [Seu iPhone Name]
- Seleciona "Console" tab

### **3. Clica "Tentar novamente" ou Espera Retry Automático**

### **4. Observa os Logs**

Deverás ver uma sequência como:

```
[Scanner] ========== Starting camera ==========
[Scanner] videoRef.current exists? true
[Scanner] ✅ navigator.mediaDevices available
[Scanner] ✅ getUserMedia available
[Scanner] Requesting camera with constraints: {"video":{"facingMode":"environment"},"audio":false}
[Scanner] About to call getUserMedia...
```

**Se vires até aqui**: O problema está DEPOIS deste ponto. Prossegue.

```
[Scanner] ✅ Camera stream obtained {...}
[Scanner] Stream active? true Tracks: 1
[Scanner] ✅ videoRef.current exists, assigning stream...
[Scanner] ✅ Stream assigned to videoRef.srcObject
[Scanner] Setting up video playback...
[Scanner] play() called, promise returned: true
[Scanner] ✅ Video playing successfully
```

**Se vires até aqui**: A câmera deveria estar a funcionar!

---

## Cenários de Erro Possíveis

### **Cenário 1: ❌ getUserMedia não retorna**

```
[Scanner] About to call getUserMedia...
(Nothing after this)
```

**Problema**: A chamada está a congelar

- A permissão popup não aparece?
- O iOS está travado?
- Timeout?

**Solução**: Verifica se a permissão popup apareceu no iPhone

---

### **Cenário 2: ❌ NotAllowedError**

```
[Scanner] Camera error: {
  message: "Permission denied",
  name: "NotAllowedError"
}
```

**Problema**: Negaste a câmera ou Safari não tem permissão

**Solução**:

1. iPhone: Settings → Safari → Camera → Enable "Allow"
2. Safari: Settings → Privacy → Camera → Enable "Allow access to camera"
3. Reload page and retry

---

### **Cenário 3: ❌ NotFoundError**

```
[Scanner] Camera error: {
  message: "camera not found",
  name: "NotFoundError"
}
```

**Problema**: Câmera não encontrada

- Câmera danificada?
- Já em uso por outra app?

**Solução**:

1. Reinicia o iPhone
2. Fecha outras apps que usem câmera
3. Tenta novamente

---

### **Cenário 4: ❌ getUserMedia não suportado**

```
[Scanner] ❌ getUserMedia is NOT available
```

**Problema**: Safari muito antigo ou Browser incorreto

**Solução**:

- Update iOS à versão latest (iOS 14.5+)
- Safari deve estar updated

---

### **Cenário 5: ✅ Stream obtained MAS ❌ video não toca**

```
[Scanner] ✅ Camera stream obtained {...}
[Scanner] ⚠️ Play error (may be normal on iOS): ...
```

**Problema**: Stream obtido mas `play()` a falhar

**Solução**: Pode ser iOS behavior normal (requer touch para autoplay)

---

## O Que Preciso de Ti

Por favor, **copia os logs completos** que vês na Console e envia:

1. **Todos os `[Scanner]` logs** desde o início até ao erro
2. **O erro exato** que vês mencionado
3. **O nome do erro** (NotAllowedError, NotFoundError, etc.)
4. **Informação do dispositivo**:
   - iPhone model (e.g., iPhone 13)
   - iOS version (Settings → General → About)
   - Safari version (should auto-update with iOS)

---

## Exemplo de Output Completo (para tu saberes o que esperar)

```
[Scanner] ========== Starting camera ==========
[Scanner] videoRef.current exists? true
[Scanner] ✅ navigator.mediaDevices available
[Scanner] ✅ getUserMedia available
[Scanner] Requesting camera with constraints: {"video":{"facingMode":"environment"},"audio":false}
[Scanner] About to call getUserMedia...
[Aqui aparece a prompt de permissão no iPhone: "Allow" or "Don't Allow"]
[Se clicar "Allow":]
[Scanner] ✅ Camera stream obtained MediaStream {...}
[Scanner] Stream active? true Tracks: 1
[Scanner] ✅ videoRef.current exists, assigning stream...
[Scanner] ✅ Stream assigned to videoRef.srcObject
[Scanner] Setting up video playback...
[Scanner] play() called, promise returned: true
[Scanner] ✅ Video playing successfully
[Scanner] ✅ Camera active, stream ready
[Scanner] ✅ BarcodeDetector available, starting scan
[Scanner] Checking for BarcodeDetector...
[Scanner] Creating BarcodeDetector instance...
[Scanner] BarcodeDetector created successfully
[Scanner] Scanning started
```

---

## Próximos Passos

1. **Abre DevTools Remote Inspector** no Desktop
2. **Testa Scanner no iPhone**
3. **Copia todos os logs** `[Scanner]`
4. **Envia-me os logs**
5. **Eu vou diagnosticar** onde exatamente está a falhar

Com estes logs, vou conseguir ver exatamente qual é o passo que está a falhar! 🔍
