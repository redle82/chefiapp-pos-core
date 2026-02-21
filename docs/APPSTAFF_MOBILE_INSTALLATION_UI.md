# AppStaff Mobile Installation UI - Melhorias

## Resumo das Mudanças

Implementado um novo fluxo de instalação para AppStaff que substitui os botões genéricos de "abrir e instalar" por uma interface dedicada com:

### 1. **Página de Sucesso Melhorada** (`/install?token=xxx`)

Após consumir o token de provisioning, o AppStaff agora mostra:

- ✅ **QR Code** para partilhar com outros dispositivos
- 🍎 **Apple App Store** (Em breve)
- 🤖 **Google Play** (Em breve)
- 💡 **Informação sobre as diferenças** entre as instalações

### 2. **Nova Página de Downloads** (`/install/apps`)

Página dedicada mostrando:

- Grid com 2 colunas (Apple / Android)
- Ícones e descrições para cada loja
- Botões com status "Em breve"
- Informações detalhadas sobre as diferenças
- Links para as app stores (quando estiverem prontas)

### 3. **QR Code Dinâmico**

O QR code gerado na página de sucesso aponta para `/install/apps`, permitindo que:

- O utilizador partilhe o QR com outros
- Múltiplos dispositivos vejam os mesmos links
- Fácil acesso aos links de download

## Componentes Criados/Modificados

### Novos Ficheiros:

- `merchant-portal/src/pages/InstallAppsPage.tsx` — Página dedicada para downloads

### Ficheiros Modificados:

- `merchant-portal/src/pages/InstallPage.tsx`

  - Adiciona QR code via `react-qr-code`
  - Layout reformulado para AppStaff com grid de lojas
  - Secção de informações sobre as diferenças

- `merchant-portal/src/pages/InstallPage.module.css`

  - Novos estilos para `.qrContainer`, `.qrPlaceholder`
  - Grid de lojas: `.storesGrid`, `.storeOption`
  - Botões das lojas: `.storeBtn`, `.storeIcon`, `.storeName`, etc.
  - Caixas de informação: `.infoBox`, `.infoBoxAlt`

- `merchant-portal/src/routes/OperationalRoutes.tsx`
  - Import de `InstallAppsPage`
  - Nova rota `<Route path="/install/apps" element={<InstallAppsPage />} />`

## Visual da Interface

### Sucesso para AppStaff:

```
✅ Dispositivo ativado

[Terminal Details Card]

### Instalar via QR Code
Digitalize este código com o seu telemóvel...
[QR Code - 200px]

### Descarregar aplicação
Escolha a loja compatível:

[🍎 Apple App Store]  [🤖 Google Play]
Para iPhone e iPad     Para Android
[Em breve]             [Em breve]

💡 Diferença entre as lojas:
- Apple App Store: Para iPhone/iPad
- Google Play: Para Android
```

## Próximos Passos

1. **Quando as apps estiverem prontas:**

   - Atualizar URLs dos links das lojas
   - Remover badges "Em breve"
   - Tornar botões clicáveis

2. **Melhorias futuras:**
   - Suporte para múltiplos idiomas
   - Deep linking direto para a app instalada
   - Rastreamento de instalações

## Contrato de Acesso

Interface disponível apenas se:

- ✅ Dispositivo é AppStaff (não TPV/KDS)
- ✅ Token foi consumido com sucesso
- ✅ Utilizador está no `/install?token=xxx`

Desktop (TPV/KDS) continua com o fluxo original.
