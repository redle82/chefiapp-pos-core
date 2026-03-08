/**
 * IdentitySection - Seção de Identidade do Restaurante
 *
 * Coleta: nome, tipo, país, fuso horário, moeda, idioma
 */

import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useOnboardingOptional } from "../../../context/OnboardingContext";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { useCoreAuth } from "../../../core/auth/useCoreAuth";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import {
  BackendType,
  getBackendType,
} from "../../../core/infra/backendAdapter";
import { setTabIsolated } from "../../../core/storage/TabIsolatedStorage";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import styles from "./IdentitySection.module.css";
// Domain writes ONLY via Core. No Supabase.

// Presets oficiais por país para reduzir atrito no onboarding.
// País virou a fonte de verdade; timezone/moeda/idioma vêm daqui
// e podem ser ajustados manualmente depois se o usuário quiser.
const COUNTRY_PRESETS = {
  BR: {
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    locale: "pt-BR",
  },
  ES: {
    timezone: "Europe/Madrid",
    currency: "EUR",
    locale: "es-ES",
  },
  PT: {
    timezone: "Europe/Lisbon",
    currency: "EUR",
    locale: "pt-PT",
  },
  US: {
    timezone: "America/New_York",
    currency: "USD",
    locale: "en-US",
  },
} as const;

export function IdentitySection() {
  const { t } = useTranslation("onboarding");
  const onboarding = useOnboardingOptional();
  const { identity } = useRestaurantIdentity();
  const { runtime, updateSetupStatus } = useRestaurantRuntime();
  const { user: authUser } = useCoreAuth();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIsValidRef = useRef<boolean | null>(null);
  const [_isSaving, setIsSaving] = React.useState(false);

  // Standalone Mode: use local state if onboarding context is missing
  const [localForm, setLocalForm] = React.useState({
    name: "",
    type: "RESTAURANT" as
      | "RESTAURANT"
      | "BAR"
      | "HOTEL"
      | "BEACH_CLUB"
      | "CAFE"
      | "OTHER",
    country: "",
    timezone: "",
    currency: "BRL",
    locale: "pt-BR",
    logoUrl: "",
  });

  const formData = onboarding ? onboarding.state.identityForm : localForm;

  // Standalone Mode: Load existing data from DB
  useEffect(() => {
    if (onboarding || !runtime.restaurant_id) return;

    // Load from DB
    import("../../../infra/readers/RuntimeReader").then(
      ({ fetchRestaurant }) => {
        fetchRestaurant(runtime.restaurant_id!).then((row) => {
          if (row) {
            setLocalForm({
              name: row.name || "",
              type: (row.type as any) || "RESTAURANT",
              country: row.country || "",
              timezone: row.timezone || "",
              currency: row.currency || "BRL",
              locale: row.locale || "pt-BR",
              logoUrl: row.logo_url ?? "",
            });
          }
        });
      },
    );
  }, [onboarding, runtime.restaurant_id]);

  const updateIdentityForm = (patch: Partial<typeof formData>) => {
    if (onboarding) {
      onboarding.updateIdentityForm(patch);
    } else {
      setLocalForm((prev) => ({ ...prev, ...patch }));
    }
  };

  const updateSectionStatus = (section: string, status: string) => {
    if (onboarding) {
      onboarding.updateSectionStatus(section as any, status as any);
    }
  };

  // Salvar no banco quando dados mudarem (com debounce)
  useEffect(() => {
    const isValid =
      formData.name.length >= 3 &&
      !!formData.type &&
      !!formData.country &&
      !!formData.timezone &&
      !!formData.currency &&
      !!formData.locale;

    const status = isValid
      ? "COMPLETE"
      : formData.name
      ? "INCOMPLETE"
      : "NOT_STARTED";

    // Só atualiza o status se realmente mudou, para evitar loop de renders/saves
    if (onboarding) {
      const currentStatus = onboarding.state.sections.identity.status;
      if (currentStatus !== status) {
        updateSectionStatus("identity", status);
      }
    }

    // Atualizar RestaurantRuntimeContext (persistência real) apenas quando o isValid mudar
    if (runtime.restaurant_id && lastIsValidRef.current !== isValid) {
      lastIsValidRef.current = isValid;
      updateSetupStatus("identity", isValid).catch((error) => {
        console.error(
          "[IdentitySection] Erro ao atualizar setup_status:",
          error,
        );
      });
    }

    // Usar restaurant_id do RestaurantRuntimeContext (fonte única de verdade)
    const restaurantId =
      runtime.restaurant_id ||
      identity.id ||
      (typeof window !== "undefined"
        ? localStorage.getItem("chefiapp_restaurant_id")
        : null);

    // Log de debug (apenas quando dados mudarem significativamente)
    if (formData.name && formData.name.length >= 3) {
      console.log("[IdentitySection] Estado atual:", {
        isValid,
        restaurantId: restaurantId ? "✅ Existe" : "❌ Não existe",
        identityId: identity.id || "null",
        localStorageId:
          typeof window !== "undefined"
            ? localStorage.getItem("chefiapp_restaurant_id") || "null"
            : "N/A",
        formDataName: formData.name,
        willCreate: isValid && !restaurantId && formData.name ? "SIM" : "NÃO",
      });
    }

    // Se dados válidos mas sem restaurantId, criar restaurante automaticamente
    if (isValid && !restaurantId && formData.name) {
      console.log(
        "[IdentitySection] 🚀 Tentando criar restaurante automaticamente...",
        {
          name: formData.name,
          type: formData.type,
          country: formData.country,
        },
      );

      // Criar restaurante automaticamente (com debounce para evitar múltiplas tentativas)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log("[IdentitySection] Verificando autenticação...");

          // ANTI-SUPABASE §4: Identity/restaurant write ONLY via Core. Fail explicit if not Docker.
          if (getBackendType() !== BackendType.docker) {
            alert(
              "Core indisponível. Configure o Docker Core para criar o restaurante.",
            );
            window.location.href = "/bootstrap";
            return;
          }

          // Auth optional. Core: owner_id pode ser null.
          const userId: string | null = authUser?.id ?? null;

          // Gerar slug único
          const timestamp = Date.now().toString(36).slice(-6).toLowerCase();
          const slug = `rest-${timestamp}`;

          console.log("[IdentitySection] Criando restaurante...", {
            name: formData.name,
            slug,
            owner_id: userId || "NULL (Docker Core)",
            country: formData.country || "BR",
            type: formData.type,
          });

          const trialEndsAt = new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString();
          const restaurantData: any = {
            name: formData.name,
            slug: slug,
            status: "draft",
            country: formData.country || "BR",
            type: formData.type,
            timezone: formData.timezone || "America/Sao_Paulo",
            currency: formData.currency || "BRL",
            locale: formData.locale || "pt-BR",
            billing_status: "trial",
            trial_ends_at: trialEndsAt,
          };

          // Adicionar owner_id apenas se tiver (Docker Core permite NULL)
          if (userId) {
            restaurantData.owner_id = userId;
          }

          console.log(
            "[IdentitySection] Dados do restaurante:",
            restaurantData,
          );

          // Domain write ONLY via Core
          const { data: newRestaurant, error: createError } =
            await dockerCoreClient
              .from("gm_restaurants")
              .insert(restaurantData)
              .select()
              .single();

          if (createError) {
            console.error(
              "[IdentitySection] Erro ao criar restaurante:",
              createError,
            );
            alert(
              `Erro ao criar restaurante: ${
                createError.message
              }\n\nDetalhes: ${JSON.stringify(createError, null, 2)}`,
            );
            return;
          }

          if (newRestaurant) {
            const newRestaurantId = newRestaurant.id;
            // Salvar no localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem("chefiapp_restaurant_id", newRestaurantId);
            }
            console.log(
              "[IdentitySection] ✅ Restaurante criado:",
              newRestaurantId,
            );

            // Atualizar RestaurantRuntimeContext (vai recarregar estado)
            // Não precisa recarregar página - o runtime vai atualizar
            window.location.reload(); // Recarregar para pegar o novo restaurantId no runtime
          }
        } catch (error: any) {
          console.error("[IdentitySection] Erro ao criar restaurante:", error);
          alert(`Erro inesperado: ${error?.message || "Erro desconhecido"}`);
        }
      }, 2000);

      return; // Não continuar com o salvamento normal se está criando
    }

    if (isValid && restaurantId) {
      // Limpar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce de 1.5s
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          // Identity write ONLY via Core. Fail explicit if not Docker.
          if (getBackendType() !== BackendType.docker) {
            throw new Error(
              "Core indisponível. Configure o Docker Core para salvar a identidade.",
            );
          }
          console.log("[IdentitySection] Salvando no banco (Core)...", {
            restaurantId,
            formData,
          });

          const { error } = await dockerCoreClient
            .from("gm_restaurants")
            .update({
              name: formData.name,
              type: formData.type,
              country: formData.country,
              timezone: formData.timezone,
              currency: formData.currency,
              locale: formData.locale,
              logo_url: formData.logoUrl?.trim() || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", restaurantId);

          if (error) {
            console.error(
              "[IdentitySection] Erro ao salvar identidade:",
              error,
            );
            alert(`Erro ao salvar: ${error.message}`);
          } else {
            console.log("[IdentitySection] ✅ Identidade salva no banco");
            // Persistir país, moeda e idioma para i18n e região de pagamento
            if (formData.country) setTabIsolated("chefiapp_country", formData.country);
            if (formData.currency) setTabIsolated("chefiapp_currency", formData.currency);
            if (formData.locale && typeof window !== "undefined") {
              localStorage.setItem("chefiapp_locale", formData.locale);
              import("../../../i18n").then((m) => m.default.changeLanguage(formData.locale));
            }
            // Persistir setup_status.identity no banco para não voltar ao nome ao recarregar
            updateSetupStatus("identity", true).catch((err) => {
              console.warn(
                "[IdentitySection] Erro ao persistir setup_status:",
                err,
              );
            });
          }
        } catch (error: any) {
          console.error("[IdentitySection] Erro ao salvar identidade:", error);
          alert(`Erro ao salvar: ${error?.message || "Erro desconhecido"}`);
        } finally {
          setIsSaving(false);
        }
      }, 1500);
    } else if (isValid && !restaurantId) {
      console.warn(
        "[IdentitySection] Dados válidos mas sem restaurantId. Aguardando...",
      );
    }

    // NOTE: The previous block was huge. I need to be careful not to delete the internal logic of the useEffect.
    // The previous tool call was "replace lines 45-320".
    // I need to make sure I include the HUGE useEffect content or I will lose it.
    // Or I can use multi_replace to target specific snippets?
    // No, multi_replace is for non-contiguous.
    // I will rewrite the component start (hooks) and the update functions, but keep the useEffect body intact by including it in the replacement or splitting the edit.

    // Actually, simply rewriting the hook calls and variable setups is safer.
    // I will edit lines 8 (import) and 45-56 (hooks setup) separately.
    // And also define the wrapper functions.

    // Let's do it in smaller chunks. First imports.
  }, [
    formData,
    identity.id,
    runtime.restaurant_id,
    updateSetupStatus,
    onboarding, // Added dependency
  ]);

  const handleChange = (field: string, value: any) => {
    // Campo genérico: merge simples
    if (field !== "country") {
      updateIdentityForm({ [field]: value } as any);
      return;
    }

    // País passou a ser o pivot que preenche os demais campos.
    const preset = COUNTRY_PRESETS[value as keyof typeof COUNTRY_PRESETS];
    updateIdentityForm({
      country: value,
      ...(preset ?? {}),
    } as any);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🏬 {t("identity.title")}</h1>
      <p className={styles.subtitle}>{t("identity.subtitle")}</p>

      <div className={styles.formFields}>
        {/* Nome */}
        <div>
          <label className={styles.fieldLabel}>{t("identity.nameLabel")}</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={t("identity.namePlaceholder")}
            className={styles.input}
          />
          {formData.name && formData.name.length < 3 && (
            <p className={styles.error}>{t("identity.minChars")}</p>
          )}
        </div>

        {/* Logo (URL) — Ver RESTAURANT_LOGO_IDENTITY_CONTRACT.md */}
        <div>
          <label className={styles.fieldLabel}>{t("identity.logoLabel")}</label>
          <input
            type="url"
            value={"logoUrl" in formData ? formData.logoUrl : ""}
            onChange={(e) =>
              updateIdentityForm({ logoUrl: e.target.value } as any)
            }
            placeholder={t("identity.logoPlaceholder")}
            className={styles.input}
          />
          {"logoUrl" in formData && formData.logoUrl && (
            <div className={styles.logoPreviewWrapper}>
              <img
                src={formData.logoUrl}
                alt={t("identity.logoPreviewAlt")}
                className={styles.logoPreview}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Tipo */}
        <div>
          <label className={styles.fieldLabel}>{t("identity.typeLabel")}</label>
          <select
            aria-label={t("identity.typeLabel")}
            value={formData.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className={styles.select}
          >
            <option value="RESTAURANT">{t("identity.typeRestaurant")}</option>
            <option value="BAR">{t("identity.typeBar")}</option>
            <option value="HOTEL">{t("identity.typeHotel")}</option>
            <option value="BEACH_CLUB">{t("identity.typeBeachClub")}</option>
            <option value="CAFE">{t("identity.typeCafe")}</option>
            <option value="OTHER">{t("identity.typeOther")}</option>
          </select>
        </div>

        {/* País */}
        <div>
          <label className={styles.fieldLabel}>{t("identity.countryLabel")}</label>
          <select
            aria-label={t("identity.countryLabel")}
            value={formData.country}
            onChange={(e) => handleChange("country", e.target.value)}
            className={styles.select}
          >
            <option value="">{t("identity.countrySelect")}</option>
            <option value="BR">{t("identity.countryBR")}</option>
            <option value="ES">{t("identity.countryES")}</option>
            <option value="PT">{t("identity.countryPT")}</option>
            <option value="US">{t("identity.countryUS")}</option>
          </select>
        </div>

        {/* Fuso Horário */}
        <div>
          <label className={styles.fieldLabel}>{t("identity.timezoneLabel")}</label>
          <select
            aria-label={t("identity.timezoneLabel")}
            value={formData.timezone}
            onChange={(e) => handleChange("timezone", e.target.value)}
            className={styles.select}
          >
            <option value="">{t("identity.timezoneSelect")}</option>
            <option value="America/Sao_Paulo">{t("identity.timezoneBR")}</option>
            <option value="Europe/Madrid">{t("identity.timezoneES")}</option>
            <option value="Europe/Lisbon">{t("identity.timezonePT")}</option>
            <option value="America/New_York">{t("identity.timezoneUS")}</option>
          </select>
        </div>

        {/* Moeda */}
        <div>
          <label className={styles.fieldLabel}>{t("identity.currencyLabel")}</label>
          <select
            aria-label={t("identity.currencyLabel")}
            value={formData.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
            className={styles.select}
          >
            <option value="BRL">{t("identity.currencyBRL")}</option>
            <option value="EUR">{t("identity.currencyEUR")}</option>
            <option value="USD">{t("identity.currencyUSD")}</option>
          </select>
        </div>

        {/* Idioma */}
        <div>
          <label className={styles.fieldLabel}>{t("identity.localeLabel")}</label>
          <select
            aria-label={t("identity.localeLabel")}
            value={formData.locale}
            onChange={(e) => handleChange("locale", e.target.value)}
            className={styles.select}
          >
            <option value="pt-BR">{t("identity.localePtBR")}</option>
            <option value="es-ES">{t("identity.localeEsES")}</option>
            <option value="en-US">{t("identity.localeEnUS")}</option>
            <option value="pt-PT">{t("identity.localePtPT")}</option>
          </select>
        </div>
      </div>

      {/* Checklist Local */}
      <div className={styles.checklist}>
        <div className={styles.checklistTitle}>{t("identity.checklistTitle")}</div>
        <div className={styles.checklistItems}>
          {[
            { key: "name", label: t("identity.checklistName"), done: formData.name.length >= 3 },
            { key: "type", label: t("identity.checklistType"), done: !!formData.type },
            { key: "country", label: t("identity.checklistCountry"), done: !!formData.country },
            { key: "timezone", label: t("identity.checklistTimezone"), done: !!formData.timezone },
            { key: "currency", label: t("identity.checklistCurrency"), done: !!formData.currency },
            { key: "locale", label: t("identity.checklistLocale"), done: !!formData.locale },
          ].map((item) => (
            <div key={item.key} className={styles.checklistItem}>
              <span className={styles.checklistIcon}>
                {item.done ? "✅" : "⏳"}
              </span>
              <span
                className={styles.checklistLabel}
                data-done={item.done ? "true" : "false"}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
