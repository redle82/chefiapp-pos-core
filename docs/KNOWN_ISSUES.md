# 🐛 Known Issues - ChefIApp

**Problemas conhecidos e workarounds**

---

## 🔴 Críticos

### Nenhum no momento
Todos os problemas críticos foram resolvidos na v1.0.0.

---

## 🟡 Importantes

### 1. Timer pode não atualizar em background
**Descrição:** Timer do mapa vivo pode parar quando app está em background.

**Workaround:**
- Timer retoma automaticamente ao voltar ao foreground
- Verificar `AppState` para pausar/retomar

**Status:** Em investigação  
**Prioridade:** Média  
**ETA:** v1.1.0

---

### 2. Waitlist pode perder dados em caso de crash
**Descrição:** Se app crashar antes de salvar, dados podem ser perdidos.

**Workaround:**
- Dados são salvos automaticamente após cada mudança
- Implementar auto-save mais frequente

**Status:** Em desenvolvimento  
**Prioridade:** Baixa  
**ETA:** v1.1.0

---

## 🟢 Menores

### 3. Banner de pressão pode piscar
**Descrição:** Banner de pressão da cozinha pode piscar durante transições.

**Workaround:**
- Não afeta funcionalidade
- Adicionar debounce na atualização

**Status:** Aceito  
**Prioridade:** Baixa  
**ETA:** v1.2.0

---

### 4. Cores de urgência podem não atualizar imediatamente
**Descrição:** Cores podem levar 1-2 segundos para atualizar.

**Workaround:**
- Timer atualiza a cada segundo
- Considerar atualização mais frequente

**Status:** Aceito  
**Prioridade:** Baixa  
**ETA:** v1.2.0

---

## 📱 Mobile Específicos

### iOS

#### 5. Haptic feedback pode não funcionar em alguns dispositivos
**Descrição:** Haptic feedback pode não funcionar em iPhones mais antigos.

**Workaround:**
- Verificar suporte antes de chamar
- Fallback silencioso

**Status:** Resolvido  
**Prioridade:** Baixa

---

### Android

#### 6. Performance pode variar entre dispositivos
**Descrição:** Performance pode ser mais lenta em dispositivos Android mais antigos.

**Workaround:**
- Otimizações implementadas
- Considerar reduzir animações em dispositivos lentos

**Status:** Em monitoramento  
**Prioridade:** Média

---

## 🌐 Backend

### 7. Realtime pode desconectar em redes instáveis
**Descrição:** Conexão Realtime pode desconectar em redes instáveis.

**Workaround:**
- Sistema funciona offline-first
- Reconexão automática implementada

**Status:** Aceito  
**Prioridade:** Baixa

---

## 🔧 Workarounds Comuns

### Timer não atualiza
```typescript
// Forçar atualização
const [forceUpdate, setForceUpdate] = useState(0);
useEffect(() => {
  setForceUpdate(prev => prev + 1);
}, [order]);
```

### Waitlist não persiste
```typescript
// Salvar manualmente
await PersistenceService.saveWaitlist(entries);
```

### Pressão não atualiza
```typescript
// Forçar recálculo
const { pressure } = useKitchenPressure();
// Hook recalcula automaticamente
```

---

## 📊 Estatísticas

### Issues por Categoria
- **Críticos:** 0
- **Importantes:** 2
- **Menores:** 2
- **Mobile:** 2
- **Backend:** 1

### Resolução
- **Resolvidos:** 1
- **Em desenvolvimento:** 1
- **Em investigação:** 1
- **Aceitos:** 3
- **Em monitoramento:** 1

---

## 🚀 Roadmap de Correções

### v1.1.0
- [ ] Timer em background
- [ ] Auto-save waitlist mais frequente

### v1.2.0
- [ ] Debounce no banner
- [ ] Atualização mais frequente de cores

---

## 📞 Reportar Issues

### Template
```markdown
**Descrição:**
Breve descrição do problema

**Passos para Reproduzir:**
1. Passo 1
2. Passo 2

**Comportamento Esperado:**
O que deveria acontecer

**Comportamento Atual:**
O que está acontecendo

**Ambiente:**
- OS: iOS/Android
- Versão: X.Y.Z
- Device: Modelo

**Logs:**
\`\`\`
Logs relevantes
\`\`\`
```

### Onde Reportar
- **GitHub Issues:** [Link]
- **Email:** support@chefiapp.com

---

## 📚 Recursos

- **Troubleshooting:** `docs/TROUBLESHOOTING.md`
- **FAQ:** `docs/FAQ.md`
- **Contributing:** `CONTRIBUTING.md`

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
