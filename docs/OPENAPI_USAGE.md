# OpenAPI Specification - Usage Guide

**Specification:** `openapi-core-stable-v1.yaml`  
**Version:** 1.0.0  
**Status:** ✅ **FROZEN / STABLE**

---

## 🚀 Quick Start

### View in Swagger UI

```bash
# Using npx (no installation needed)
npx swagger-ui-serve openapi-core-stable-v1.yaml

# Or using Docker
docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v $(pwd)/openapi-core-stable-v1.yaml:/openapi.yaml swaggerapi/swagger-ui
```

### Validate Specification

```bash
# Using swagger-cli
npx @apidevtools/swagger-cli validate openapi-core-stable-v1.yaml

# Or using openapi-validator
npx openapi-validator openapi-core-stable-v1.yaml
```

### Generate Client SDKs

```bash
# TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i openapi-core-stable-v1.yaml \
  -g typescript-axios \
  -o ./generated/typescript-client

# Python client
npx @openapitools/openapi-generator-cli generate \
  -i openapi-core-stable-v1.yaml \
  -g python \
  -o ./generated/python-client
```

---

## 📋 What's Included

### Endpoints Documented

1. **Health**
   - `GET /health`
   - `GET /api/health`

2. **Authentication**
   - `POST /api/auth/request-magic-link`
   - `GET /api/auth/verify-magic-link`

3. **Orders**
   - `POST /api/orders`
   - `GET /api/orders/{orderId}`
   - `PATCH /api/orders/{orderId}`
   - `POST /api/orders/{orderId}/lock`
   - `POST /api/orders/{orderId}/close`

### Total: 9 endpoints

---

## 🚫 What's NOT Included

The following are **explicitly excluded** from this specification:

- ❌ Payment Processing (`/api/payment-intent`)
- ❌ Billing (`/api/billing/*`)
- ❌ Onboarding (`/api/onboarding/*`)
- ❌ Internal endpoints (`/internal/*`)
- ❌ Public pages (`/public/*`)

**These are Phase 2+ features.**

---

## 📚 Documentation

- **Specification:** `openapi-core-stable-v1.yaml`
- **Usage Guide:** This file
- **Detailed Docs:** `docs/OPENAPI_CORE_STABLE_V1.md`

---

**Status:** ✅ **READY FOR USE**

