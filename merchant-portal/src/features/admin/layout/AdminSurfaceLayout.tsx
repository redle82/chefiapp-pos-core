import type { ReactNode } from "react";
import styles from "./AdminSurfaceLayout.module.css";

type AdminSurfaceVariant = "config" | "operational";

interface AdminSurfaceLayoutProps {
  variant: AdminSurfaceVariant;
  hero?: ReactNode;
  main: ReactNode;
  aside?: ReactNode;
  bottom?: ReactNode;
}

export function AdminSurfaceLayout({
  variant,
  hero,
  main,
  aside,
  bottom,
}: AdminSurfaceLayoutProps) {
  return (
    <section
      className={`${styles.layout} ${styles[variant]}`}
      data-variant={variant}
      data-testid="admin-surface-layout"
    >
      {hero ? (
        <div className={styles.hero} data-testid="admin-surface-hero">
          {hero}
        </div>
      ) : null}

      <div className={styles.content}>
        <div className={styles.main} data-testid="admin-surface-main">
          {main}
        </div>
        {aside ? (
          <aside className={styles.aside} data-testid="admin-surface-aside">
            {aside}
          </aside>
        ) : null}
      </div>

      {bottom ? (
        <div className={styles.bottom} data-testid="admin-surface-bottom">
          {bottom}
        </div>
      ) : null}
    </section>
  );
}
