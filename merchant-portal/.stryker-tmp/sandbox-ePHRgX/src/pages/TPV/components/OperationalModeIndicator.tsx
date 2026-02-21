// @ts-nocheck
interface OperationalModeIndicatorProps {
  session: {
    id: string;
    restaurant_id: string;
    user_id: string;
    device_id: string;
    started_at: string;
    status: string;
    operational_mode: string;
    role_at_turn: string | undefined;
    permissions_snapshot: Record<string, boolean>;
  };
  onLock: () => void;
}

export const OperationalModeIndicator = (
  props: OperationalModeIndicatorProps,
) => (
  <div className="hidden" data-session-id={props.session.id}>
    Mode: {props.session.operational_mode}
  </div>
);
