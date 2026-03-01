/**
 * LocationSection - Seção de Localização
 *
 * Coleta: endereço, cidade, CEP, capacidade, mesas, zonas
 */

import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import {
  BackendType,
  getBackendType,
} from "../../../core/infra/backendAdapter";
import { useTenant } from "../../../core/tenant/TenantContext";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import styles from "./LocationSection.module.css";
// Domain reads/writes ONLY via Core (Supabase removed — §4). No fallback.

export function LocationSection() {
  const { updateSectionStatus } = useOnboarding();
  const { identity } = useRestaurantIdentity();
  const { runtime, updateSetupStatus } = useRestaurantRuntime();
  const { tenantId } = useTenant();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    address: "",
    city: "",
    postalCode: "",
    state: "",
    capacity: 20,
    zones: [] as string[],
  });

  // Carregar localização já salva no banco ao montar.
  // Assim os dados persistem entre reloads e o usuário não perde o que já configurou.
  useEffect(() => {
    let cancelled = false;

    const loadLocation = async () => {
      const restaurantId = runtime.restaurant_id || identity.id || tenantId;

      if (!restaurantId) return;

      // ANTI-SUPABASE §4: Domain read ONLY via Core. Fail if not Docker.
      if (getBackendType() !== BackendType.docker) {
        console.warn(
          "[LocationSection] Core indisponível. Não é possível carregar localização.",
        );
        return;
      }

      try {
        const { data: restaurant, error: restaurantError } =
          await dockerCoreClient
            .from("gm_restaurants")
            .select("address, city, postal_code, state, capacity")
            .eq("id", restaurantId)
            .maybeSingle();

        if (restaurantError) {
          const msg = restaurantError?.message ?? String(restaurantError);
          if (
            !cancelled &&
            !msg.includes("abort") &&
            !msg.includes("Failed to fetch")
          ) {
            console.warn(
              "[LocationSection] Erro ao carregar localização:",
              restaurantError,
            );
          }
          return;
        }

        if (cancelled) return;

        const { data: zonesData, error: zonesError } = await dockerCoreClient
          .from("restaurant_zones")
          .select("type")
          .eq("restaurant_id", restaurantId);

        if (zonesError && !cancelled) {
          const zMsg = zonesError?.message ?? String(zonesError);
          if (!zMsg.includes("abort") && !zMsg.includes("Failed to fetch")) {
            console.warn(
              "[LocationSection] Erro ao carregar zonas:",
              zonesError,
            );
          }
        }

        if (!cancelled && restaurant) {
          setFormData((prev) => ({
            ...prev,
            address: restaurant.address ?? "",
            city: restaurant.city ?? "",
            postalCode: restaurant.postal_code ?? "",
            state: restaurant.state ?? "",
            capacity: restaurant.capacity ?? prev.capacity,
            zones: zonesData?.map((z: any) => z.type as string) ?? prev.zones,
          }));
        }
      } catch (error: any) {
        const msg = error?.message ?? String(error);
        if (
          !cancelled &&
          !msg.includes("abort") &&
          !msg.includes("Failed to fetch")
        ) {
          console.warn(
            "[LocationSection] Erro inesperado ao carregar localização:",
            error,
          );
        }
      }
    };

    loadLocation();

    return () => {
      cancelled = true;
    };
    // Queremos rodar quando o restaurante "existe" no runtime/identity.
  }, [runtime.restaurant_id, identity.id]);

  useEffect(() => {
    const isValid =
      formData.address.length >= 5 &&
      formData.city &&
      formData.postalCode &&
      formData.capacity >= 1 &&
      formData.zones.length >= 1;

    const status = isValid
      ? "COMPLETE"
      : formData.address
      ? "INCOMPLETE"
      : "NOT_STARTED";
    updateSectionStatus("location", status);

    // Atualizar RestaurantRuntimeContext (persistência real)
    if (runtime.restaurant_id) {
      updateSetupStatus("location", isValid).catch((error) => {
        const msg = error?.message ?? String(error);
        if (msg.includes("aborted")) return;
        console.error(
          "[LocationSection] Erro ao atualizar setup_status:",
          error,
        );
      });
    }

    // Usar restaurant_id do RestaurantRuntimeContext (fonte única de verdade)
    const restaurantId = runtime.restaurant_id || identity.id || tenantId;

    if (isValid && restaurantId) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          // ANTI-SUPABASE §4: Location write ONLY via Core. Fail explicit if not Docker.
          if (getBackendType() !== BackendType.docker) {
            throw new Error(
              "Core indisponível. Configure o Docker Core para salvar a localização.",
            );
          }
          console.log("[LocationSection] Salvando no banco (Core)...", {
            restaurantId,
            formData,
          });

          // 1. Salvar dados de localização em gm_restaurants (Core only)
          const { error: restaurantError } = await dockerCoreClient
            .from("gm_restaurants")
            .update({
              address: formData.address,
              city: formData.city,
              postal_code: formData.postalCode,
              state: formData.state,
              capacity: formData.capacity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", restaurantId);

          if (restaurantError) {
            console.error(
              "[LocationSection] Erro ao salvar localização:",
              restaurantError,
            );
            alert(`Erro ao salvar: ${restaurantError.message}`);
            return;
          }

          // 2. Criar zonas em restaurant_zones (Core only)
          await dockerCoreClient
            .from("restaurant_zones")
            .delete()
            .eq("restaurant_id", restaurantId);

          for (const zoneType of formData.zones) {
            await dockerCoreClient.from("restaurant_zones").insert({
              restaurant_id: restaurantId,
              name: zoneType,
              type: zoneType,
            });
          }

          // 3. Criar mesas via RPC (Core only)
          const { error: tablesError } = await dockerCoreClient.rpc(
            "create_tables_from_capacity",
            {
              p_restaurant_id: restaurantId,
              p_capacity: formData.capacity,
              p_tables_per_zone: 5,
            },
          );

          if (tablesError) {
            console.warn(
              "[LocationSection] Erro ao criar mesas (pode não existir a função ainda):",
              tablesError,
            );
            const tablesToCreate = Math.ceil(formData.capacity / 4);
            for (let i = 1; i <= tablesToCreate; i++) {
              await dockerCoreClient.from("gm_tables").upsert(
                {
                  restaurant_id: restaurantId,
                  number: i,
                  status: "closed",
                },
                {
                  onConflict: "restaurant_id,number",
                },
              );
            }
          }

          console.log("[LocationSection] ✅ Localização salva no banco");
          updateSetupStatus("location", true).catch((err) => {
            console.warn(
              "[LocationSection] Erro ao persistir setup_status:",
              err,
            );
          });
        } catch (error: any) {
          console.error("[LocationSection] Erro ao salvar localização:", error);
          alert(`Erro ao salvar: ${error?.message || "Erro desconhecido"}`);
        } finally {
          setIsSaving(false);
        }
      }, 1500);
    } else if (isValid && !restaurantId) {
      console.warn(
        "[LocationSection] Dados válidos mas sem restaurantId. Aguardando...",
      );
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    formData,
    identity.id,
    runtime.restaurant_id,
    updateSectionStatus,
    updateSetupStatus,
  ]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleZone = (zone: string) => {
    setFormData((prev) => ({
      ...prev,
      zones: prev.zones.includes(zone)
        ? prev.zones.filter((z) => z !== zone)
        : [...prev.zones, zone],
    }));
  };

  const availableZones = ["BAR", "SALON", "KITCHEN", "TERRACE"];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        📍 Localização{" "}
        {isSaving && <span className={styles.saving}>(Salvando...)</span>}
      </h1>
      <p className={styles.subtitle}>Onde está localizado seu restaurante?</p>

      <div className={styles.formFields}>
        {/* Endereço */}
        <div>
          <label className={styles.fieldLabel}>Endereço Completo *</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Ex: Calle des caló, 109"
            className={styles.input}
          />
        </div>

        {/* Cidade */}
        <div>
          <label className={styles.fieldLabel}>Cidade *</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Ex: Sant Josep de sa Talaia"
            className={styles.input}
          />
        </div>

        {/* CEP */}
        <div>
          <label className={styles.fieldLabel}>CEP *</label>
          <input
            type="text"
            value={formData.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            placeholder="Ex: 07829"
            className={styles.input}
          />
        </div>

        {/* Capacidade */}
        <div>
          <label className={styles.fieldLabel}>Capacidade (pessoas) *</label>
          <input
            type="number"
            title="Capacidade em pessoas"
            aria-label="Capacidade em pessoas"
            min="1"
            max="1000"
            value={formData.capacity}
            onChange={(e) =>
              handleChange("capacity", parseInt(e.target.value) || 1)
            }
            className={styles.input}
          />
          <p className={styles.helperText}>
            Baseado na capacidade, {Math.ceil(formData.capacity / 2.5)} mesas
            serão criadas automaticamente
          </p>
        </div>

        {/* Zonas */}
        <div>
          <label className={styles.fieldLabel}>
            Zonas do Restaurante * (selecione pelo menos 1)
          </label>
          <div className={styles.zonesList}>
            {availableZones.map((zone) => (
              <label
                key={zone}
                className={`${styles.zoneItem} ${
                  formData.zones.includes(zone)
                    ? styles.zoneItemSelected
                    : styles.zoneItemDefault
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.zones.includes(zone)}
                  onChange={() => toggleZone(zone)}
                  className={styles.zoneCheckbox}
                />
                <span className={styles.zoneLabel}>{zone}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Checklist Local */}
      <div className={styles.checklist}>
        <div className={styles.checklistTitle}>Checklist:</div>
        <div className={styles.checklistItems}>
          {[
            { label: "Endereço completo", done: formData.address.length >= 5 },
            { label: "Cidade", done: !!formData.city },
            { label: "CEP", done: !!formData.postalCode },
            { label: "Capacidade definida", done: formData.capacity >= 1 },
            {
              label: "Pelo menos 1 zona selecionada",
              done: formData.zones.length >= 1,
            },
          ].map((item) => (
            <div key={item.label} className={styles.checklistItem}>
              <span className={styles.checklistIcon}>
                {item.done ? "✅" : "⏳"}
              </span>
              <span
                className={`${styles.checklistLabel} ${
                  item.done ? styles.checklistDone : styles.checklistPending
                }`}
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
