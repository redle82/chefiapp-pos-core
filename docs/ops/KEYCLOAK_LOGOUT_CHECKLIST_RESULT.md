# Resultado do checklist — Logout Keycloak (local)

**Data da execução:** 2025-03-10 (execução automática local)  
**Runbook:** `docs/ops/KEYCLOAK_LOGOUT_CHECKLIST.md`  
**Objetivo:** Fechar origem do erro "Route not found" sem mexer no frontend antes de provar ambiente.

---

## 1. Estado verificado

- **Frontend:** `authKeycloak.ts` monta a URL de logout com `new URL(path, base)` e `searchParams.set(...)`. Sem concatenação manual. Redirecionamento com `window.location.assign(logoutUrl.toString())`.
- **Ambiente:** Keycloak em `http://localhost:8080`, realm `chefiapp`, cliente `merchant-portal`. Variáveis lidas de `.env.local` ou defaults do código.

---

## 2. Resultado por ponto do checklist

### Ponto 1 — Endpoint de logout real

**Ação:** Pedido HTTP GET ao endpoint (curl, sem seguir redirects).

**URL testada:**
```
http://localhost:8080/realms/chefiapp/protocol/openid-connect/logout?client_id=merchant-portal&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A5175%2Fadmin%2Fmodules
```

**Resultado:** **PASS**

**Evidência:**
- HTTP **302** (redirect).
- `Location: http://localhost:5175/admin/modules`
- Não há "Route not found"; o IdP aceita o path e os query params e redireciona para o `post_logout_redirect_uri`.

**Conclusão:** Realm, path e base URL do IdP estão corretos. O servidor em :8080 responde como Keycloak ao endpoint de logout.

---

### Ponto 2 — Cliente `merchant-portal` no Keycloak

**Ação:** Não é possível verificar automaticamente (Admin UI do Keycloak). Inferência a partir do comportamento do endpoint.

**Resultado:** **PASS (inferido)**

**Evidência:** O endpoint devolveu 302 para exatamente `http://localhost:5175/admin/modules`. O Keycloak só envia redirect para um URI que esteja autorizado no cliente (Valid Redirect URIs / Post Logout Redirect URIs). Portanto, esse URI está aceite para o cliente usado.

**Recomendação:** Se no browser o logout ainda falhar (erro ou redirect para sítio errado), validar manualmente em Keycloak Admin → Realm chefiapp → Clients → merchant-portal: **Valid Redirect URIs** e **Post Logout Redirect URIs** devem incluir `http://localhost:5175/admin/modules` (ou `http://localhost:5175/*`).

---

### Ponto 3 — Realm e base URL / variáveis `VITE_KEYCLOAK_*`

**Ação:** Leitura de `merchant-portal/.env.local` e de `authKeycloak.ts` (defaults).

**Resultado:** **PASS**

**Evidência:**

| Variável / conceito   | Esperado (local)        | Valor em .env.local / código |
|-----------------------|-------------------------|-----------------------------|
| Base URL do IdP       | `http://localhost:8080` | `VITE_KEYCLOAK_URL=http://localhost:8080` |
| Realm                 | `chefiapp`              | `VITE_KEYCLOAK_REALM=chefiapp` |
| Client ID             | `merchant-portal`       | `VITE_KEYCLOAK_CLIENT_ID=merchant-portal` |

A app usa exatamente estes valores; o endpoint testado com os mesmos parâmetros devolve 302 para o redirect esperado.

---

### Ponto 4 — id_token_hint

**Ação:** Só se aplica se os pontos 1–3 passarem e o logout **no browser** continuar a falhar.

**Resultado:** **N/A (não executado)**

**Motivo:** Os pontos 1–3 passaram. O endpoint de logout está correto e o redirect é o esperado. Não se alterou o frontend nem se adicionou `id_token_hint`.

**Se no browser o logout ainda falhar:** O código atual **não guarda** `id_token` (apenas `access_token` e `refresh_token`). O token endpoint do Keycloak devolve `id_token` quando o scope inclui `openid`. Próximo passo seria: em `authKeycloak.ts`, persistir `data.id_token` no estado de sessão e, em `signOutKeycloak()`, fazer `logoutUrl.searchParams.set("id_token_hint", idToken)` antes de `window.location.assign`. Só implementar após confirmar que o problema persiste no browser com o ambiente atual.

---

## 3. Implementação executada

- **Nenhuma.** Nenhuma alteração no frontend. Nenhuma alteração em Keycloak. Apenas execução do checklist e testes HTTP ao endpoint.

---

## 4. Conclusão

- **Problema é de ambiente/configuração ou de frontend?**  
  Com o estado atual do código e do ambiente local, o **endpoint de logout está correto** e o Keycloak responde com 302 para `http://localhost:5175/admin/modules`. O erro "Route not found" que tinhas antes deve ter sido causado pela URL montada **sem** `?` (concatenação manual), já corrigida no frontend.
- **Ambiente local (Keycloak + .env):** Consistente com o runbook; pontos 1–3 do checklist **passam**.

---

## 5. Próximo passo recomendado

1. **Testar logout no browser** com a app a correr e Keycloak em :8080: fazer login (Keycloak) e depois clicar em Sair no portal.  
   - Se o logout redirecionar para `/admin/modules` e a sessão terminar: **caso encerrado.**  
   - Se ainda aparecer "Route not found" ou outro erro: anotar a URL exacta que o browser mostra na barra de endereço no momento do erro e partilhar. Aí sim considerar adicionar `id_token_hint` (e persistir `id_token` na sessão) como passo seguinte.
2. **Não alterar mais o frontend** até que este teste no browser confirme que o logout continua a falhar com o ambiente actual.

---

**Resumo:** Checklist executado localmente. Endpoint de logout OK (302 para `/admin/modules`). Variáveis de ambiente OK. Nenhuma alteração de código. Próximo passo: validar logout no browser e só então decidir se é necessário `id_token_hint`.
