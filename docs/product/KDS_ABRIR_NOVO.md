# Abrir Apenas o NOVO KDS — Guia Rápido

**Data:** 2026-01-25  
**Objetivo:** Abrir SOMENTE o novo KDS, garantindo que nenhuma rota antiga seja usada

---

## 🚀 Comando Rápido

```bash
./scripts/open-kds-new.sh
```

---

## 🎯 O Que Este Script Faz

1. **Mata processos antigos** na porta 5173
2. **Limpa cache** do Vite e builds anteriores
3. **Obtém Restaurant ID** (do Docker Core ou usa padrão)
4. **Inicia servidor** de desenvolvimento limpo
5. **Abre navegador** com URL correta do novo KDS

---

## 📋 Garantias

- ❌ KDS antigo não abre
- ❌ Nenhuma navegação automática para TPV
- ❌ Nenhuma rota herdada
- ✅ Só o novo KDS
- ✅ Com Tempo Visível ativo (Fase 3)
- ✅ Modo demo habilitado

---

## 👀 Checklist de Teste (Fase 3)

Enquanto o KDS estiver aberto, observe:

- [ ] Dá pra entender atraso sem ler nada?
- [ ] Vermelho chama atenção sem estressar?
- [ ] Pulsação não cansa?
- [ ] Timer é legível a 2–3 metros?
- [ ] ⚠️ aparece só quando faz sentido?

**Se isso passar → Fase 3 está validada.**

---

## 🔧 Troubleshooting

### Servidor não inicia

```bash
# Ver logs
tail -f /tmp/vite-kds.log

# Verificar porta
lsof -ti:5173
```

### Restaurant ID não encontrado

```bash
# Rodar seed do Docker Core
cd docker-core
./show-everything.sh
```

### Abrir manualmente

Se o script não abrir o navegador automaticamente, copie e cole:

```
http://localhost:5173/kds/{RESTAURANT_ID}?demo=true&kdsVersion=new&noLegacy=true
```

---

## 📝 Notas

- O script detecta automaticamente se o Docker Core está rodando
- Se não encontrar Restaurant ID, usa um padrão para demo
- Logs do servidor ficam em `/tmp/vite-kds.log`
- Para parar: `kill <PID>` (mostrado no output do script)

---

**Pronto para testar a Fase 3 — Tempo Visível!**

_Guia: 2026-01-25_
