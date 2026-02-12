import { useAuth } from "../../../../core/auth/useAuth";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { colors } from "../../../../ui/design-system/tokens/colors";
import { ChefIAppSignature } from "../../../../ui/design-system/sovereign/ChefIAppSignature";
import { RestaurantHeader } from "../../../../ui/design-system/sovereign/RestaurantHeader";

const theme = colors.modes.dashboard;

export function AdminTopbar() {
  const { identity } = useRestaurantIdentity();
  const { user } = useAuth();

  const userEmail = user?.email ?? "";
  const userInitial = userEmail.charAt(0).toUpperCase() || "?";

  return (
    <header
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        borderBottom: `1px solid ${theme.border.subtle}`,
        backgroundColor: theme.surface.layer1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          color: theme.text.primary,
        }}
      >
        <RestaurantHeader
          name={identity.name}
          logoUrl={identity.logoUrl}
          size="md"
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <ChefIAppSignature
          variant="powered"
          size="sm"
          tone="light"
          className=""
        />
        <button
          type="button"
          style={{
            fontSize: 13,
            padding: "8px 12px",
            borderRadius: 999,
            border: `1px solid ${theme.action.base}`,
            backgroundColor: theme.action.base + "18",
            cursor: "pointer",
            color: theme.action.base,
            fontWeight: 500,
          }}
        >
          Assistente IA
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: theme.text.secondary,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "999px",
              backgroundColor: theme.action.base + "24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              color: theme.action.base,
            }}
          >
            {userInitial}
          </div>
          <span>{userEmail || "—"}</span>
        </div>
      </div>
    </header>
  );
}
