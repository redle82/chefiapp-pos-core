/**
 * useKeyboardNav — Keyboard navigation hook for grids and lists (WCAG 2.1).
 *
 * Features:
 * - Arrow key navigation for product grid (TPV)
 * - Enter/Space to select the focused item
 * - Escape callback (for closing modals/drawers)
 * - Roving tabindex: only the active item has tabindex=0
 * - Wrapping navigation (end of row wraps to next row)
 *
 * Usage:
 *   const { activeIndex, getItemProps } = useKeyboardNav({
 *     itemCount: products.length,
 *     columns: 4,
 *     onSelect: (index) => addToCart(products[index]),
 *     onEscape: () => closePanel(),
 *   });
 */

import { useCallback, useRef, useState } from "react";

interface UseKeyboardNavOptions {
  /** Total number of items in the grid/list */
  itemCount: number;
  /** Number of columns in the grid (1 for lists) */
  columns?: number;
  /** Called when Enter/Space is pressed on an item */
  onSelect?: (index: number) => void;
  /** Called when Escape is pressed */
  onEscape?: () => void;
  /** Whether navigation is enabled */
  enabled?: boolean;
}

interface ItemProps {
  tabIndex: number;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  ref: (el: HTMLElement | null) => void;
  "aria-selected"?: boolean;
}

interface UseKeyboardNavReturn {
  /** Currently focused item index (-1 if none) */
  activeIndex: number;
  /** Set the active index programmatically */
  setActiveIndex: (index: number) => void;
  /** Get props to spread on each grid/list item */
  getItemProps: (index: number) => ItemProps;
  /** Container props for the grid/list wrapper */
  containerProps: {
    role: string;
    "aria-label"?: string;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}

export function useKeyboardNav({
  itemCount,
  columns = 1,
  onSelect,
  onEscape,
  enabled = true,
}: UseKeyboardNavOptions): UseKeyboardNavReturn {
  const [activeIndex, setActiveIndex] = useState(-1);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  const focusItem = useCallback(
    (index: number) => {
      if (index < 0 || index >= itemCount) return;
      setActiveIndex(index);
      const el = itemRefs.current.get(index);
      if (el) {
        el.focus({ preventScroll: false });
      }
    },
    [itemCount],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled || itemCount === 0) return;

      let nextIndex = activeIndex;
      let handled = false;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = activeIndex + 1;
          if (nextIndex >= itemCount) nextIndex = 0; // Wrap
          handled = true;
          break;

        case "ArrowLeft":
          nextIndex = activeIndex - 1;
          if (nextIndex < 0) nextIndex = itemCount - 1; // Wrap
          handled = true;
          break;

        case "ArrowDown":
          nextIndex = activeIndex + columns;
          if (nextIndex >= itemCount) nextIndex = activeIndex % columns; // Wrap to top
          handled = true;
          break;

        case "ArrowUp":
          nextIndex = activeIndex - columns;
          if (nextIndex < 0) {
            // Wrap to bottom of same column
            const col = activeIndex % columns;
            const lastRowStart =
              Math.floor((itemCount - 1) / columns) * columns;
            nextIndex = Math.min(lastRowStart + col, itemCount - 1);
          }
          handled = true;
          break;

        case "Home":
          nextIndex = 0;
          handled = true;
          break;

        case "End":
          nextIndex = itemCount - 1;
          handled = true;
          break;

        case "Enter":
        case " ":
          if (activeIndex >= 0 && activeIndex < itemCount) {
            e.preventDefault();
            onSelect?.(activeIndex);
          }
          return;

        case "Escape":
          onEscape?.();
          return;

        default:
          return;
      }

      if (handled) {
        e.preventDefault();
        focusItem(nextIndex);
      }
    },
    [activeIndex, itemCount, columns, enabled, onSelect, onEscape, focusItem],
  );

  const getItemProps = useCallback(
    (index: number): ItemProps => ({
      tabIndex: activeIndex === index ? 0 : -1,
      onKeyDown: handleKeyDown,
      onFocus: () => setActiveIndex(index),
      ref: (el: HTMLElement | null) => {
        if (el) {
          itemRefs.current.set(index, el);
        } else {
          itemRefs.current.delete(index);
        }
      },
      "aria-selected": activeIndex === index ? true : undefined,
    }),
    [activeIndex, handleKeyDown],
  );

  const containerProps = {
    role: columns > 1 ? "grid" : "listbox",
    onKeyDown: handleKeyDown,
  };

  return {
    activeIndex,
    setActiveIndex,
    getItemProps,
    containerProps,
  };
}
