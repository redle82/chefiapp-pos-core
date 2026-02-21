// @ts-nocheck
import type { ReactNode } from "react";
import { RestaurantSetupSidebar } from "../../components/Setup/RestaurantSetupSidebar";
import styles from "./RestaurantSetupLayout.module.css";

interface RestaurantSetupLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function RestaurantSetupLayout({
  title,
  description,
  children,
}: RestaurantSetupLayoutProps) {
  return (
    <div className={styles.layout}>
      <RestaurantSetupSidebar />
      <main className={styles.main}>
        <div className={styles.card}>
          <header className={styles.header}>
            <p className={styles.breadcrumb}>Básicos do restaurante</p>
            <h1 className={styles.title}>{title}</h1>
            {description && <p className={styles.description}>{description}</p>}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
