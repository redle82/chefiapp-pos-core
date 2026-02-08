import type { ReactNode } from "react";
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
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {description ? (
          <p className="text-sm text-gray-600">{description}</p>
        ) : null}
      </header>

      <CatalogSubnav />

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        {children}
      </section>
    </div>
  );
}
