import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../../config";

export const ConciergeWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const supportPhone = CONFIG.SUPPORT_WHATSAPP_NUMBER;

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleOption = (action: string) => {
    if (action === "human") {
      if (supportPhone) {
        window.open(
          `https://wa.me/${supportPhone}?text=${encodeURIComponent(
            "Olá. Gostaria de falar com um especialista operacional.",
          )}`,
          "_blank",
        );
      }
    } else if (action === "chaos") {
      navigate("/read/founding-ppvista");
      setIsOpen(false);
    } else if (action === "install") {
      navigate("/signup");
      setIsOpen(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "32px",
        right: "32px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            marginBottom: "20px",
            width: "320px",
            background: "#1c1c1e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            overflow: "hidden",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px",
              background: "#2c2c2e",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  background: "#32d74b",
                  borderRadius: "50%",
                }}
              ></div>
              <span style={{ fontWeight: 600, color: "#fff" }}>
                Concierge Operacional
              </span>
            </div>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "14px",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Como está a operação hoje?
            </p>
          </div>

          {/* Options */}
          <div style={{ padding: "8px" }}>
            <OptionButton
              onClick={() => handleOption("chaos")}
              icon="🌪️"
              text="Minha cozinha está um caos"
            />
            <OptionButton
              onClick={() => handleOption("install")}
              icon="⚡"
              text="Quero instalar o Sistema Nervoso"
            />
            <OptionButton
              onClick={() => handleOption("human")}
              icon="💬"
              text="Quero falar com um humano"
            />
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={toggleOpen}
        className="hover-scale"
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "#32d74b",
          border: "none",
          boxShadow: "0 8px 30px rgba(50, 215, 75, 0.3)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "28px",
          color: "#000",
          transition: "transform 0.2s",
        }}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
};

const OptionButton = ({
  icon,
  text,
  onClick,
}: {
  icon: string;
  text: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      padding: "16px",
      background: "transparent",
      border: "none",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      color: "#e5e5e5",
      fontSize: "14px",
      textAlign: "left",
      cursor: "pointer",
      transition: "background 0.2s",
    }}
    onMouseOver={(e) =>
      (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
    }
    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
  >
    <span style={{ fontSize: "20px" }}>{icon}</span>
    <span>{text}</span>
  </button>
);
