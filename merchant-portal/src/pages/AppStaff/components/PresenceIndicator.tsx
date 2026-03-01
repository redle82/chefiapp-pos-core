/**
 * P5-7: Presence Indicator Component
 *
 * Componente para mostrar usuários online
 */

import React, { useEffect, useState } from "react";
import {
  realtimeCollaborationService,
  type PresenceUser,
} from "../../../core/collaboration/RealtimeCollaborationService";
import { getTabIsolated } from "../../../core/storage/TabIsolatedStorage";
import { useTenant } from "../../../core/tenant/TenantContext";
import { Card } from "../../../ui/design-system/Card";
import { Badge } from "../../../ui/design-system/primitives/Badge";
import { Text } from "../../../ui/design-system/primitives/Text";

export const PresenceIndicator: React.FC = () => {
  const { tenantId } = useTenant();
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const restaurantId = tenantId;
    const userId = getTabIsolated("chefiapp_user_id");
    const userName = getTabIsolated("chefiapp_user_name") || "User";
    const role = getTabIsolated("staff_role") || "worker";

    if (restaurantId && userId) {
      realtimeCollaborationService.initializePresence(
        restaurantId,
        userId,
        userName,
        role,
      );

      // Update active users every 5 seconds
      const interval = setInterval(() => {
        setActiveUsers(realtimeCollaborationService.getActiveUsers());
      }, 5000);

      return () => {
        clearInterval(interval);
        realtimeCollaborationService.cleanup();
      };
    }
  }, []);

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <Card
      surface="layer2"
      padding="sm"
      style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}
    >
      <Text size="xs" weight="bold" style={{ marginBottom: 8 }}>
        👥 Online ({activeUsers.length})
      </Text>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {activeUsers.slice(0, 5).map((user) => (
          <div
            key={user.userId}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#00C49F",
              }}
            />
            <Text size="xs">{user.userName}</Text>
            <Badge label={user.role} size="xs" status="ready" />
          </div>
        ))}
      </div>
    </Card>
  );
};
