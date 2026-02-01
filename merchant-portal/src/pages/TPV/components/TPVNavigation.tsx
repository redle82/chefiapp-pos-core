import React from "react";
import { Button } from "../../../ui/design-system/Button";

interface TPVNavigationProps {
  categories: any[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string) => void;
}

export const TPVNavigation: React.FC<TPVNavigationProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="flex gap-3 p-3 overflow-x-auto bg-zinc-900/60 backdrop-blur-sm border-b border-white/5 scrollbar-hide">
      <Button
        variant={activeCategoryId === "all" ? "primary" : "secondary"}
        size="md" // Larger touch target
        className={`rounded-full px-6 font-medium transition-all ${
          activeCategoryId === "all"
            ? "shadow-lg shadow-primary/20 scale-105"
            : "opacity-70 hover:opacity-100 bg-zinc-800 border-transparent text-zinc-300"
        }`}
        onClick={() => onSelectCategory("all")}
      >
        ♾️ Todos
      </Button>
      {categories?.map((cat) => (
        <Button
          key={cat.id}
          variant={activeCategoryId === cat.id ? "primary" : "secondary"}
          size="md"
          className={`rounded-full px-6 whitespace-nowrap transition-all ${
            activeCategoryId === cat.id
              ? "shadow-lg shadow-primary/20 scale-105"
              : "opacity-70 hover:opacity-100 bg-zinc-800 border-transparent text-zinc-300"
          }`}
          onClick={() => onSelectCategory(cat.id)}
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
};
