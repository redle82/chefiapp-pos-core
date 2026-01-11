# Restaurant Web Pages Preview

**Versão**: 1.0  
**Status**: Implementado

---

## 🎯 Objetivo

Permite que administradores visualizem e acessem todas as páginas públicas do restaurante diretamente do Merchant Portal.

---

## 📍 Localização

**Página**: `/app/web/preview`  
**Componente**: `RestaurantWebPreviewPage.tsx`  
**Util**: `buildPublicUrls.ts`

---

## 🔗 URLs Públicas

### Estrutura de URLs

Base: `http://localhost:4320/public/{slug}`

- **Home**: `/public/{slug}`
- **Menu**: `/public/{slug}/menu`
- **Mesa (QR)**: `/public/{slug}/menu?table={n}` (fallback para menu)

### Exemplo

Para um restaurante com slug `la-trattoria`:
- Home: `http://localhost:4320/public/la-trattoria`
- Menu: `http://localhost:4320/public/la-trattoria/menu`
- Mesa 5: `http://localhost:4320/public/la-trattoria/menu?table=5`

---

## 🛠️ Implementação

### Util: `buildPublicUrls.ts`

```typescript
import { buildPublicUrls, getRestaurantSlug } from '../../utils/buildPublicUrls';

// Obter slug do restaurante
const slug = await getRestaurantSlug(restaurantId);

// Construir URLs
const urls = buildPublicUrls(slug);
// { home: "...", menu: "...", table: (n) => "..." }
```

### API Endpoint

**GET** `/api/restaurants/:id/public-profile`

Retorna informações do perfil público:
```json
{
  "slug": "la-trattoria",
  "status": "published",
  "web_level": "BASIC"
}
```

---

## 🎨 Interface

### Cards de Links

1. **Página Inicial**
   - URL completa
   - Botão "Abrir em Nova Aba"

2. **Cardápio Público**
   - URL completa
   - Botão "Abrir em Nova Aba"

3. **Links de Mesa (QR Code)**
   - Grid de botões para mesas 1-12
   - Cada botão abre a URL da mesa em nova aba

### Estados

- **Loading**: Exibe "Carregando..." enquanto busca slug
- **Sem Slug**: Mensagem informativa + botão para voltar
- **Com Slug**: Lista completa de links

---

## 🔧 Configuração

### Variáveis de Ambiente

- `VITE_API_BASE`: Base URL do servidor web (padrão: `http://localhost:4320`)

### Dependências

- Requer `restaurant_id` no `localStorage` (`chefiapp_restaurant_id`)
- Requer que o restaurante tenha `slug` configurado no banco

---

## 📋 Funcionalidades

### ✅ Implementado

- [x] Busca automática de slug via API
- [x] Construção de URLs públicas
- [x] Links para Home e Menu
- [x] Preview de links de mesa (1-12)
- [x] Abertura em nova aba
- [x] Estados de loading e erro

### 🚧 Futuro

- [ ] Preview inline (iframe) - se CSP permitir
- [ ] Geração de QR codes para mesas
- [ ] Compartilhamento de links
- [ ] Estatísticas de acesso por página

---

## 🧪 Testes

### Manual

1. Acesse `/app/web/preview`
2. Verifique se o slug é carregado
3. Clique em cada link e verifique se abre corretamente
4. Teste com restaurante sem slug (deve mostrar mensagem)

### E2E (Futuro)

```typescript
test('should load and display public URLs', async () => {
  // Navigate to preview page
  // Verify slug is loaded
  // Verify URLs are displayed
  // Click links and verify they open
});
```

---

## 🔗 Relacionado

- **Server**: `server/web-module-api-server.ts` (rotas `/public/:slug`)
- **Migration**: Ver migrations relacionadas a `restaurant_web_profiles`
- **Design System**: Usa componentes UDS (`Card`, `Button`, `Text`)

---

**ChefIApp — TPV simples. Sem comissões. Sem gestão.**

