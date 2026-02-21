/**
 * BottomNavBar — Barra inferior fixa (5 ícones grandes)
 * Princípio: 1 dedo, sempre visível, zero pensamento.
 */
// @ts-nocheck


import { useLocation, useNavigate } from "react-router-dom";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import { spacing } from "../../../ui/design-system/tokens/spacing";

interface BottomNavBarProps {
  callsCount?: number;
  ordersCount?: number;
  chatUnread?: number;
}

export function BottomNavBar({
  callsCount = 0,
  ordersCount = 0,
  chatUnread = 0,
}: BottomNavBarProps) {
  const { t } = useTranslation("waiter");
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const navItems = [
    {
      icon: "🗺️",
      label: t("bottomNav.map"),
      path: "/app/waiter",
      active:
        isActive("/app/waiter") &&
        !isActive("/app/waiter/calls") &&
        !isActive("/app/waiter/orders") &&
        !isActive("/app/waiter/chat") &&
        !isActive("/app/waiter/profile"),
    },
    {
      icon: "🔔",
      label: t("bottomNav.calls"),
      path: "/app/waiter/calls",
      badge: callsCount > 0 ? callsCount : undefined,
      active: isActive("/app/waiter/calls"),
    },
    {
      icon: "📋",
      label: t("bottomNav.orders"),
      path: "/app/waiter/orders",
      badge: ordersCount > 0 ? ordersCount : undefined,
      active: isActive("/app/waiter/orders"),
    },
    {
      icon: "💬",
      label: t("bottomNav.chat"),
      path: "/app/waiter/chat",
      badge: chatUnread > 0 ? chatUnread : undefined,
      active: isActive("/app/waiter/chat"),
    },
    {
      icon: "👤",
      label: t("bottomNav.profile"),
      path: "/app/waiter/profile",
      active: isActive("/app/waiter/profile"),
    },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        background: "rgba(0, 0, 0, 0.9)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: spacing[2],
        borderTop: `1px solid ${colors.border.subtle}`,
        zIndex: 1000,
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing[1],
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: spacing[2],
            borderRadius: 8,
            transition: "all 0.2s ease",
            opacity: item.active ? 1 : 0.6,
            position: "relative",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.9)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {/* Ícone */}
          <div
            style={{
              fontSize: 32,
              lineHeight: 1,
              position: "relative",
            }}
          >
            {item.icon}

            {/* Badge */}
            {item.badge && item.badge > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "#ff453a",
                  color: "white",
                  borderRadius: "50%",
                  minWidth: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: "bold",
                  padding: "0 4px",
                }}
              >
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </div>

          {/* Label */}
          <Text
            size="xs"
            style={{
              color: item.active ? colors.action.base : colors.text.tertiary,
              fontWeight: item.active ? "bold" : "normal",
            }}
          >
            {item.label}
          </Text>

          {/* Indicador ativo */}
          {item.active && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 32,
                height: 3,
                background: colors.action.base,
                borderRadius: "2px 2px 0 0",
              }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
