# DESKTOP_DISTRIBUTION_CONTRACT — Electron (TPV / KDS)

**Status:** CANONICAL
**Tipo:** Contrato de distribuição — como empacotar TPV e KDS para desktop
**Local:** docs/architecture/DESKTOP_DISTRIBUTION_CONTRACT.md
**Hierarquia:** Subordinado a [SYSTEM_RULE_DEVICE_ONLY.md](./SYSTEM_RULE_DEVICE_ONLY.md) e [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md)

---

## Princípio

TPV e KDS **NÃO podem ser acedidos pelo navegador** (regra de sistema imutável). São distribuídos exclusivamente como **Electron** (app desktop). O frontend (merchant-portal) é carregado dentro do Electron shell; a lógica permanece no frontend e no Core.

O `BrowserBlockGuard` impede o acesso a `/op/tpv` e `/op/kds` em navegador de produção.

---

## Escopo

| Alvo | Rota canónica | Plataforma | Browser   |
| ---- | ------------- | ---------- | --------- |
| TPV  | /op/tpv       | Electron   | Bloqueado |
| KDS  | /op/kds       | Electron   | Bloqueado |

---

## Electron

| Aspecto      | Regra                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| URL interna  | App Electron carrega merchant-portal nas rotas /op/tpv ou /op/kds.          |
| Janela       | TPV: janela redimensionável; KDS: fullscreen, sem barra de título.          |
| Atualizações | Auto-update ou notificação de nova versão; não quebrar sessão ativa.        |
| Versão       | Versão do app desktop alinhada a versão do frontend (tag, changelog).       |
| User-Agent   | Deve incluir "Electron" no user-agent para detecção pelo BrowserBlockGuard. |

Electron é shell; a lógica continua no frontend e no Core. Não duplicar lógica no processo main.

---

## Provisioning

O dispositivo desktop deve ser provisionado via QR (Admin → Dispositivos):

1. Admin gera QR em `/admin/devices`
2. URL do QR aponta para `/install?token=xxx`
3. Token é consumido → terminal registado em `gm_terminals`
4. Electron detecta o terminal_id local e abre a rota correspondente

---

## Política de versão

| Canal            | Uso                                                                               |
| ---------------- | --------------------------------------------------------------------------------- |
| Produção         | Versão estável; atualizações com changelog; compatibilidade com Core em produção. |
| Piloto / staging | Versão de teste; pode exigir versão específica do Core.                           |

---

## Referências

- [SYSTEM_RULE_DEVICE_ONLY.md](./SYSTEM_RULE_DEVICE_ONLY.md) — regra imutável de acesso
- [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) — rotas /op/tpv, /op/kds
- [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) — contrato de instalação
- `merchant-portal/src/components/operational/BrowserBlockGuard.tsx` — guard de bloqueio

**Violação = alterar rota ou gate de /op/\* no desktop sem atualizar este contrato.**
