/**
 * P4-8: Advanced Search Panel Component
 *
 * UI para busca avançada com múltiplos filtros
 */

import React, { useState } from "react";
import { Button } from "../../../ui/design-system/Button";
import { Card } from "../../../ui/design-system/Card";
import { Input } from "../../../ui/design-system/Input";
import { Text } from "../../../ui/design-system/primitives/Text";
import { useStaff } from "../context/StaffContext";
import { useAdvancedSearch } from "../hooks/useAdvancedSearch";
import styles from "./AdvancedSearchPanel.module.css";

interface AdvancedSearchPanelProps {
  onClose?: () => void;
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  onClose,
}) => {
  const { tasks } = useStaff();
  const {
    filters,
    logic,
    setLogic,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    savedSearches,
    saveSearch,
    loadSearch,
    deleteSavedSearch,
  } = useAdvancedSearch(tasks);

  const [saveName, setSaveName] = useState("");

  return (
    <Card surface="layer1" padding="lg" className={styles.wrapper}>
      <div className={styles.headerRow}>
        <Text size="lg" weight="bold">
          🔍 Busca Avançada
        </Text>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Logic Selector */}
      <div className={styles.logicSection}>
        <Text size="sm" weight="bold" className={styles.logicLabel}>
          Lógica:
        </Text>
        <div className={styles.logicButtons}>
          <Button
            variant={logic === "AND" ? "solid" : "outline"}
            size="sm"
            onClick={() => setLogic("AND")}
          >
            E (AND)
          </Button>
          <Button
            variant={logic === "OR" ? "solid" : "outline"}
            size="sm"
            onClick={() => setLogic("OR")}
          >
            OU (OR)
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersHeader}>
          <Text size="sm" weight="bold">
            Filtros:
          </Text>
          <Button variant="ghost" size="sm" onClick={addFilter}>
            + Adicionar
          </Button>
        </div>
        {filters.map((filter, index) => (
          <div key={index} className={styles.filterRow}>
            <select
              aria-label="Campo de filtro"
              value={filter.field}
              onChange={(e) =>
                updateFilter(index, {
                  field: e.target.value as
                    | "title"
                    | "description"
                    | "id"
                    | "reason"
                    | "priority"
                    | "status"
                    | "type",
                })
              }
              className={styles.filterSelect}
            >
              <option value="title">Título</option>
              <option value="description">Descrição</option>
              <option value="id">ID</option>
              <option value="reason">Motivo</option>
              <option value="priority">Prioridade</option>
              <option value="status">Status</option>
              <option value="type">Tipo</option>
            </select>
            <select
              aria-label="Operador de filtro"
              value={filter.operator}
              onChange={(e) =>
                updateFilter(index, {
                  operator: e.target.value as
                    | "contains"
                    | "equals"
                    | "startsWith"
                    | "endsWith",
                })
              }
              className={styles.filterSelect}
            >
              <option value="contains">Contém</option>
              <option value="equals">Igual a</option>
              <option value="startsWith">Começa com</option>
              <option value="endsWith">Termina com</option>
            </select>
            <Input
              value={filter.value}
              onChange={(e) => updateFilter(index, { value: e.target.value })}
              placeholder="Valor..."
              className={styles.filterInput}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter(index)}
            >
              ✕
            </Button>
          </div>
        ))}
        {filters.length === 0 && (
          <Text size="sm" color="tertiary" className={styles.emptyMessage}>
            Nenhum filtro adicionado. Clique em "Adicionar" para começar.
          </Text>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actionsRow}>
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Limpar
        </Button>
      </div>

      {/* Save Search */}
      {filters.length > 0 && (
        <div className={styles.saveSection}>
          <Text size="sm" weight="bold" className={styles.saveLabel}>
            Salvar Busca:
          </Text>
          <div className={styles.saveRow}>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Nome da busca..."
              className={styles.saveInput}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (saveName.trim()) {
                  saveSearch(saveName);
                  setSaveName("");
                }
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div>
          <Text size="sm" weight="bold" className={styles.savedLabel}>
            Buscas Salvas:
          </Text>
          {savedSearches.map((saved, index) => (
            <div key={index} className={styles.savedRow}>
              <Text size="sm">{saved.name}</Text>
              <div className={styles.savedActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadSearch(saved)}
                >
                  Carregar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSavedSearch(saved.name)}
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
