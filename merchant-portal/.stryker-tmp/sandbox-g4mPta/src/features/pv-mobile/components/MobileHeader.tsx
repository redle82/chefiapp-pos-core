/**
 * MobileHeader — Compact header for PV Mobile
 *
 * - Restaurant name
 * - Active shift badge
 * - Search button (opens fullscreen modal)
 * - Back button (optional)
 */

import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  restaurantName: string;
  shiftActive?: boolean;
  onSearchClick?: () => void;
  showBack?: boolean;
}

export function MobileHeader({
  restaurantName,
  shiftActive = true,
  onSearchClick,
  showBack = false,
}: MobileHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="pvm-header">
      <div className="pvm-header__left">
        {showBack && (
          <button
            className="pvm-header__back"
            onClick={() => navigate("/app/staff/home")}
            aria-label="Voltar"
          >
            ←
          </button>
        )}
        <div>
          <h1 className="pvm-header__title">{restaurantName}</h1>
          {shiftActive && <p className="pvm-header__subtitle">Turno ativo</p>}
        </div>
      </div>
      <div className="pvm-header__right">
        {shiftActive && (
          <span className="pvm-header__badge">
            <span>●</span>
            <span>ATIVO</span>
          </span>
        )}
        {onSearchClick && (
          <button
            className="pvm-header__search"
            onClick={onSearchClick}
            aria-label="Pesquisar produtos"
          >
            🔍
          </button>
        )}
      </div>
    </header>
  );
}
