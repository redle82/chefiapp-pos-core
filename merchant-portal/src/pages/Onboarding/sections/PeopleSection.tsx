/**
 * PeopleSection - Seção de Pessoas
 * Adiciona gerente e funcionários ao restaurante
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOnboarding } from "../../../context/OnboardingContext";
// LEGACY / LAB — blocked in Docker mode
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import styles from "./PeopleSection.module.css";

interface Person {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "staff";
}

export function PeopleSection() {
  const { t } = useTranslation("onboarding");
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
      (p) => p.role === "manager" || p.role === "owner",
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
            "✅ Pessoas configuradas (implementação completa requer sistema de convites)",
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

  const roleLabel = (role: Person["role"]) =>
    role === "owner" ? t("people.owner") : role === "manager" ? t("people.manager") : t("people.staff");

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        👥 {t("people.title")}{" "}
        {isSaving && <span className={styles.saving}>({t("people.saving")})</span>}
      </h1>
      <p className={styles.subtitle}>{t("people.subtitle")}</p>

      {/* Adicionar Pessoa */}
      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>{t("people.addPerson")}</h3>
        <div className={styles.formStack}>
          <input
            type="text"
            placeholder={t("people.namePlaceholder")}
            value={newPerson.name}
            onChange={(e) =>
              setNewPerson({ ...newPerson, name: e.target.value })
            }
            className={styles.input}
          />
          <input
            type="email"
            placeholder={t("people.emailPlaceholder")}
            value={newPerson.email}
            onChange={(e) =>
              setNewPerson({ ...newPerson, email: e.target.value })
            }
            className={styles.input}
          />
          <select
            title={t("people.roleLabel")}
            aria-label={t("people.roleLabel")}
            value={newPerson.role}
            onChange={(e) =>
              setNewPerson({
                ...newPerson,
                role: e.target.value as Person["role"],
              })
            }
            className={styles.input}
          >
            <option value="staff">{t("people.staff")}</option>
            <option value="manager">{t("people.manager")}</option>
            <option value="owner">{t("people.owner")}</option>
          </select>
          <button
            onClick={addPerson}
            disabled={!newPerson.name || !newPerson.email}
            className={`${styles.addButton} ${
              !newPerson.name || !newPerson.email
                ? styles.addButtonDisabled
                : ""
            }`}
          >
            {t("people.addButton")}
          </button>
        </div>
      </div>

      {/* Lista de Pessoas */}
      <div className={styles.peopleList}>
        {people.length === 0 ? (
          <p className={styles.emptyState}>{t("people.emptyState")}</p>
        ) : (
          people.map((person) => (
            <div key={person.id} className={styles.personCard}>
              <div>
                <div className={styles.personName}>{person.name}</div>
                <div className={styles.personEmail}>{person.email}</div>
                <div className={styles.personRole}>{roleLabel(person.role)}</div>
              </div>
              <button
                onClick={() => removePerson(person.id)}
                className={styles.removeButton}
              >
                {t("people.remove")}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Checklist */}
      <div className={styles.panel}>
        <div className={styles.checklistTitle}>{t("people.checklistTitle")}</div>
        <div className={styles.checklistList}>
          {[
            { key: "one", label: t("people.checklistOnePerson"), done: people.length >= 1 },
            {
              key: "manager",
              label: t("people.checklistOneManager"),
              done: people.some(
                (p) => p.role === "manager" || p.role === "owner",
              ),
            },
          ].map((item) => (
            <div key={item.key} className={styles.checklistItem}>
              <span className={styles.checklistIcon}>
                {item.done ? "✅" : "⏳"}
              </span>
              <span
                className={`${styles.checklistText} ${
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
