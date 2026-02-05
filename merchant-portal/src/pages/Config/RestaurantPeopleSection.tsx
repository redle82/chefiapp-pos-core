/**
 * RestaurantPeopleSection — Pessoas operacionais (gm_restaurant_people)
 *
 * FASE 3 Passo 1: Dono cria pessoas com nome, função (staff/gerente) e obtém código ou QR
 * para uso no App Staff (check-in, tarefas).
 */

import React, { useState, useEffect, useCallback } from "react";
import { readRestaurantPeople, type CoreRestaurantPerson } from "../../core-boundary/readers/RestaurantPeopleReader";
import { isBackendUnavailable } from "../../core-boundary/menuPilotFallback";
import { dockerCoreClient } from "../../core-boundary/docker-core/connection";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { QRCodeGenerator } from "../../components/QRCodeGenerator";

function generateStaffCode(): string {
  const n = 1000 + Math.floor(Math.random() * 9000);
  return String(n);
}

export function RestaurantPeopleSection() {
  const { identity } = useRestaurantIdentity();
  const restaurantId = identity?.id ?? "";

  const [people, setPeople] = useState<CoreRestaurantPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"staff" | "manager">("staff");
  const [saving, setSaving] = useState(false);

  const [revealedCodeId, setRevealedCodeId] = useState<string | null>(null);
  const [showQRId, setShowQRId] = useState<string | null>(null);

  const loadPeople = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const list = await readRestaurantPeople(restaurantId);
      setPeople(list);
    } catch (e) {
      const msg = isBackendUnavailable(e)
        ? "Não foi possível carregar. O servidor pode estar indisponível. Tente novamente."
        : e instanceof Error ? e.message : "Erro ao carregar pessoas";
      setError(msg);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || !restaurantId) return;
    setSaving(true);
    try {
      let staffCode = generateStaffCode();
      const qrToken = staffCode;
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
        const { data, error: insertError } = await dockerCoreClient
          .from("gm_restaurant_people")
          .insert({
            restaurant_id: restaurantId,
            name,
            role: newRole,
            staff_code: staffCode,
            qr_token: qrToken,
          })
          .select("id, restaurant_id, name, role, staff_code, qr_token, created_at, updated_at")
          .single();
        if (insertError) {
          if (insertError.code === "23505") {
            staffCode = generateStaffCode();
            attempts++;
            continue;
          }
          throw new Error(insertError.message);
        }
        setPeople((prev) => [data as CoreRestaurantPerson, ...prev]);
        setNewName("");
        setNewRole("staff");
        setRevealedCodeId(data.id);
        setShowQRId(data.id);
        break;
      }
      if (attempts >= maxAttempts) {
        throw new Error("Não foi possível gerar um código único. Tente novamente.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao adicionar pessoa");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!restaurantId) return;
    try {
      const { error: delError } = await dockerCoreClient
        .from("gm_restaurant_people")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", restaurantId);
      if (delError) throw new Error(delError.message);
      setPeople((prev) => prev.filter((p) => p.id !== id));
      if (revealedCodeId === id) setRevealedCodeId(null);
      if (showQRId === id) setShowQRId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover");
    }
  };

  if (!restaurantId) {
    return (
      <p style={{ color: "#666" }}>
        Selecione ou crie um restaurante para gerir pessoas.
      </p>
    );
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
        Crie pessoas (funcionários/gerentes) com nome e função. Cada pessoa recebe um código e QR para check-in no App Staff.
      </p>

      {error && (
        <div
          style={{
            padding: "12px",
            marginBottom: "16px",
            backgroundColor: "#fee",
            borderRadius: "8px",
            color: "#c00",
          }}
        >
          {error}
        </div>
      )}

      {/* Form: nova pessoa */}
      <div
        style={{
          marginBottom: "24px",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Adicionar pessoa
        </h3>
        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="text"
            placeholder="Nome"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "staff" | "manager")}
            style={{
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <option value="staff">Funcionário (staff)</option>
            <option value="manager">Gerente</option>
          </select>
          <button
            type="submit"
            disabled={!newName.trim() || saving}
            style={{
              padding: "12px",
              backgroundColor: "#667eea",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: newName.trim() && !saving ? "pointer" : "not-allowed",
              opacity: newName.trim() && !saving ? 1 : 0.5,
            }}
          >
            {saving ? "A guardar…" : "Adicionar"}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <p style={{ color: "#666" }}>A carregar…</p>
        ) : people.length === 0 ? (
          <p style={{ fontSize: "14px", color: "#999", fontStyle: "italic", padding: "24px", textAlign: "center" }}>
            Nenhuma pessoa adicionada. Use o formulário acima para criar.
          </p>
        ) : (
          people.map((person) => (
            <div
              key={person.id}
              style={{
                padding: "16px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>{person.name}</div>
                  <div style={{ fontSize: "12px", color: "#667eea", marginTop: "4px" }}>
                    {person.role === "manager" ? "Gerente" : "Funcionário"}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "#666" }}>
                    Código:{" "}
                    {revealedCodeId === person.id ? (
                      <strong>{person.staff_code}</strong>
                    ) : (
                      <span>••••</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setRevealedCodeId((id) => (id === person.id ? null : person.id))}
                      style={{
                        marginLeft: "8px",
                        padding: "4px 8px",
                        fontSize: "12px",
                        border: "1px solid #667eea",
                        borderRadius: "4px",
                        background: "transparent",
                        color: "#667eea",
                        cursor: "pointer",
                      }}
                    >
                      {revealedCodeId === person.id ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setShowQRId((id) => (id === person.id ? null : person.id))}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        border: "1px solid #667eea",
                        borderRadius: "4px",
                        background: "transparent",
                        color: "#667eea",
                        cursor: "pointer",
                      }}
                    >
                      {showQRId === person.id ? "Ocultar QR" : "Ver QR"}
                    </button>
                    {showQRId === person.id && (
                      <div style={{ marginTop: "12px" }}>
                        <QRCodeGenerator
                          url={`chefiapp://staff?c=${encodeURIComponent(person.staff_code)}&r=${encodeURIComponent(person.restaurant_id)}`}
                          size={140}
                        />
                        <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                          Use este QR no App Staff para check-in.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(person.id)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
