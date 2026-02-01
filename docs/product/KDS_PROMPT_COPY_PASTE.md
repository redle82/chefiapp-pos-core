# Prompt — Abrir Apenas o NOVO KDS

**Pronto para copiar e colar no terminal**

---

## 🚀 Comando Único

```bash
./scripts/open-kds-new.sh
```

---

## 📋 O Que Este Comando Faz

1. ✅ Mata processos antigos na porta 5173
2. ✅ Limpa cache do Vite
3. ✅ Obtém Restaurant ID (Docker Core ou padrão)
4. ✅ Inicia servidor limpo
5. ✅ Abre navegador com URL correta

---

## 🎯 Garantias

- ❌ KDS antigo não abre
- ❌ Nenhuma navegação para TPV
- ❌ Nenhuma rota herdada
- ✅ Só o novo KDS
- ✅ Tempo Visível ativo (Fase 3)
- ✅ Modo demo habilitado

---

## 👀 Checklist de Teste (1 minuto)

Enquanto o KDS estiver aberto:

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
tail -f /tmp/vite-kds.log
```

### Restaurant ID não encontrado

```bash
cd docker-core
./show-everything.sh
```

### Abrir manualmente

```
http://localhost:5173/kds/00000000-0000-0000-0000-000000000100?demo=true&kdsVersion=new&noLegacy=true
```

---

**Pronto para testar!**

_Prompt: 2026-01-25_
