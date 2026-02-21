// @ts-nocheck
import { DashboardLayout } from "../components/DashboardLayout";

interface AdminPlaceholderPageProps {
  title: string;
  message?: string;
}

export function AdminPlaceholderPage({
  title,
  message = "Em breve",
}: AdminPlaceholderPageProps) {
  return (
    <DashboardLayout>
      <section>
        <header style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 4px 0",
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h1>
        </header>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          {message}
        </p>
      </section>
    </DashboardLayout>
  );
}
