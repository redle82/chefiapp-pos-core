/**
 * P3-5: Dark Mode Toggle Component
 *
 * Componente para alternar entre modo claro e escuro
 */
// @ts-nocheck


import React from "react";
import { Button } from "../design-system/Button";
import { useDarkMode } from "../hooks/useDarkMode";

export const DarkModeToggle: React.FC = () => {
  const { isDark, toggle } = useDarkMode();

  return (
    <Button
      variant="outline"
      tone="neutral"
      size="sm"
      onClick={toggle}
      style={{ minWidth: 100 }}
    >
      {isDark ? "☀️ Claro" : "🌙 Escuro"}
    </Button>
  );
};
