/**
 * ConfigPlaceholderPage - Placeholder para secções de config ainda não implementadas.
 * Usado dentro de AdminConfigLayout (não envolve DashboardLayout).
 */
// @ts-nocheck


interface ConfigPlaceholderPageProps {
  title: string;
  message?: string;
}

export function ConfigPlaceholderPage({
  title,
  message = "Em breve.",
}: ConfigPlaceholderPageProps) {
  return (
    <div style={{ maxWidth: 720 }}>
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
    </div>
  );
}
