/**
 * i18n — Internacionalização com react-i18next.
 * Locales: pt-BR (default), pt-PT, en, es.
 * Namespaces: common, legal, billing, tpv, onboarding, help, kds, shift, receipt,
 *             reservations, config, pwa, dashboard, operational.
 *
 * JSON locale files live under src/locales/{locale}/{namespace}.json
 * legal + billing remain inline (they are already translated & stable).
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// ─── JSON locale imports ────────────────────────────────────────────────────
// Common
import ptPTCommon from "./locales/pt-PT/common.json";
// TPV
import ptPTTpv from "./locales/pt-PT/tpv.json";
// KDS
import ptPTKds from "./locales/pt-PT/kds.json";
// Onboarding
import ptPTOnboarding from "./locales/pt-PT/onboarding.json";
// Shift
import ptPTShift from "./locales/pt-PT/shift.json";
// Receipt
import ptPTReceipt from "./locales/pt-PT/receipt.json";
// Reservations
import ptPTReservations from "./locales/pt-PT/reservations.json";
// Config
import ptPTConfig from "./locales/pt-PT/config.json";
// PWA
import ptPTPwa from "./locales/pt-PT/pwa.json";
// Dashboard
import ptPTDashboard from "./locales/pt-PT/dashboard.json";
// Operational
import ptPTOperational from "./locales/pt-PT/operational.json";
// Waiter
import ptPTWaiter from "./locales/pt-PT/waiter.json";
// Sidebar
import ptPTSidebar from "./locales/pt-PT/sidebar.json";
// Customer Menu
import ptPTCustomerMenu from "./locales/pt-PT/customer-menu.json";

// ── pt-BR ───────────────────────────────────────────────────────────────────
import ptBRCommon from "./locales/pt-BR/common.json";
import ptBRConfig from "./locales/pt-BR/config.json";
import ptBRDashboard from "./locales/pt-BR/dashboard.json";
import ptBRKds from "./locales/pt-BR/kds.json";
import ptBROnboarding from "./locales/pt-BR/onboarding.json";
import ptBROperational from "./locales/pt-BR/operational.json";
import ptBRPwa from "./locales/pt-BR/pwa.json";
import ptBRReceipt from "./locales/pt-BR/receipt.json";
import ptBRReservations from "./locales/pt-BR/reservations.json";
import ptBRShift from "./locales/pt-BR/shift.json";
import ptBRSidebar from "./locales/pt-BR/sidebar.json";
import ptBRTpv from "./locales/pt-BR/tpv.json";
import ptBRWaiter from "./locales/pt-BR/waiter.json";
import ptBRCustomerMenu from "./locales/pt-BR/customer-menu.json";

// ── en ──────────────────────────────────────────────────────────────────────
import enCommon from "./locales/en/common.json";
import enConfig from "./locales/en/config.json";
import enDashboard from "./locales/en/dashboard.json";
import enKds from "./locales/en/kds.json";
import enOnboarding from "./locales/en/onboarding.json";
import enOperational from "./locales/en/operational.json";
import enPwa from "./locales/en/pwa.json";
import enReceipt from "./locales/en/receipt.json";
import enReservations from "./locales/en/reservations.json";
import enShift from "./locales/en/shift.json";
import enSidebar from "./locales/en/sidebar.json";
import enTpv from "./locales/en/tpv.json";
import enWaiter from "./locales/en/waiter.json";
import enCustomerMenu from "./locales/en/customer-menu.json";

// ── es ──────────────────────────────────────────────────────────────────────
import {
  getLocaleFromBrowser,
  resolveLocale,
} from "./core/i18n/regionLocaleConfig";
import esCommon from "./locales/es/common.json";
import esConfig from "./locales/es/config.json";
import esDashboard from "./locales/es/dashboard.json";
import esKds from "./locales/es/kds.json";
import esOnboarding from "./locales/es/onboarding.json";
import esOperational from "./locales/es/operational.json";
import esPwa from "./locales/es/pwa.json";
import esReceipt from "./locales/es/receipt.json";
import esReservations from "./locales/es/reservations.json";
import esShift from "./locales/es/shift.json";
import esSidebar from "./locales/es/sidebar.json";
import esTpv from "./locales/es/tpv.json";
import esWaiter from "./locales/es/waiter.json";
import esCustomerMenu from "./locales/es/customer-menu.json";

const DEFAULT_LANG = "pt-BR";

const ALL_NS = [
  "common",
  "legal",
  "billing",
  "tpv",
  "onboarding",
  "help",
  "kds",
  "shift",
  "receipt",
  "reservations",
  "config",
  "pwa",
  "dashboard",
  "operational",
  "waiter",
  "sidebar",
  "customer-menu",
] as const;

// Respect stored locale (LocaleSwitcher) ou derivar de país/região ou browser.
// Ordem: chefiapp_locale > país/currency (resolveLocale) > browser language > default.
const storedLang =
  typeof window !== "undefined"
    ? localStorage.getItem("chefiapp_locale")
    : null;
const country =
  typeof window !== "undefined"
    ? sessionStorage.getItem("chefiapp_country") ??
      localStorage.getItem("chefiapp_country")
    : null;
const currency =
  typeof window !== "undefined"
    ? sessionStorage.getItem("chefiapp_currency") ??
      localStorage.getItem("chefiapp_currency")
    : null;
const resolvedFromRegion =
  typeof window !== "undefined" && !storedLang
    ? resolveLocale(country, currency)
    : null;
const fromBrowser =
  typeof window !== "undefined" && !storedLang && !resolvedFromRegion
    ? getLocaleFromBrowser()
    : null;

void i18n.use(initReactI18next).init({
  lng: storedLang ?? resolvedFromRegion ?? fromBrowser ?? DEFAULT_LANG,
  fallbackLng: [DEFAULT_LANG, "en"],
  defaultNS: "common",
  ns: [...ALL_NS],
  interpolation: {
    escapeValue: false,
  },
  // Missing key in current locale → try pt-BR, then en (evita texto vazio)
  resources: {
    "pt-PT": {
      common: ptPTCommon,
      tpv: ptPTTpv,
      kds: ptPTKds,
      onboarding: ptPTOnboarding,
      shift: ptPTShift,
      receipt: ptPTReceipt,
      reservations: ptPTReservations,
      config: ptPTConfig,
      pwa: ptPTPwa,
      dashboard: ptPTDashboard,
      operational: ptPTOperational,
      waiter: ptPTWaiter,
      sidebar: ptPTSidebar,
      "customer-menu": ptPTCustomerMenu,
      legal: {
        /* kept inline — stable legal text */
        dataPrivacyTitle: "Dados e privacidade",
        dataPrivacyIntro:
          "De acordo com o RGPD, pode exportar os seus dados ou solicitar a eliminação da conta.",
        exportMyData: "Exportar os meus dados",
        deleteAccountData: "Eliminar conta / dados",
        exportModalTitle: "Exportar os meus dados",
        exportModalBody1:
          "Será enviado um pacote com os dados da sua conta, do restaurante, pedidos e ementa (conforme retenção). O prazo de resposta é até 30 dias.",
        exportModalBody2:
          "Para solicitar, contacte-nos através do endereço indicado na aplicação ou na Política de Privacidade. Pode também aguardar a disponibilização do botão de exportação automática em versões futuras.",
        exportModalDoc:
          "Processo completo: docs/legal/GDPR_DATA_EXPORT_DELETION.md",
        deleteModalTitle: "Eliminar conta / dados",
        deleteModalBody1:
          "Após confirmação e verificação de identidade, os dados da conta e, se for o único responsável pelo restaurante, os dados do restaurante (pedidos, ementa, equipa) serão eliminados em cascade. Dados com obrigação de retenção legal podem ser mantidos pelo tempo mínimo exigido por lei.",
        deleteModalBody2:
          "Para solicitar a eliminação, contacte-nos através do endereço indicado na aplicação ou na Política de Privacidade. O pedido será registado e processado conforme o processo interno.",
        deleteModalDoc:
          "Processo completo: docs/legal/GDPR_DATA_EXPORT_DELETION.md",
        termsTitle: "Termos de Uso",
        termsIntro1:
          "Estes Termos descrevem as regras de uso do ChefIApp para operação comercial. Para publicação e venda, confirme com a sua equipa jurídica o texto final e atualizações regionais.",
        termsIntro2:
          "Ao continuar a usar o produto, concorda com as regras de uso, responsabilidade operacional e políticas aplicáveis.",
        termsS1Title: "1. Responsável",
        termsS1Body:
          "O serviço ChefIApp é operado pela entidade responsável indicada no contrato ou no momento do registo. Para contacto, utilize o endereço disponível na aplicação ou no site.",
        termsS2Title: "2. Aceitação",
        termsS2Body:
          "O acesso e uso do ChefIApp implicam a aceitação destes Termos. Se não concordar, não utilize o serviço.",
        termsS3Title: "3. Uso do serviço",
        termsS3Body:
          "O ChefIApp destina-se à gestão operacional de restaurantes (TPV, ementa, turnos, relatórios). O utilizador é responsável pelo uso correto dos dados e pelo cumprimento das obrigações fiscais e legais do seu país.",
        termsS4Title: "4. Rescisão",
        termsS4Body:
          "Pode encerrar a conta ou a subscrição nos termos do plano. A rescisão não elimina obrigações já contraídas. Consulte a secção de faturação na aplicação para cancelar a subscrição.",
        privacyTitle: "Política de Privacidade",
        privacyIntro1:
          "Esta Política explica como dados operacionais e pessoais são tratados no ChefIApp. Para publicação e venda, valide o texto final com a sua assessoria jurídica e ajustes por país.",
        privacyIntro2:
          "Quando aplicável, o cliente deve informar os titulares de dados e recolher consentimento conforme LGPD/GDPR.",
        privacyS1Title: "1. Recolha de dados",
        privacyS1Body:
          "Recolhemos dados necessários ao funcionamento do serviço: dados de conta, do restaurante, de pedidos, ementa e operadores. Os dados são processados para prestação do serviço, faturação e cumprimento legal.",
        privacyS2Title: "2. Base legal",
        privacyS2Body:
          "O tratamento assenta na execução do contrato, no consentimento (quando aplicável) e no legítimo interesse para melhorar o serviço e a segurança.",
        privacyS3Title: "3. Direitos (GDPR/LGPD)",
        privacyS3Body:
          "Tem direito a aceder, retificar, limitar o tratamento, portar dados e, em certas condições, apagar os seus dados. Pode exercer estes direitos através da área de conta na aplicação (exportar dados, eliminar conta) ou contactando o responsável pelo tratamento.",
        privacyS4Title: "4. Contacto",
        privacyS4Body:
          "Para questões sobre privacidade ou para exercer os seus direitos, utilize o contacto indicado na aplicação ou no site do ChefIApp.",
        dpaTitle: "Acordo de Tratamento de Dados (DPA)",
        dpaIntro1:
          "Este Acordo de Tratamento de Dados descreve as obrigações entre o responsável pelo tratamento (cliente) e o subcontratado (ChefIApp) no âmbito do RGPD.",
        dpaIntro2:
          "Para publicação e venda, confirme com a sua equipa jurídica o texto final e cláusulas contratuais aplicáveis.",
        dpaS1Title: "1. Objeto e instruções",
        dpaS1Body:
          "O subcontratado trata dados pessoais apenas em nome do responsável e em conformidade com as instruções documentadas. O responsável garante que as instruções são lícitas e que os titulares dos dados foram informados.",
        dpaS2Title: "2. Medidas técnicas e organizativas",
        dpaS2Body:
          "O subcontratado aplica medidas técnicas e organizativas adequadas para garantir um nível de segurança apropriado ao risco (confidencialidade, integridade, disponibilidade). O tratamento é documentado e sujeito a auditoria quando exigido por lei.",
        dpaS3Title: "3. Subprocessadores e contacto",
        dpaS3Body:
          "A lista de subprocessadores e a duração do tratamento constam do contrato de prestação de serviços. Para questões sobre o DPA ou para exercer direitos, utilize o contacto indicado na aplicação ou na Política de Privacidade.",
      },
      billing: {
        trialEndsIn_one:
          "Trial termina em {{count}} dia. Escolha o seu plano para continuar.",
        trialEndsIn_other:
          "Trial termina em {{count}} dias. Escolha o seu plano para continuar.",
        choosePlan: "Escolher plano",
        subscriptionRequired: "Subscrição necessária",
        trialEndedTitle: "Período de trial terminado",
        trialEndedDescription:
          "O teu período de trial terminou. Ativa o plano para continuar a usar o ChefIApp.",
        paymentPending:
          "Pagamento pendente. Regularize para evitar a suspensão.",
        trialActive:
          "Trial ativo. Escolha o seu plano para continuar após o período de teste.",
        checkingSubscription: "A verificar subscrição...",
        canceledDescription:
          "A tua subscrição foi cancelada. Para continuar a usar o ChefIApp Pro, reativa o plano na página de faturação.",
        reactivatePlan: "Reativar plano",
        invoiceStatus: { paid: "Pago", pending: "Pendente", failed: "Falhado" },
        periodPresets: { last3Months: "Últimos 3 meses", lastYear: "Último ano" },
        periodLabel: "Período",
      },
    },

    // ── pt-BR ─────────────────────────────────────────────────────────────
    "pt-BR": {
      common: ptBRCommon,
      tpv: ptBRTpv,
      kds: ptBRKds,
      onboarding: ptBROnboarding,
      shift: ptBRShift,
      receipt: ptBRReceipt,
      reservations: ptBRReservations,
      config: ptBRConfig,
      pwa: ptBRPwa,
      dashboard: ptBRDashboard,
      operational: ptBROperational,
      waiter: ptBRWaiter,
      sidebar: ptBRSidebar,
      "customer-menu": ptBRCustomerMenu,
      legal: {
        /* kept inline — stable legal text */
        dataPrivacyTitle: "Dados e privacidade",
        dataPrivacyIntro:
          "De acordo com o RGPD, pode exportar os seus dados ou solicitar a eliminação da conta.",
        exportMyData: "Exportar os meus dados",
        deleteAccountData: "Eliminar conta / dados",
        exportModalTitle: "Exportar os meus dados",
        exportModalBody1:
          "Será enviado um pacote com os dados da sua conta, do restaurante, pedidos e ementa (conforme retenção). O prazo de resposta é até 30 dias.",
        exportModalBody2:
          "Para solicitar, contacte-nos através do endereço indicado na aplicação ou na Política de Privacidade.",
        exportModalDoc:
          "Processo completo: docs/legal/GDPR_DATA_EXPORT_DELETION.md",
        deleteModalTitle: "Eliminar conta / dados",
        deleteModalBody1:
          "Após confirmação e verificação de identidade, os dados da conta e do restaurante serão eliminados em cascade. Dados com obrigação de retenção legal podem ser mantidos pelo tempo mínimo exigido por lei.",
        deleteModalBody2:
          "Para solicitar a eliminação, contacte-nos através do endereço indicado na aplicação ou na Política de Privacidade.",
        deleteModalDoc:
          "Processo completo: docs/legal/GDPR_DATA_EXPORT_DELETION.md",
        termsTitle: "Termos de Uso",
        termsIntro1:
          "Estes Termos descrevem as regras de uso do ChefIApp para operação comercial.",
        termsIntro2:
          "Ao continuar a usar o produto, concorda com as regras de uso e políticas aplicáveis.",
        termsS1Title: "1. Responsável",
        termsS1Body:
          "O serviço ChefIApp é operado pela entidade responsável indicada no contrato ou no momento do registo.",
        termsS2Title: "2. Aceitação",
        termsS2Body:
          "O acesso e uso do ChefIApp implicam a aceitação destes Termos.",
        termsS3Title: "3. Uso do serviço",
        termsS3Body:
          "O ChefIApp destina-se à gestão operacional de restaurantes. O utilizador é responsável pelo cumprimento das obrigações fiscais e legais do seu país.",
        termsS4Title: "4. Rescisão",
        termsS4Body:
          "Pode encerrar a conta ou a subscrição nos termos do plano. Consulte a secção de faturação na aplicação para cancelar.",
        privacyTitle: "Política de Privacidade",
        privacyIntro1:
          "Esta Política explica como dados operacionais e pessoais são tratados no ChefIApp.",
        privacyIntro2:
          "Quando aplicável, o cliente deve informar os titulares de dados e recolher consentimento conforme LGPD/GDPR.",
        privacyS1Title: "1. Recolha de dados",
        privacyS1Body:
          "Recolhemos dados necessários ao funcionamento do serviço: conta, restaurante, pedidos, ementa e operadores.",
        privacyS2Title: "2. Base legal",
        privacyS2Body:
          "O tratamento assenta na execução do contrato, no consentimento e no legítimo interesse.",
        privacyS3Title: "3. Direitos (GDPR/LGPD)",
        privacyS3Body:
          "Tem direito a aceder, retificar, limitar, portar e apagar os seus dados. Exercício através da área de conta ou contacto do responsável.",
        privacyS4Title: "4. Contacto",
        privacyS4Body:
          "Para questões sobre privacidade, utilize o contacto indicado na aplicação ou no site do ChefIApp.",
        dpaTitle: "Acordo de Tratamento de Dados (DPA)",
        dpaIntro1:
          "Este Acordo de Tratamento de Dados descreve as obrigações entre o responsável pelo tratamento (cliente) e o subcontratado (ChefIApp) no âmbito do RGPD/LGPD.",
        dpaIntro2:
          "Para publicação e venda, confirme com sua equipe jurídica o texto final e cláusulas contratuais aplicáveis.",
        dpaS1Title: "1. Objeto e instruções",
        dpaS1Body:
          "O subcontratado trata dados pessoais apenas em nome do responsável e em conformidade com as instruções documentadas. O responsável garante que as instruções são lícitas e que os titulares dos dados foram informados.",
        dpaS2Title: "2. Medidas técnicas e organizativas",
        dpaS2Body:
          "O subcontratado aplica medidas técnicas e organizativas adequadas para garantir um nível de segurança apropriado ao risco (confidencialidade, integridade, disponibilidade). O tratamento é documentado e sujeito a auditoria quando exigido por lei.",
        dpaS3Title: "3. Subprocessadores e contacto",
        dpaS3Body:
          "A lista de subprocessadores e a duração do tratamento constam do contrato de prestação de serviços. Para questões sobre o DPA ou para exercer direitos, utilize o contacto indicado na aplicação ou na Política de Privacidade.",
      },
      billing: {
        trialEndsIn_one:
          "Trial termina em {{count}} dia. Escolha seu plano para continuar.",
        trialEndsIn_other:
          "Trial termina em {{count}} dias. Escolha seu plano para continuar.",
        choosePlan: "Escolher plano",
        subscriptionRequired: "Assinatura necessária",
        trialEndedTitle: "Período de trial encerrado",
        trialEndedDescription:
          "Seu período de trial terminou. Ative o plano para continuar usando o ChefIApp.",
        paymentPending:
          "Pagamento pendente. Regularize para evitar a suspensão.",
        trialActive:
          "Trial ativo. Escolha seu plano para continuar após o período de teste.",
        checkingSubscription: "Verificando assinatura...",
        canceledDescription:
          "Sua assinatura foi cancelada. Para continuar a usar o ChefIApp Pro, reative o plano na página de faturação.",
        reactivatePlan: "Reativar plano",
        invoiceStatus: { paid: "Pago", pending: "Pendente", failed: "Falhado" },
        periodPresets: { last3Months: "Últimos 3 meses", lastYear: "Último ano" },
        periodLabel: "Período",
      },
    },

    // ── en ────────────────────────────────────────────────────────────────
    en: {
      common: enCommon,
      tpv: enTpv,
      kds: enKds,
      onboarding: enOnboarding,
      shift: enShift,
      receipt: enReceipt,
      reservations: enReservations,
      config: enConfig,
      pwa: enPwa,
      dashboard: enDashboard,
      operational: enOperational,
      waiter: enWaiter,
      sidebar: enSidebar,
      "customer-menu": enCustomerMenu,
      legal: {
        /* kept inline — stable legal text */
        dataPrivacyTitle: "Data and privacy",
        dataPrivacyIntro:
          "Under GDPR, you can export your data or request account deletion.",
        exportMyData: "Export my data",
        deleteAccountData: "Delete account / data",
        exportModalTitle: "Export my data",
        exportModalBody1:
          "You will receive a package with your account, restaurant, orders and menu data (per retention policy). Response within 30 days.",
        exportModalBody2:
          "To request, contact us at the address shown in the app or in the Privacy Policy.",
        exportModalDoc: "Full process: docs/legal/GDPR_DATA_EXPORT_DELETION.md",
        deleteModalTitle: "Delete account / data",
        deleteModalBody1:
          "After confirmation and identity verification, account and restaurant data will be deleted in cascade. Data subject to legal retention may be kept for the minimum required period.",
        deleteModalBody2:
          "To request deletion, contact us at the address shown in the app or in the Privacy Policy.",
        deleteModalDoc: "Full process: docs/legal/GDPR_DATA_EXPORT_DELETION.md",
        termsTitle: "Terms of Use",
        termsIntro1:
          "These Terms describe the rules for using ChefIApp for commercial operation.",
        termsIntro2:
          "By continuing to use the product, you agree to the rules of use and applicable policies.",
        termsS1Title: "1. Responsible party",
        termsS1Body:
          "ChefIApp is operated by the entity indicated in the contract or at registration. For contact, use the address in the app or on the website.",
        termsS2Title: "2. Acceptance",
        termsS2Body:
          "Access and use of ChefIApp imply acceptance of these Terms.",
        termsS3Title: "3. Use of the service",
        termsS3Body:
          "ChefIApp is for restaurant operations (POS, menu, shifts, reports). The user is responsible for correct use of data and compliance with tax and legal obligations.",
        termsS4Title: "4. Termination",
        termsS4Body:
          "You may close your account or subscription as per the plan. See the billing section in the app to cancel.",
        privacyTitle: "Privacy Policy",
        privacyIntro1:
          "This Policy explains how operational and personal data are processed in ChefIApp.",
        privacyIntro2:
          "Where applicable, the customer must inform data subjects and obtain consent under LGPD/GDPR.",
        privacyS1Title: "1. Data collection",
        privacyS1Body:
          "We collect data needed to run the service: account, restaurant, orders, menu and operators. Data is processed for service delivery, billing and legal compliance.",
        privacyS2Title: "2. Legal basis",
        privacyS2Body:
          "Processing is based on contract performance, consent where applicable, and legitimate interest.",
        privacyS3Title: "3. Rights (GDPR/LGPD)",
        privacyS3Body:
          "You have the right to access, rectify, restrict, port and delete your data. Exercise via the account area or by contacting the controller.",
        privacyS4Title: "4. Contact",
        privacyS4Body:
          "For privacy questions, use the contact details in the app or on the ChefIApp website.",
        dpaTitle: "Data Processing Agreement (DPA)",
        dpaIntro1:
          "This Data Processing Agreement describes the obligations between the data controller (customer) and the processor (ChefIApp) under GDPR.",
        dpaIntro2:
          "For publication and sale, confirm the final text and applicable contractual clauses with your legal team.",
        dpaS1Title: "1. Subject and instructions",
        dpaS1Body:
          "The processor processes personal data only on behalf of the controller and in accordance with documented instructions. The controller warrants that instructions are lawful and that data subjects have been informed.",
        dpaS2Title: "2. Technical and organisational measures",
        dpaS2Body:
          "The processor implements appropriate technical and organisational measures to ensure a level of security appropriate to the risk (confidentiality, integrity, availability). Processing is documented and subject to audit when required by law.",
        dpaS3Title: "3. Sub-processors and contact",
        dpaS3Body:
          "The list of sub-processors and the duration of processing are set out in the service agreement. For questions about the DPA or to exercise rights, use the contact details in the app or in the Privacy Policy.",
      },
      billing: {
        trialEndsIn_one:
          "Trial ends in {{count}} day. Choose your plan to continue.",
        trialEndsIn_other:
          "Trial ends in {{count}} days. Choose your plan to continue.",
        choosePlan: "Choose plan",
        subscriptionRequired: "Subscription required",
        trialEndedTitle: "Trial period ended",
        trialEndedDescription:
          "Your trial period has ended. Activate a plan to continue using ChefIApp.",
        paymentPending: "Payment pending. Please update to avoid suspension.",
        trialActive:
          "Trial active. Choose your plan to continue after the trial.",
        checkingSubscription: "Checking subscription...",
        canceledDescription:
          "Your subscription was canceled. To continue using ChefIApp Pro, reactivate your plan on the billing page.",
        reactivatePlan: "Reactivate plan",
        invoiceStatus: { paid: "Paid", pending: "Pending", failed: "Failed" },
        periodPresets: { last3Months: "Last 3 months", lastYear: "Last year" },
        periodLabel: "Period",
      },
    },

    // ── es ────────────────────────────────────────────────────────────────
    es: {
      common: esCommon,
      tpv: esTpv,
      kds: esKds,
      onboarding: esOnboarding,
      shift: esShift,
      receipt: esReceipt,
      reservations: esReservations,
      config: esConfig,
      pwa: esPwa,
      dashboard: esDashboard,
      operational: esOperational,
      waiter: esWaiter,
      sidebar: esSidebar,
      "customer-menu": esCustomerMenu,
      legal: {
        /* kept inline — stable legal text */
        dataPrivacyTitle: "Datos y privacidad",
        dataPrivacyIntro:
          "De acuerdo con el RGPD, puede exportar sus datos o solicitar la eliminación de la cuenta.",
        exportMyData: "Exportar mis datos",
        deleteAccountData: "Eliminar cuenta / datos",
        exportModalTitle: "Exportar mis datos",
        exportModalBody1:
          "Se enviará un paquete con los datos de su cuenta, restaurante, pedidos y menú. Plazo de respuesta hasta 30 días.",
        exportModalBody2:
          "Para solicitar, contacte a través de la dirección indicada en la aplicación o en la Política de Privacidad.",
        exportModalDoc:
          "Proceso completo: docs/legal/GDPR_DATA_EXPORT_DELETION.md",
        deleteModalTitle: "Eliminar cuenta / datos",
        deleteModalBody1:
          "Tras confirmación y verificación de identidad, los datos de la cuenta y del restaurante se eliminarán en cascada.",
        deleteModalBody2:
          "Para solicitar la eliminación, contacte a través de la dirección indicada en la aplicación o en la Política de Privacidad.",
        deleteModalDoc:
          "Proceso completo: docs/legal/GDPR_DATA_EXPORT_DELETION.md",
        termsTitle: "Términos de Uso",
        termsIntro1:
          "Estos Términos describen las reglas de uso de ChefIApp para operación comercial.",
        termsIntro2:
          "Al continuar usando el producto, acepta las reglas de uso y las políticas aplicables.",
        termsS1Title: "1. Responsable",
        termsS1Body:
          "El servicio ChefIApp es operado por la entidad indicada en el contrato o en el registro.",
        termsS2Title: "2. Aceptación",
        termsS2Body:
          "El acceso y uso de ChefIApp implican la aceptación de estos Términos.",
        termsS3Title: "3. Uso del servicio",
        termsS3Body:
          "ChefIApp está destinado a la gestión operativa de restaurantes. El usuario es responsable del cumplimiento de las obligaciones fiscales y legales de su país.",
        termsS4Title: "4. Rescisión",
        termsS4Body:
          "Puede cerrar la cuenta o la suscripción según el plan. Consulte la sección de facturación en la aplicación para cancelar.",
        privacyTitle: "Política de Privacidad",
        privacyIntro1:
          "Esta Política explica cómo se tratan los datos operativos y personales en ChefIApp.",
        privacyIntro2:
          "Cuando corresponda, el cliente debe informar a los titulares de datos y recoger el consentimiento conforme a LGPD/GDPR.",
        privacyS1Title: "1. Recolección de datos",
        privacyS1Body:
          "Recogemos los datos necesarios para el funcionamiento del servicio: cuenta, restaurante, pedidos, menú y operadores.",
        privacyS2Title: "2. Base legal",
        privacyS2Body:
          "El tratamiento se basa en la ejecución del contrato, el consentimiento y el interés legítimo.",
        privacyS3Title: "3. Derechos (GDPR/LGPD)",
        privacyS3Body:
          "Tiene derecho a acceder, rectificar, limitar, portar y suprimir sus datos. Ejercicio a través del área de cuenta o contactando al responsable.",
        privacyS4Title: "4. Contacto",
        privacyS4Body:
          "Para cuestiones sobre privacidad, utilice el contacto indicado en la aplicación o en el sitio de ChefIApp.",
        dpaTitle: "Acuerdo de Tratamiento de Datos (DPA)",
        dpaIntro1:
          "Este Acuerdo de Tratamiento de Datos describe las obligaciones entre el responsable del tratamiento (cliente) y el encargado (ChefIApp) en el marco del RGPD.",
        dpaIntro2:
          "Para publicación y venta, confirme con su equipo jurídico el texto final y las cláusulas contractuales aplicables.",
        dpaS1Title: "1. Objeto e instrucciones",
        dpaS1Body:
          "El encargado trata datos personales únicamente en nombre del responsable y de conformidad con las instrucciones documentadas. El responsable garantiza que las instrucciones son lícitas y que los titulares de datos han sido informados.",
        dpaS2Title: "2. Medidas técnicas y organizativas",
        dpaS2Body:
          "El encargado aplica medidas técnicas y organizativas adecuadas para garantizar un nivel de seguridad apropiado al riesgo (confidencialidad, integridad, disponibilidad). El tratamiento está documentado y sujeto a auditoría cuando lo exija la ley.",
        dpaS3Title: "3. Subencargados y contacto",
        dpaS3Body:
          "La lista de subencargados y la duración del tratamiento constan en el contrato de prestación de servicios. Para cuestiones sobre el DPA o para ejercer derechos, utilice el contacto indicado en la aplicación o en la Política de Privacidad.",
      },
      billing: {
        trialEndsIn_one:
          "El trial termina en {{count}} día. Elige tu plan para continuar.",
        trialEndsIn_other:
          "El trial termina en {{count}} días. Elige tu plan para continuar.",
        choosePlan: "Elegir plan",
        subscriptionRequired: "Suscripción necesaria",
        trialEndedTitle: "Periodo de trial terminado",
        trialEndedDescription:
          "Tu periodo de trial ha terminado. Activa un plan para seguir usando ChefIApp.",
        paymentPending: "Pago pendiente. Regulariza para evitar la suspensión.",
        trialActive:
          "Trial activo. Elige tu plan para continuar después del trial.",
        checkingSubscription: "Comprobando suscripción...",
        canceledDescription:
          "Tu suscripción fue cancelada. Para seguir usando ChefIApp Pro, reactiva el plan en la página de facturación.",
        reactivatePlan: "Reactivar plan",
        invoiceStatus: { paid: "Pagado", pending: "Pendiente", failed: "Fallido" },
        periodPresets: { last3Months: "Últimos 3 meses", lastYear: "Último año" },
        periodLabel: "Período",
      },
    },
  },
});

export default i18n;
