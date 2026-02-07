/**
 * RestaurantPeopleSection — Pessoas operacionais (gm_restaurant_people)
 *
 * FASE 3 Passo 1: Dono cria pessoas com nome, função (staff/gerente) e obtém código ou QR
 * para uso no App Staff (check-in, tarefas).
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  readRestaurantPeople,
  type CoreRestaurantPerson,
} from "../../core-boundary/readers/RestaurantPeopleReader";
import { isBackendUnavailable } from "../../core-boundary/menuPilotFallback";
import { dockerCoreClient } from "../../core-boundary/docker-core/connection";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { QRCodeGenerator } from "../../components/QRCodeGenerator";
import { db } from "../../core/db";

type InviteSummary = {
  id: string;
  person_id: string;
  status: string;
  code: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number | null;
};

function mapPersonRoleToStaffRole(
  role: CoreRestaurantPerson["role"],
): "waiter" | "manager" {
  if (role === "manager") return "manager";
  // Funcionário genérico cai como garçom (waiter) no AppStaff.
  return "waiter";
}

function formatInviteStatus(status: string): string {
  switch (status) {
    case "active":
      return "válido";
    case "expired":
      return "expirado";
    case "revoked":
      return "revogado";
    case "used":
      return "usado";
    default:
      return status;
  }
}

function formatDate(dateIso: string | null): string {
  if (!dateIso) return "";
  try {
    const d = new Date(dateIso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "";
  }
}

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
  const [invitesByPersonId, setInvitesByPersonId] = useState<
    Record<string, InviteSummary | undefined>
  >({});

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
      if (list.length > 0) {
        const personIds = list.map((p) => p.id);
        const { data, error: invitesError } = await supabase
          .from("active_invites")
          .select(
            "id, person_id, status, code, expires_at, max_uses, used_count",
          )
          .eq("restaurant_id", restaurantId)
          .in("person_id", personIds);

        if (!invitesError && data) {
          const map: Record<string, InviteSummary> = {};
          (data as any[]).forEach((row) => {
            map[row.person_id] = {
              id: row.id,
              person_id: row.person_id,
              status: row.status,
              code: row.code,
              expires_at: row.expires_at ?? null,
              max_uses: row.max_uses ?? null,
              used_count: row.used_count ?? null,
            };
          });
          setInvitesByPersonId(map);
        }
      } else {
        setInvitesByPersonId({});
      }
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

  const ensureInviteForPerson = useCallback(
    async (person: CoreRestaurantPerson) => {
      try {
        if (!restaurantId) return null;
        const roleGranted = mapPersonRoleToStaffRole(person.role);
        const expiresAt = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(); // MVP: 24h

        const { data, error } = await supabase
          .from("active_invites")
          .upsert(
            {
              restaurant_id: restaurantId,
              person_id: person.id,
              role_granted: roleGranted,
              code: person.staff_code,
              max_uses: 1,
              status: "active",
              expires_at: expiresAt,
            },
            { onConflict: "person_id" },
          )
          .select(
            "id, person_id, status, code, expires_at, max_uses, used_count",
          )
          .single();

        if (error) throw new Error(error.message);

        const invite: InviteSummary = {
          id: (data as any).id,
          person_id: (data as any).person_id,
          status: (data as any).status,
          code: (data as any).code,
          expires_at: (data as any).expires_at ?? null,
          max_uses: (data as any).max_uses ?? null,
          used_count: (data as any).used_count ?? null,
        };

        setInvitesByPersonId((prev) => ({
          ...prev,
          [invite.person_id]: invite,
        }));

        return invite;
      } catch (e) {
        // Não bloqueia fluxo principal; apenas regista erro.
        console.error("Erro ao gerar convite para pessoa:", e);
        setError(
          e instanceof Error
            ? e.message
            : "Erro ao gerar convite para esta pessoa",
        );
        return null;
      }
    },
    [restaurantId],
  );

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
        // Criar imediatamente um active_invite para esta pessoa (ponte Empleados → AppStaff).
        await ensureInviteForPerson(data as CoreRestaurantPerson);
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

  const handleGenerateInvite = async (person: CoreRestaurantPerson) => {
    setSaving(true);
    try {
      await ensureInviteForPerson(person);
      setRevealedCodeId(person.id);
      setShowQRId(person.id);
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
                  <div
                    style={{ marginTop: "4px", fontSize: "12px", color: "#4b5563" }}
                  >
                    {(() => {
                      const invite = invitesByPersonId[person.id];
                      if (!invite) {
                        return (
                          <span>
                            Convite AppStaff: <em>ainda não gerado</em>
                          </span>
                        );
                      }
                      return (
                        <span>
                          Convite AppStaff:{" "}
                          <strong>{formatInviteStatus(invite.status)}</strong>
                          {invite.expires_at && (
                            <>
                              {" "}
                              • expira em {formatDate(invite.expires_at)}
                            </>
                          )}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleGenerateInvite(person)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        border: "1px solid #667eea",
                        borderRadius: "4px",
                        background: "transparent",
                        color: "#667eea",
                        cursor: "pointer",
                        marginRight: "8px",
                      }}
                    >
                      Gerar / Regenerar código AppStaff
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setShowQRId((id) => (id === person.id ? null : person.id))
                      }
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
                          url={`chefiapp://staff?c=${encodeURIComponent(
                            person.staff_code,
                          )}&r=${encodeURIComponent(person.restaurant_id)}`}
                          size={140}
                        />
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            marginTop: "4px",
                          }}
                        >
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
