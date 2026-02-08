/**
 * ModulesPage - "Mis productos" / Módulos (Last.app style).
 * Ref: plano página_mis_productos_módulos. Título, subtítulo, grid responsiva, cards.
 */

import { useNavigate } from "react-router-dom";
import { ModuleCard } from "../components/ModuleCard";
import { MODULES_MOCK } from "../data/modulesMock";

export function ModulesPage() {
  const navigate = useNavigate();

  const handlePrimaryAction = (id: string) => {
    switch (id) {
      case "tpv":
        navigate("/op/tpv");
        break;
      case "fichaje":
      case "stock":
      case "tienda-online":
        // Activar: futuro — chamada API ou navegação para setup
        break;
      case "qr-ordering":
        navigate("/admin/config/delivery");
        break;
      case "reservas":
        navigate("/admin/reservations");
        break;
      case "delivery-integrator":
        navigate("/admin/config/integraciones");
        break;
      default:
        break;
    }
  };

  const handleSecondaryAction = (_id: string) => {
    // Desactivar: futuro — chamada API
  };

  const essenciais = MODULES_MOCK.filter((m) => m.block === "essenciais");
  const canais = MODULES_MOCK.filter((m) => m.block === "canais");

  const gridStyle = {
    display: "grid" as const,
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  };
  const blockTitleStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    margin: "0 0 8px 0",
  };

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <header style={{ marginBottom: 16 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 4px 0",
            color: "#111827",
          }}
        >
          Mis productos
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          Selecciona los productos que deseas activar o editar.
        </p>
      </header>

      <section style={{ marginBottom: 24 }}>
        <h2 style={blockTitleStyle}>Esenciales del día a día</h2>
        <div style={gridStyle}>
          {essenciais.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onPrimaryAction={handlePrimaryAction}
              onSecondaryAction={handleSecondaryAction}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 style={blockTitleStyle}>Canales y crecimiento</h2>
        <div style={gridStyle}>
          {canais.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onPrimaryAction={handlePrimaryAction}
              onSecondaryAction={handleSecondaryAction}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
