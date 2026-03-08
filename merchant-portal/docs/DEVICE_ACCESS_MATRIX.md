# Matriz de Acesso por Dispositivo (Constituição v2.0)

Esta matriz define estritamente QUAL dispositivo pode acessar QUAL ambiente.
É a aplicação prática da [Lei da Fundação vs Operação](./FOUNDATION_VS_OPERATION.md).

## Definições de Dispositivo
- **📱 Mobile**: Viewport < 768px (Phones). Interação por toque. Contexto: "Em movimento".
- **💻 Desktop**: Viewport >= 1024px (Laptops, PCs). Interação Mouse/Teclado. Contexto: "Comando Central".
- **📟 Tablet**: Viewport >= 768px (iPad, Android Tablets). Interação Híbrida. Contexto: "Operação de Piso".

## Matriz de Soberania

| Ambiente / Rota | 📱 Mobile | 📟 Tablet | 💻 Desktop | Propósito Estrito |
| :--- | :---: | :---: | :---: | :--- |
| **Landing Page** (`/`) | ✅ SIM | ✅ SIM | ✅ SIM | Marketing & Entrada |
| **Auth** (`/auth`) | ✅ SIM | ✅ SIM | ✅ SIM | Identificação |
| **Onboarding** (`/onboarding/*`) | ✅ SIM | ✅ SIM | ✅ SIM | **FUNDAÇÃO** da Entidade |
| **Foundation Screen** (`.../foundation`) | ✅ SIM | ✅ SIM | ✅ SIM | Handoff & Confirmação |
| **Dashboard** (`/app/dashboard`) | ⛔ **BLOQUEADO** | ✅ SIM | ✅ SIM | **COMANDO** Estratégico |
| **POS (Caixa)** (`/app/pos`) | ⛔ **BLOQUEADO** | ✅ SIM | ✅ SIM | Vendas & Transações |
| **KDS (Cozinha)** (`/app/kds`) | ⛔ **BLOQUEADO** | ✅ SIM | ✅ SIM | Produção & Fluxo |
| **Settings** (`/app/settings`) | ⚠️ *Futuro* | ✅ SIM | ✅ SIM | Configuração Técnica |
| **Mobile Companion** (`/app/mobile`) | ✅ *Futuro* | ❌ N/A | ❌ N/A | *Visualização Passiva* |

## Regras de Bloqueio (Enforcement)

1.  **Bloqueio Físico**:
    Se `isMobile()` for detetado em rotas `/app/*` (exceto Companion futura), o sistema deve **Redirecionar Forçadamente** para `/onboarding/foundation` ou tela de "Device Incompatible".

2.  **Exceção de Soberano**:
    O dono (Role: Owner) pode, em teoria, forçar o modo Desktop no mobile via browser, mas a UX não é garantida. O sistema não deve facilitar isso.

3.  **Tablet é Operação**:
    Tablets são considerados dispositivos de operação válidos para POS e KDS, mas o Dashboard pode ter limitações de layout.

---
**Status**: VIGENTE.
**Implementação**: `CoreFlow.ts` -> `isMobileDevice()` check.
