/**
 * IdentitySection - Seção de Identidade do Restaurante
 *
 * Coleta: nome, tipo, país, fuso horário, moeda, idioma
 */

import React, { useEffect, useRef } from "react";
import { useOnboardingOptional } from "../../../context/OnboardingContext";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../../core-boundary/docker-core/connection";
import { useCoreAuth } from "../../../core/auth/useCoreAuth";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import {
  BackendType,
  getBackendType,
} from "../../../core/infra/backendAdapter";
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
    locale: "pt-BR",
  },
  US: {
    timezone: "America/New_York",
    currency: "USD",
    locale: "en-US",
  },
} as const;

export function IdentitySection() {
  const onboarding = useOnboardingOptional();
  const { identity } = useRestaurantIdentity();
  const { runtime, updateSetupStatus } = useRestaurantRuntime();
  const { user: authUser } = useCoreAuth();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIsValidRef = useRef<boolean | null>(null);

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
  });

  const formData = onboarding ? onboarding.state.identityForm : localForm;

  // Standalone Mode: Load existing data from DB
  useEffect(() => {
    if (onboarding || !runtime.restaurant_id) return;

    // Load from DB
    import("../../../core-boundary/readers/RuntimeReader").then(
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

          // Preparar dados para inserção
          const restaurantData: any = {
            name: formData.name,
            slug: slug,
            status: "draft",
            country: formData.country || "BR",
            type: formData.type,
            timezone: formData.timezone || "America/Sao_Paulo",
            currency: formData.currency || "BRL",
            locale: formData.locale || "pt-BR",
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
    <div style={{ padding: "48px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
        🏢 Identidade do Restaurante
      </h1>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "32px" }}>
        Informações básicas sobre seu estabelecimento
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Nome */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Nome do Restaurante *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Ex: Sofia Gastrobar Ibiza"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
          {formData.name && formData.name.length < 3 && (
            <p style={{ fontSize: "12px", color: "#dc3545", marginTop: "4px" }}>
              Mínimo 3 caracteres
            </p>
          )}
        </div>

        {/* Tipo */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Tipo de Estabelecimento *
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleChange("type", e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <option value="RESTAURANT">Restaurante</option>
            <option value="BAR">Bar</option>
            <option value="HOTEL">Hotel</option>
            <option value="BEACH_CLUB">Beach Club</option>
            <option value="CAFE">Café</option>
            <option value="OTHER">Outro</option>
          </select>
        </div>

        {/* País */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            País *
          </label>
          <select
            value={formData.country}
            onChange={(e) => {
              handleChange("country", e.target.value);
              // Auto-preencher timezone e moeda baseado no país
              // TODO: Implementar lógica real
            }}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <option value="">Selecione um país</option>
            <option value="BR">Brasil</option>
            <option value="ES">Espanha</option>
            <option value="PT">Portugal</option>
            <option value="US">Estados Unidos</option>
          </select>
        </div>

        {/* Fuso Horário */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Fuso Horário *
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => handleChange("timezone", e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <option value="">Selecione um fuso horário</option>
            <option value="America/Sao_Paulo">
              America/Sao_Paulo (Brasil)
            </option>
            <option value="Europe/Madrid">Europe/Madrid (Espanha)</option>
            <option value="Europe/Lisbon">Europe/Lisbon (Portugal)</option>
            <option value="America/New_York">America/New_York (EUA)</option>
          </select>
        </div>

        {/* Moeda */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Moeda *
          </label>
          <select
            value={formData.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <option value="BRL">BRL (R$)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>

        {/* Idioma */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Idioma *
          </label>
          <select
            value={formData.locale}
            onChange={(e) => handleChange("locale", e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="es-ES">Español (España)</option>
            <option value="en-US">English (US)</option>
          </select>
        </div>
      </div>

      {/* Checklist Local */}
      <div
        style={{
          marginTop: "32px",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <div
          style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}
        >
          Checklist:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { label: "Nome do restaurante", done: formData.name.length >= 3 },
            { label: "Tipo de estabelecimento", done: !!formData.type },
            { label: "País", done: !!formData.country },
            { label: "Fuso horário", done: !!formData.timezone },
            { label: "Moeda", done: !!formData.currency },
            { label: "Idioma", done: !!formData.locale },
          ].map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span style={{ fontSize: "16px" }}>
                {item.done ? "✅" : "⏳"}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  color: item.done ? "#28a745" : "#666",
                }}
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
