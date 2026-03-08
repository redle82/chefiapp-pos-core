# Guia de Internacionalização (i18n)

O sistema usa **react-i18next** e escolhe o idioma por **país** (e, na falta, por **moeda/região**). O idioma padrão é **pt-BR**.

---

## 1. Como o idioma é escolhido

| Fonte | Prioridade | Exemplo |
|-------|------------|--------|
| **chefiapp_locale** (localStorage) | 1ª | Utilizador mudou no LocaleSwitcher → esse idioma |
| **País** do restaurante (onboarding/identidade) | 2ª | BR → pt-BR, PT → pt-PT, ES → es, US → en |
| **Moeda** (quando não há país) | 3ª | BRL → pt-BR, EUR → pt-PT |
| **Default** | 4ª | pt-BR |

- Ao carregar o restaurante, `country` e `currency` são gravados e o locale é aplicado.
- Ao mudar país/moeda no onboarding, o idioma é atualizado.
- Config: `merchant-portal/src/core/i18n/regionLocaleConfig.ts`.

---

## 2. Idiomas suportados

| Código | Idioma | Região principal |
|--------|--------|-------------------|
| **pt-BR** | Português (Brasil) | Brasil (default) |
| **pt-PT** | Português (Portugal) | Europa (PT) |
| **es** | Español | Europa (ES), Latam (MX, AR, CO, …) |
| **en** | English | Resto do mundo, fallback |

Ficheiros de tradução: `merchant-portal/src/locales/{pt-BR|pt-PT|en|es}/{namespace}.json`.

---

## 3. Como traduzir uma string (passo a passo)

### 3.1 Escolher o namespace

| Namespace | Uso |
|-----------|-----|
| `common` | Botões, labels genéricos (Salvar, Cancelar, Carregando…), erros |
| `tpv` | TPV, pagamentos, recibos |
| `kds` | Cozinha (KDS) |
| `onboarding` | Onboarding, identidade, configuração inicial |
| `config` | Páginas de configuração |
| `dashboard` | Dashboard, métricas |
| `operational` | Operação, turnos |
| `shift` | Turnos, abertura/fecho |
| `receipt` | Recibos |
| `reservations` | Reservas |
| `pwa` | PWA, instalação |
| `waiter` | Waiter / garçom |

### 3.2 Adicionar a chave em todos os idiomas

Em cada ficheiro `src/locales/{pt-BR,pt-PT,en,es}/{namespace}.json` adicionar a mesma chave:

**pt-BR:** `merchant-portal/src/locales/pt-BR/config.json`
```json
{
  "tpvSettingsTitle": "Definições do TPV",
  "tpvSettingsCurrency": "Moeda",
  "tpvSettingsLanguage": "Idioma"
}
```

**en:** `merchant-portal/src/locales/en/config.json`
```json
{
  "tpvSettingsTitle": "TPV Settings",
  "tpvSettingsCurrency": "Currency",
  "tpvSettingsLanguage": "Language"
}
```

Repetir para `pt-PT` e `es` com os textos corretos.

### 3.3 Usar no componente

```tsx
import { useTranslation } from "react-i18next";

export function TPVSettingsPage() {
  const { t } = useTranslation("config");

  return (
    <div>
      <h1>{t("config:tpvSettingsTitle")}</h1>
      <h3>{t("config:tpvSettingsLanguage")}</h3>
      <h3>{t("config:tpvSettingsCurrency")}</h3>
    </div>
  );
}
```

Ou com namespace no hook: `useTranslation("config")` e depois `t("tpvSettingsTitle")`.

---

## 4. Fallback quando falta tradução

- `fallbackLng: ["pt-BR", "en"]`: se uma chave não existir no idioma atual, o i18n usa primeiro **pt-BR**, depois **en**.
- Assim, ao adicionar uma chave nova, podes colocá-la primeiro em pt-BR (e en se quiseres); nos outros idiomas pode ficar para depois.

---

## 5. Como internacionalizar o sistema todo

1. **Encontrar texto fixo**  
   Procurar em `merchant-portal/src` por strings em português/espanhol/inglês dentro de JSX ou `message="..."` (ex.: "Definições do TPV", "A carregar menu...", "Complete o bootstrap...").

2. **Por página ou fluxo**  
   - Escolher o namespace (ex.: config, onboarding, common).  
   - Adicionar chaves em todos os locales: `pt-BR`, `pt-PT`, `en`, `es`.  
   - Substituir a string fixa por `t("namespace:key")` (ou `t("key")` se o namespace for passado ao `useTranslation`).

3. **Datas e números**  
   - Preferir `Intl` com o locale atual:  
     `new Intl.DateTimeFormat(i18n.language, { ... })`  
     `new Intl.NumberFormat(i18n.language, { style: 'currency', currency })`  
   - Ou usar helpers que já recebam o locale (ex.: `formatAmount` do `useCurrency`).

4. **Prioridade sugerida**  
   - Comum (common): botões, labels, erros.  
   - Onboarding e identidade (onboarding).  
   - TPV e config (tpv, config).  
   - Depois: KDS, dashboard, operational, shift, receipt, reservations, pwa, waiter.

---

## 6. Adicionar um novo idioma (ex.: francês)

1. Criar a pasta e ficheiros:  
   `merchant-portal/src/locales/fr/common.json`, `config.json`, etc. (copiar de `en` ou `pt-BR` e traduzir).

2. Em `i18n.ts`:  
   - Importar os JSONs de `fr`.  
   - Adicionar `fr` a `resources` (como `pt-PT`, `en`, `es`).  
   - Incluir `fr` em `ALL_NS` se necessário (geralmente não; só nos resources).

3. Em `regionLocaleConfig.ts`:  
   - Adicionar `SupportedLocale` tipo `"fr"`.  
   - Em `COUNTRY_LOCALE`, mapear países (ex.: FR → `"fr"`).  
   - Em `REGION_DEFAULT_LOCALE` ou lógica de região, se fizer sentido.

4. No `LocaleSwitcher`:  
   - Adicionar `{ code: "fr", flag: "🇫🇷", label: "Français" }` à lista de locales.

---

## 7. Ficheiros principais

| Ficheiro | Função |
|----------|--------|
| `merchant-portal/src/i18n.ts` | Inicialização, idioma inicial, fallbackLng |
| `merchant-portal/src/core/i18n/regionLocaleConfig.ts` | País/região → locale |
| `merchant-portal/src/core/currency/useCurrency.ts` | Sincroniza locale quando a moeda muda |
| `merchant-portal/src/core/identity/useRestaurantIdentity.ts` | Persiste país/moeda/locale ao carregar restaurante |
| `merchant-portal/src/components/LocaleSwitcher.tsx` | Troca manual de idioma |
| `merchant-portal/src/locales/{locale}/*.json` | Textos por idioma e namespace |

---

## 8. Checklist rápido

- [ ] Novo texto na UI → adicionar chave em `pt-BR`, `pt-PT`, `en`, `es` no namespace certo.
- [ ] No componente → `useTranslation("namespace")` e `t("key")`.
- [ ] Datas/números → usar `i18n.language` em `Intl` ou helpers existentes.
- [ ] Idioma segue país → já feito (identidade/onboarding + regionLocaleConfig).
- [ ] Fallback → falta de chave usa pt-BR depois en (configurado em `i18n.ts`).
