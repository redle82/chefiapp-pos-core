# Checklist Keycloak — Logout OIDC (2 min)

Quando o logout falha com "Route not found" ou redirect inválido, o frontend já monta a URL com `URL` + `searchParams`. O problema costuma ser configuração do cliente no Keycloak.

## 1. Endpoint de logout real

Abre no browser (Keycloak em :8080, realm `chefiapp`):

```
http://localhost:8080/realms/chefiapp/protocol/openid-connect/logout?client_id=merchant-portal&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A5175%2Fauth
```

- **Se devolver "Route not found":** realm/path ou base URL do IdP errados, ou o servidor em :8080 não é o Keycloak esperado.
- **Se redirecionar ou pedir confirmação:** o endpoint está correto; seguir para o passo 2.

## 2. Cliente `merchant-portal` no Keycloak

No Keycloak Admin: **Realm** → **Clients** → **merchant-portal**.

- **Valid Redirect URIs:** incluir pelo menos  
  `http://localhost:5175/*`
- **Post Logout Redirect URIs:** incluir o redirect pós-logout da app, e.g.  
  `http://localhost:5175/auth`  
  (e o equivalente em produção). Sem isto o IdP pode recusar o redirect após logout.

Sem isto o IdP pode recusar o redirect após logout.

## 3. Realm e base URL

Confirmar que a app usa exatamente:

| Variável / conceito | Valor esperado (local) |
|--------------------|------------------------|
| Realm              | `chefiapp`             |
| Base URL do IdP    | `http://localhost:8080` |
| Client ID          | `merchant-portal`      |

No frontend: `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID` (ver `authKeycloak.ts` / `.env.local`). Qualquer diferença entre o que a app monta e o que o Keycloak serve pode fazer o logout falhar.

## 4. id_token_hint (se ainda falhar)

Alguns setups Keycloak/OIDC ficam mais estáveis quando o logout envia também `id_token_hint` (o id_token da sessão atual). Se a URL e os redirect URIs estiverem corretos e o logout continuar a falhar, o próximo ajuste é o frontend enviar esse parâmetro no pedido de logout.

---

**Resumo:** Se o frontend já usa `new URL(...)`, `searchParams.set(...)` e `assign(...)`, o bug deixa de ser montagem de URL no browser e passa a ser configuração/compatibilidade do logout OIDC no Keycloak. Validar os 4 pontos acima.
