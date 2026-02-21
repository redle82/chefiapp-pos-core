// @ts-nocheck
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { useCatalogStore } from "../../../../core/catalog/catalogStore";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { CatalogSubnav } from "./CatalogSubnav";

interface CatalogLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function CatalogLayout({
  title,
  description,
  children,
}: CatalogLayoutProps) {
  const { runtime } = useRestaurantRuntime();
  const setRestaurantId = useCatalogStore((s) => s.setRestaurantId);

  useEffect(() => {
    setRestaurantId(runtime?.restaurant_id ?? null);
  }, [runtime?.restaurant_id, setRestaurantId]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={title} subtitle={description} />

      <CatalogSubnav />

      <section
        className="rounded-xl border p-4 shadow-sm"
        style={{
          backgroundColor: "var(--card-bg-on-dark, var(--surface-elevated))",
          borderColor: "var(--surface-border)",
        }}
      >
        {children}
      </section>
    </div>
  );
}
