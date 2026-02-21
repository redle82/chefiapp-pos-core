/**
 * CategoryScroller — Horizontal scrollable category pills
 */

export interface MobileCategory {
  id: string;
  name: string;
  emoji?: string;
}

interface CategoryScrollerProps {
  categories: MobileCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryScroller({
  categories,
  selectedId,
  onSelect,
}: CategoryScrollerProps) {
  return (
    <div className="pvm-categories">
      <button
        className={`pvm-categories__item ${
          selectedId === null ? "pvm-categories__item--active" : ""
        }`}
        onClick={() => onSelect(null)}
      >
        <span className="pvm-categories__emoji">🍴</span>
        <span>Tudo</span>
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`pvm-categories__item ${
            selectedId === cat.id ? "pvm-categories__item--active" : ""
          }`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.emoji && (
            <span className="pvm-categories__emoji">{cat.emoji}</span>
          )}
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
