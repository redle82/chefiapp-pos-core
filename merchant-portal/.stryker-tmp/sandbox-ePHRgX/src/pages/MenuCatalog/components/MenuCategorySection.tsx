/**
 * MenuCategorySection — Secção de categoria (faixa preta + lista de MenuDishCard)
 * Contrato: MENU_VISUAL_CONTRACT.md — categorias como capítulos
 * V2: animateOnScroll (fade-in ao entrar no viewport), usePremium nos cards
 */
// @ts-nocheck


import { useEffect, useRef, useState } from "react";
import type { CatalogItem } from "../types";
import { MenuDishCard } from "./MenuDishCard";

export interface MenuCategorySectionProps {
  id: string;
  title: string;
  items: CatalogItem[];
  onVerPrato: (item: CatalogItem) => void;
  onPedir?: (item: CatalogItem) => void;
  sectionRef?: (el: HTMLElement | null) => void;
  /** V2: badges + AllergenIcons nos cards */
  usePremium?: boolean;
  /** V2: animação ao entrar no viewport */
  animateOnScroll?: boolean;
}

export function MenuCategorySection({
  id,
  title,
  items,
  onVerPrato,
  onPedir,
  sectionRef,
  usePremium = false,
  animateOnScroll = false,
}: MenuCategorySectionProps) {
  const [visible, setVisible] = useState(!animateOnScroll);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!animateOnScroll || !ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true);
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [animateOnScroll]);

  const setRef = (el: HTMLElement | null) => {
    (ref as React.MutableRefObject<HTMLElement | null>).current = el;
    sectionRef?.(el);
  };

  return (
    <section
      ref={setRef}
      data-category-id={id}
      className={`mb-8 transition-all duration-500 ${animateOnScroll && !visible ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
    >
      <div className="sticky top-0 z-10 py-3 px-4 bg-neutral-900 text-white font-bold uppercase tracking-wide text-base md:text-lg">
        {title}
      </div>
      <div className="space-y-6 px-4 pt-4 pb-2">
        {items.map((item) => (
          <MenuDishCard
            key={item.id}
            item={item}
            onVerPrato={onVerPrato}
            onPedir={onPedir}
            usePremium={usePremium}
          />
        ))}
      </div>
    </section>
  );
}
