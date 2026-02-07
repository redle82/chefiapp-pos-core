import { ReactNode } from "react";
import { RestaurantSetupSidebar } from "../../components/Setup/RestaurantSetupSidebar";

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
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f6f7fb",
      }}
    >
      <RestaurantSetupSidebar />
      <main
        style={{
          flex: 1,
          padding: "32px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 820,
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: 14,
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
            padding: "24px 28px 28px",
          }}
        >
          <header style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#9ca3af",
                margin: "0 0 6px 0",
              }}
            >
              Restaurant basics
            </p>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                margin: "0 0 4px 0",
                color: "#111827",
              }}
            >
              {title}
            </h1>
            {description && (
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#6b7280",
                }}
              >
                {description}
              </p>
            )}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}

