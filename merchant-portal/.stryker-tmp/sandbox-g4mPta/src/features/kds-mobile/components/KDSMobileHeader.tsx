/**
 * KDSMobileHeader — Compact header for KDS Mobile
 */

import { useNavigate } from "react-router-dom";

interface KDSMobileHeaderProps {
  restaurantName: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  showBack?: boolean;
}

export function KDSMobileHeader({
  restaurantName,
  onRefresh,
  isRefreshing,
  showBack = false,
}: KDSMobileHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="kdsm-header">
      <div className="kdsm-header__left">
        {showBack && (
          <button
            className="kdsm-header__back"
            onClick={() => navigate("/app/staff/home")}
            aria-label="Voltar"
          >
            ←
          </button>
        )}
        <div>
          <h1 className="kdsm-header__title">🍳 KDS</h1>
          <span className="kdsm-header__subtitle">{restaurantName}</span>
        </div>
      </div>
      <button
        className={`kdsm-header__refresh ${
          isRefreshing ? "kdsm-header__refresh--spinning" : ""
        }`}
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Atualizar pedidos"
      >
        🔄
      </button>
    </header>
  );
}
