# 🧪 TestSprite - Instruções de Configuração
**ChefIApp POS Core - Backend API Testing**

---

## 🎯 Problema Identificado

O TestSprite está gerando testes genéricos que não respeitam o contrato rico do ChefIApp.

**Sintoma:** `400 Bad Request` ao criar pedidos

**Causa:** Payload mínimo não atende requisitos do sistema

---

## ✅ Solução: Usar Contrato Oficial

### 1. Autenticação (OBRIGATÓRIA)

**Fluxo completo:**

```python
# Step 1: Request Magic Link
response = requests.post(
    "http://localhost:4320/api/auth/request-magic-link",
    json={"email": "test@chefiapp.test"}
)
dev_token = response.json()["dev_token"]

# Step 2: Verify Magic Link
response = requests.get(
    f"http://localhost:4320/api/auth/verify-magic-link?token={dev_token}"
)
session_token = response.json()["session_token"]

# Step 3: Use session_token in all order requests
headers = {
    "x-chefiapp-token": session_token,
    "Content-Type": "application/json"
}
```

### 2. Payload Mínimo Válido

**NUNCA envie:**
```json
{
  "table": 1
}
```

**SEMPRE envie:**
```json
{
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Test Product",
      "quantity": 1,
      "unitPrice": 1000
    }
  ]
}
```

### 3. Campos Obrigatórios

**Request:**
- ✅ `items`: Array com pelo menos 1 item (OBRIGATÓRIO)

**Cada item deve ter:**
- ✅ `productId`: UUID válido (deve existir no banco)
- ✅ `name`: String (nome do produto)
- ✅ `quantity`: Number (default: 1)
- ✅ `unitPrice`: Number (preço em centavos)

**Opcionais:**
- `restaurantId`: UUID (usa env var se não fornecido)
- `paymentMethod`: 'cash' | 'card' | 'pix' (default: 'cash')

---

## 📋 Template de Teste Correto

### TC003: Create Order (CORRETO)

```python
import requests
import uuid

BASE_URL = "http://localhost:4320"

def test_create_order():
    # 1. Authenticate
    auth_response = requests.post(
        f"{BASE_URL}/api/auth/request-magic-link",
        json={"email": "test@chefiapp.test"}
    )
    dev_token = auth_response.json()["dev_token"]
    
    verify_response = requests.get(
        f"{BASE_URL}/api/auth/verify-magic-link?token={dev_token}"
    )
    session_token = verify_response.json()["session_token"]
    
    # 2. Create Order with valid payload
    headers = {
        "x-chefiapp-token": session_token,
        "Content-Type": "application/json"
    }
    
    payload = {
        "items": [
            {
                "productId": "550e8400-e29b-41d4-a716-446655440000",  # Must exist in DB
                "name": "Test Product",
                "quantity": 1,
                "unitPrice": 1000
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/orders",
        json=payload,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "order_id" in data
    assert data["state"] == "OPEN"
    assert len(data["items"]) == 1
    assert data["total_cents"] == 1000
```

---

## 🔧 Configuração do TestSprite

### Additional Instructions

Ao gerar testes, incluir estas instruções:

```
Use the session infrastructure from the test plan. For tests that require authentication, automatically create a session by: 
1) POST /api/auth/request-magic-link with email "test@chefiapp.test", 
2) Extract dev_token, 
3) GET /api/auth/verify-magic-link?token={dev_token}, 
4) Extract session_token and use it in x-chefiapp-token header for all order operations.

IMPORTANT: The API requires a rich contract:
- POST /api/orders REQUIRES "items" array with at least 1 item
- Each item MUST have: productId (UUID), name (string), quantity (number), unitPrice (number in cents)
- Never send empty items array or missing items field
- Product IDs must exist in database
- Use test fixture from TEST_FIXTURE_ORDERS.json for valid payloads
```

---

## 📄 Documentação de Referência

- **Contrato Oficial:** `docs/API_CONTRACT_ORDERS.md`
- **Test Fixture:** `testsprite_tests/TEST_FIXTURE_ORDERS.json`
- **Código Fonte:** `server/web-module-api-server.ts` (linha 2324-2443)

---

## ⚠️ Erros Comuns

### 400 Bad Request - "items array required"
**Causa:** Campo `items` ausente ou vazio  
**Solução:** Sempre incluir `items` com pelo menos 1 item

### 401 Unauthorized - "SESSION_REQUIRED"
**Causa:** Header `x-chefiapp-token` ausente ou inválido  
**Solução:** Implementar fluxo de Magic Link antes de criar pedidos

### 500 Internal Server Error
**Causa:** Product ID não existe no banco ou dados inválidos  
**Solução:** Usar product IDs válidos que existem no banco de teste

---

**Última Atualização:** 2026-01-13  
**Status:** ✅ Pronto para uso
