/**
 * LocationSection - Seção de Localização
 *
 * Coleta: endereço, cidade, CEP, capacidade, mesas, zonas
 */

import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import { getBackendType, BackendType } from "../../../core/infra/backendAdapter";
import { dockerCoreClient } from "../../../core-boundary/docker-core/connection";
import { supabase } from "../../../core/supabase";

export function LocationSection() {
  const { updateSectionStatus } = useOnboarding();
  const { identity } = useRestaurantIdentity();
  const { runtime, updateSetupStatus } = useRestaurantRuntime();
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
      const restaurantId =
        runtime.restaurant_id ||
        identity.id ||
        (typeof window !== "undefined"
          ? localStorage.getItem("chefiapp_restaurant_id")
          : null);

      if (!restaurantId) return;

      const isDocker = getBackendType() === BackendType.docker;
      const client = isDocker ? dockerCoreClient : supabase;

      try {
        const { data: restaurant, error: restaurantError } = await client
          .from("gm_restaurants")
          .select("address, city, postal_code, state, capacity")
          .eq("id", restaurantId)
          .maybeSingle();

        if (restaurantError) {
          console.warn(
            "[LocationSection] Erro ao carregar localização:",
            restaurantError,
          );
        }

        const { data: zonesData, error: zonesError } = await client
          .from("restaurant_zones")
          .select("type")
          .eq("restaurant_id", restaurantId);

        if (zonesError) {
          console.warn("[LocationSection] Erro ao carregar zonas:", zonesError);
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
      } catch (error) {
        console.warn(
          "[LocationSection] Erro inesperado ao carregar localização:",
          error,
        );
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
        console.error(
          "[LocationSection] Erro ao atualizar setup_status:",
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

    if (isValid && restaurantId) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          const isDocker = getBackendType() === BackendType.docker;
          const client = isDocker ? dockerCoreClient : supabase;
          console.log("[LocationSection] Salvando no banco...", {
            restaurantId,
            formData,
            backend: isDocker ? "docker" : "supabase",
          });

          // 1. Salvar dados de localização em gm_restaurants
          const { error: restaurantError } = await client
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

          // 2. Criar zonas em restaurant_zones
          // Primeiro, deletar zonas antigas
          await client
            .from("restaurant_zones")
            .delete()
            .eq("restaurant_id", restaurantId);

          // Criar novas zonas
          for (const zoneType of formData.zones) {
            await client.from("restaurant_zones").insert({
              restaurant_id: restaurantId,
              name: zoneType,
              type: zoneType,
            });
          }

          // 3. Criar mesas automaticamente usando a função RPC
          const { data: tablesData, error: tablesError } = await client.rpc(
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
            // Fallback: criar mesas manualmente
            const tablesToCreate = Math.ceil(formData.capacity / 4);
            for (let i = 1; i <= tablesToCreate; i++) {
              await client.from("gm_tables").upsert(
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
    <div style={{ padding: "48px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
        📍 Localização{" "}
        {isSaving && (
          <span style={{ fontSize: "14px", color: "#667eea" }}>
            (Salvando...)
          </span>
        )}
      </h1>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "32px" }}>
        Onde está localizado seu restaurante?
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Endereço */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Endereço Completo *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Ex: Calle des caló, 109"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Cidade */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Cidade *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Ex: Sant Josep de sa Talaia"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>

        {/* CEP */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            CEP *
          </label>
          <input
            type="text"
            value={formData.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            placeholder="Ex: 07829"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Capacidade */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Capacidade (pessoas) *
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={formData.capacity}
            onChange={(e) =>
              handleChange("capacity", parseInt(e.target.value) || 1)
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
          <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Baseado na capacidade, {Math.ceil(formData.capacity / 2.5)} mesas
            serão criadas automaticamente
          </p>
        </div>

        {/* Zonas */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Zonas do Restaurante * (selecione pelo menos 1)
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {availableZones.map((zone) => (
              <label
                key={zone}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: formData.zones.includes(zone)
                    ? "#e7f0ff"
                    : "#fff",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.zones.includes(zone)}
                  onChange={() => toggleZone(zone)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px" }}>{zone}</span>
              </label>
            ))}
          </div>
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
            { label: "Endereço completo", done: formData.address.length >= 5 },
            { label: "Cidade", done: !!formData.city },
            { label: "CEP", done: !!formData.postalCode },
            { label: "Capacidade definida", done: formData.capacity >= 1 },
            {
              label: "Pelo menos 1 zona selecionada",
              done: formData.zones.length >= 1,
            },
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
