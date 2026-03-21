import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  trackEnterpriseUpsellView,
  trackEnterpriseUpsellClick,
} from "../enterpriseTracking";

export function EnterpriseUpsellCTA() {
  const navigate = useNavigate();
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    if (viewTrackedRef.current) return;
    trackEnterpriseUpsellView();
    viewTrackedRef.current = true;
  }, []);

  const handleClick = () => {
    trackEnterpriseUpsellClick();
    navigate("/admin/config/subscription");
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 8,
        backgroundColor: "rgba(34, 197, 94, 0.08)",
        border: "1px solid rgba(34, 197, 94, 0.4)",
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        style={{
          padding: "10px 20px",
          borderRadius: 6,
          border: "none",
          backgroundColor: "#16a34a",
          color: "white",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Enable Enterprise Financial Control
      </button>
    </div>
  );
}
