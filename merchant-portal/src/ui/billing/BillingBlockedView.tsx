import { OSSignature } from "../design-system/sovereign/OSSignature";
import { colors } from "../design-system/tokens/colors";

export function BillingBlockedView() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: colors.palette.black,
        color: colors.palette.white,
        textAlign: "center",
        padding: "20px",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      {/* Background Decor */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "300px",
          height: "300px",
          background: `radial-gradient(circle, ${colors.palette.fire[500]}22 0%, transparent 70%)`,
          filter: "blur(60px)",
          zIndex: -1,
        }}
      />

      <div
        style={{
          maxWidth: "440px",
          padding: "48px",
          borderRadius: "24px",
          border: `1px solid ${colors.palette.zinc[800]}`,
          backgroundColor: colors.palette.zinc[950],
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <OSSignature state="ember" size="lg" />
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            marginBottom: "16px",
            color: colors.palette.white,
            letterSpacing: "-0.02em",
          }}
        >
          Operação Pausada
        </h1>

        <p
          style={{
            color: colors.palette.zinc[400],
            marginBottom: "32px",
            lineHeight: "1.6",
            fontSize: "15px",
          }}
        >
          O ChefIApp detectou uma pendência de faturação. Para garantir a
          integridade dos seus dados e retomar as vendas, por favor regularize o
          estado da conta.
        </p>

        <button
          style={{
            backgroundColor: colors.palette.fire[500],
            color: colors.palette.white,
            padding: "16px 24px",
            borderRadius: "12px",
            border: "none",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
            width: "100%",
            transition: "all 0.2s",
            boxShadow: `0 4px 12px ${colors.palette.fire[500]}44`,
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = colors.palette.fire[700])
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = colors.palette.fire[500])
          }
          onClick={() => (window.location.href = "/app/billing")}
        >
          Regularizar agora
        </button>

        <button
          style={{
            background: "none",
            color: colors.palette.zinc[500],
            padding: "12px 24px",
            borderRadius: "12px",
            border: "none",
            marginTop: "16px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            transition: "color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.color = colors.palette.zinc[300])
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.color = colors.palette.zinc[500])
          }
          onClick={() => (window.location.href = "/support")}
        >
          Contactar Suporte
        </button>
      </div>

      <div style={{ marginTop: "40px", opacity: 0.3 }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.1em" }}>
          CHEF-OS CORE v2.2 • BILLING ENFORCEMENT
        </p>
      </div>
    </div>
  );
}
