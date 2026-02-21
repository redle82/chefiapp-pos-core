/**
 * PeopleSection - Seção de Pessoas
 * Adiciona gerente e funcionários ao restaurante
 */
// @ts-nocheck


import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "../../../context/OnboardingContext";
// LEGACY / LAB — blocked in Docker mode
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";

interface Person {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "staff";
}

export function PeopleSection() {
  const { updateSectionStatus } = useOnboarding();
  const { identity } = useRestaurantIdentity();
  const { runtime, updateSetupStatus } = useRestaurantRuntime();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [people, setPeople] = useState<Person[]>([]);
  const [newPerson, setNewPerson] = useState({
    name: "",
    email: "",
    role: "staff" as Person["role"],
  });

  const addPerson = () => {
    if (newPerson.name && newPerson.email) {
      setPeople([...people, { ...newPerson, id: Date.now().toString() }]);
      setNewPerson({ name: "", email: "", role: "staff" });
    }
  };

  const removePerson = (id: string) => {
    setPeople(people.filter((p) => p.id !== id));
  };

  useEffect(() => {
    // Verificar se tem pelo menos 1 gerente ou owner
    const hasManager = people.some(
      (p) => p.role === "manager" || p.role === "owner"
    );
    const isValid = people.length >= 1 && hasManager;

    const status = isValid
      ? "COMPLETE"
      : people.length > 0
      ? "INCOMPLETE"
      : "NOT_STARTED";
    updateSectionStatus("people", status);

    // Atualizar RestaurantRuntimeContext (persistência real)
    if (runtime.restaurant_id) {
      updateSetupStatus("people", isValid).catch((error) => {
        console.error("[PeopleSection] Erro ao atualizar setup_status:", error);
      });
    }

    // Salvar no banco se válido e tiver restaurantId
    if (isValid && identity.id) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          // Nota: Na prática, você precisaria criar usuários reais ou usar IDs existentes
          // Por enquanto, apenas salvamos o status como completo
          // A implementação real dependeria de um sistema de convites/convites por email

          console.log(
            "✅ Pessoas configuradas (implementação completa requer sistema de convites)"
          );
        } catch (error) {
          console.error("Erro ao salvar pessoas:", error);
        } finally {
          setIsSaving(false);
        }
      }, 1500);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [people, identity.id, updateSectionStatus]);

  return (
    <div style={{ padding: "48px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
        👥 Pessoas{" "}
        {isSaving && (
          <span style={{ fontSize: "14px", color: "#667eea" }}>
            (Salvando...)
          </span>
        )}
      </h1>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "32px" }}>
        Adicione gerente e funcionários ao seu restaurante
      </p>

      {/* Adicionar Pessoa */}
      <div
        style={{
          marginBottom: "32px",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Adicionar Pessoa
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="text"
            placeholder="Nome"
            value={newPerson.name}
            onChange={(e) =>
              setNewPerson({ ...newPerson, name: e.target.value })
            }
            style={{
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
          <input
            type="email"
            placeholder="Email"
            value={newPerson.email}
            onChange={(e) =>
              setNewPerson({ ...newPerson, email: e.target.value })
            }
            style={{
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
          <select
            value={newPerson.role}
            onChange={(e) =>
              setNewPerson({
                ...newPerson,
                role: e.target.value as Person["role"],
              })
            }
            style={{
              padding: "12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <option value="staff">Funcionário</option>
            <option value="manager">Gerente</option>
            <option value="owner">Proprietário</option>
          </select>
          <button
            onClick={addPerson}
            disabled={!newPerson.name || !newPerson.email}
            style={{
              padding: "12px",
              backgroundColor: "#667eea",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor:
                newPerson.name && newPerson.email ? "pointer" : "not-allowed",
              opacity: newPerson.name && newPerson.email ? 1 : 0.5,
            }}
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Lista de Pessoas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {people.length === 0 ? (
          <p
            style={{
              fontSize: "14px",
              color: "#999",
              fontStyle: "italic",
              textAlign: "center",
              padding: "32px",
            }}
          >
            Nenhuma pessoa adicionada ainda
          </p>
        ) : (
          people.map((person) => (
            <div
              key={person.id}
              style={{
                padding: "16px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>
                  {person.name}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {person.email}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#667eea",
                    marginTop: "4px",
                  }}
                >
                  {person.role === "owner"
                    ? "Proprietário"
                    : person.role === "manager"
                    ? "Gerente"
                    : "Funcionário"}
                </div>
              </div>
              <button
                onClick={() => removePerson(person.id)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Remover
              </button>
            </div>
          ))
        )}
      </div>

      {/* Checklist */}
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
            {
              label: "Pelo menos 1 pessoa adicionada",
              done: people.length >= 1,
            },
            {
              label: "Pelo menos 1 gerente ou proprietário",
              done: people.some(
                (p) => p.role === "manager" || p.role === "owner"
              ),
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
