/**
 * ProductCategoryFilter — Horizontal scrollable category pills (icon + name).
 * Ref: POS reference layout with circle avatar, orange selected state.
 */
// @ts-nocheck


import { useEffect, useMemo, useRef, useState } from "react";

const ACCENT = "#f97316";

export interface TPVCategory {
  id: string;
  name: string;
  icon?: string;
}

interface ProductCategoryFilterProps {
  categories: TPVCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** Fallback emoji por nome de categoria */
function categoryEmoji(name?: string): string {
  if (!name) return "📦";
  const n = name.toLowerCase();
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger") || n.includes("hambur")) return "🍔";
  if (n.includes("drink") || n.includes("bebida")) return "🥤";
  if (n.includes("hot") || n.includes("café") || n.includes("coffee"))
    return "☕";
  if (n.includes("dessert") || n.includes("sobremesa")) return "🍰";
  if (n.includes("salad") || n.includes("salada")) return "🥗";
  if (n.includes("pasta") || n.includes("massa")) return "🍝";
  if (n.includes("sushi") || n.includes("peixe") || n.includes("fish"))
    return "🍣";
  if (n.includes("carne") || n.includes("meat") || n.includes("steak"))
    return "🥩";
  if (n.includes("frango") || n.includes("chicken")) return "🍗";
  return "📦";
}

export function ProductCategoryFilter({
  categories,
  selectedId,
  onSelect,
}: ProductCategoryFilterProps) {
  const allCategories = useMemo(() => [...categories], [categories]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const allRef = useRef<HTMLButtonElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollByAmount = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const updateScrollState = () => {
    const node = scrollRef.current;
    if (!node) return;
    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    const currentLeft = Math.round(node.scrollLeft);
    setHasOverflow(maxScrollLeft > 4);
    setCanScrollLeft(currentLeft > 0);
    setCanScrollRight(currentLeft < maxScrollLeft - 1);
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    const node = scrollRef.current;
    if (!node) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    node.scrollBy({ left: event.deltaY, behavior: "auto" });
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByAmount(240);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByAmount(-240);
    }
  };

  useEffect(() => {
    if (selectedId === null) {
      allRef.current?.scrollIntoView({ behavior: "smooth", inline: "center" });
      return;
    }
    const node = itemRefs.current.get(selectedId);
    node?.scrollIntoView({ behavior: "smooth", inline: "center" });
  }, [selectedId]);

  useEffect(() => {
    updateScrollState();
    const onResize = () => updateScrollState();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [categories.length]);

  useEffect(() => {
    const active = document.activeElement;
    if (active && active !== document.body) return;
    scrollRef.current?.focus();
  }, []);

  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      {hasOverflow && (
        <button
          type="button"
          onClick={() => scrollByAmount(-240)}
          aria-label="Rolar categorias para a esquerda"
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 3,
            border: "none",
            borderRadius: 9999,
            width: 28,
            height: 28,
            background: "rgba(15, 15, 15, 0.85)",
            color: "#d4d4d8",
            cursor: canScrollLeft ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
            opacity: canScrollLeft ? 1 : 0.4,
          }}
          disabled={!canScrollLeft}
        >
          ‹
        </button>
      )}
      {hasOverflow && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 42,
            zIndex: 2,
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(17,17,17,0.95), rgba(17,17,17,0))",
          }}
        />
      )}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: "2px 36px 6px",
          alignItems: "center",
          scrollbarWidth: "thin",
          scrollbarColor: "#3f3f46 transparent",
        }}
        onScroll={updateScrollState}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {allCategories.map((cat) => {
          const isSelected = selectedId === cat.id;
          const emoji = cat.icon ?? categoryEmoji(cat.name);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              ref={(node) => itemRefs.current.set(cat.id, node)}
              style={{
                flexShrink: 0,
                padding: "8px 18px 8px 8px",
                borderRadius: 9999,
                border: "none",
                backgroundColor: isSelected ? ACCENT : "#262626",
                color: isSelected ? "#fff" : "#a3a3a3",
                fontWeight: isSelected ? 600 : 400,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: isSelected
                    ? "rgba(255,255,255,0.2)"
                    : "#1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {emoji}
              </span>
              {cat.name}
            </button>
          );
        })}
        {/* "All" category */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          ref={allRef}
          style={{
            flexShrink: 0,
            padding: "8px 18px 8px 8px",
            borderRadius: 9999,
            border: "none",
            backgroundColor: selectedId === null ? ACCENT : "#262626",
            color: selectedId === null ? "#fff" : "#a3a3a3",
            fontWeight: selectedId === null ? 600 : 400,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.15s ease",
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor:
                selectedId === null ? "rgba(255,255,255,0.2)" : "#1a1a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            🍽️
          </span>
          Todos
        </button>
      </div>
      {hasOverflow && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 42,
            zIndex: 2,
            pointerEvents: "none",
            background:
              "linear-gradient(270deg, rgba(17,17,17,0.95), rgba(17,17,17,0))",
          }}
        />
      )}
      {hasOverflow && (
        <button
          type="button"
          onClick={() => scrollByAmount(240)}
          aria-label="Rolar categorias para a direita"
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 3,
            border: "none",
            borderRadius: 9999,
            width: 28,
            height: 28,
            background: "rgba(15, 15, 15, 0.85)",
            color: "#d4d4d8",
            cursor: canScrollRight ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
            opacity: canScrollRight ? 1 : 0.4,
          }}
          disabled={!canScrollRight}
        >
          ›
        </button>
      )}
    </div>
  );
}
