/**
 * ImpresorasPage — Gestão de Impressoras e Rotas de Impressão.
 *
 * Phase 6: Impressão — configuração de IP/porta + botão de teste.
 */

import { useCallback, useState } from "react";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { impresorasStore } from "../store/impresorasStore";
import type { Printer } from "../types";

/** Opens a browser print dialog with a test page for the given printer. */
function triggerTestPrint(printer: Printer): void {
  const ipLine = printer.ip
    ? `IP: ${printer.ip}${printer.port ? `:${printer.port}` : ""}`
    : "Ligação: " +
      (printer.connection === "network" ? "Rede" : printer.connection);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Teste de Impressão</title>
<style>
  body { font-family: monospace; padding: 20px; }
  h2 { font-size: 18px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
  p { margin: 4px 0; font-size: 13px; }
  .ok { font-size: 18px; font-weight: bold; text-align: center; margin-top: 16px; }
</style></head><body>
  <h2>ChefIApp — Teste de Impressão</h2>
  <p><strong>Impressora:</strong> ${printer.name}</p>
  <p><strong>Tipo:</strong> ${printer.type}</p>
  <p>${ipLine}</p>
  <p><strong>Data:</strong> ${new Date().toLocaleString("pt-PT")}</p>
  <div class="ok">✓ Impressão OK</div>
</body></html>`;

  const win = window.open("", "_blank", "width=400,height=500");
  if (!win) {
    alert("O popup foi bloqueado. Autorize popups para testar a impressão.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.print();
  };
}

interface EditForm {
  ip: string;
  port: string;
}

export function ImpresorasPage() {
  const [printers, setPrinters] = useState(impresorasStore.getPrinters());
  const [routes, setRoutes] = useState(impresorasStore.getRoutes());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ ip: "", port: "" });

  const refresh = useCallback(() => {
    setPrinters(impresorasStore.getPrinters());
    setRoutes(impresorasStore.getRoutes());
  }, []);

  function handleStartEdit(p: Printer) {
    setEditingId(p.id);
    setEditForm({ ip: p.ip ?? "", port: p.port != null ? String(p.port) : "" });
  }

  function handleCancelEdit() {
    setEditingId(null);
  }

  function handleSaveEdit(id: string) {
    const port = editForm.port.trim() ? parseInt(editForm.port, 10) : null;
    impresorasStore.updatePrinter(id, {
      ip: editForm.ip.trim() || null,
      port: Number.isFinite(port) ? port : null,
    });
    setEditingId(null);
    refresh();
  }

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <AdminPageHeader
        title="Impressoras"
        subtitle="Impressoras e rotas de impressão por tipo de pedido ou categoria."
      />

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            border: "1px solid var(--surface-border)",
            borderRadius: 12,
            padding: 16,
            backgroundColor: "var(--card-bg-on-dark)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Impressoras
            </h3>
            <button
              type="button"
              onClick={() => {
                const name = window.prompt("Nome da impressora");
                if (name) {
                  impresorasStore.addPrinter(name, "kitchen", "network");
                  refresh();
                }
              }}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-inverse)",
                backgroundColor: "var(--color-primary)",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              + Adicionar impressora
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--surface-border)",
                    textAlign: "left",
                  }}
                >
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Nome
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Tipo
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    IP / Porta
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                      width: 200,
                    }}
                  />
                </tr>
              </thead>
              <tbody>
                {printers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: 24,
                        textAlign: "center",
                        color: "var(--text-secondary)",
                        fontSize: 14,
                      }}
                    >
                      Sem impressoras. Adicione uma com o botão +.
                    </td>
                  </tr>
                ) : (
                  printers.map((p) => (
                    <>
                      <tr
                        key={p.id}
                        style={{
                          borderBottom:
                            editingId === p.id
                              ? "none"
                              : "1px solid var(--surface-border)",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "var(--text-primary)",
                            fontWeight: 500,
                          }}
                        >
                          {p.name}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {p.type}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {p.ip ? (
                            `${p.ip}${p.port ? `:${p.port}` : ""}`
                          ) : (
                            <span style={{ opacity: 0.5 }}>—</span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            aria-label={`Testar impressão em ${p.name}`}
                            onClick={() => triggerTestPrint(p)}
                            style={{
                              fontSize: 12,
                              color: "var(--color-primary)",
                              background: "none",
                              border: "1px solid var(--color-primary)",
                              borderRadius: 6,
                              cursor: "pointer",
                              padding: "4px 10px",
                              fontWeight: 600,
                            }}
                          >
                            Testar Impressão
                          </button>
                          <button
                            type="button"
                            aria-label={`Configurar IP/porta de ${p.name}`}
                            onClick={() =>
                              editingId === p.id
                                ? handleCancelEdit()
                                : handleStartEdit(p)
                            }
                            style={{
                              fontSize: 12,
                              color: "var(--text-secondary)",
                              background: "none",
                              border: "1px solid var(--surface-border)",
                              borderRadius: 6,
                              cursor: "pointer",
                              padding: "4px 10px",
                            }}
                          >
                            Configurar
                          </button>
                          <button
                            type="button"
                            aria-label={`Eliminar impressora ${p.name}`}
                            onClick={() => {
                              impresorasStore.deletePrinter(p.id);
                              refresh();
                            }}
                            style={{
                              fontSize: 12,
                              color: "var(--color-error)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px 6px",
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                      {editingId === p.id && (
                        <tr
                          key={`${p.id}-edit`}
                          style={{
                            borderBottom: "1px solid var(--surface-border)",
                            backgroundColor:
                              "var(--surface-hover, rgba(0,0,0,0.04))",
                          }}
                        >
                          <td colSpan={4} style={{ padding: "12px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                gap: 12,
                                alignItems: "flex-end",
                                flexWrap: "wrap",
                              }}
                            >
                              <div>
                                <label
                                  htmlFor={`ip-${p.id}`}
                                  style={{
                                    display: "block",
                                    fontSize: 12,
                                    color: "var(--text-secondary)",
                                    marginBottom: 4,
                                  }}
                                >
                                  Endereço IP
                                </label>
                                <input
                                  id={`ip-${p.id}`}
                                  type="text"
                                  placeholder="192.168.1.100"
                                  value={editForm.ip}
                                  onChange={(e) =>
                                    setEditForm((f) => ({
                                      ...f,
                                      ip: e.target.value,
                                    }))
                                  }
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: 13,
                                    borderRadius: 6,
                                    border: "1px solid var(--surface-border)",
                                    background:
                                      "var(--input-bg, var(--surface-bg))",
                                    color: "var(--text-primary)",
                                    width: 160,
                                  }}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`port-${p.id}`}
                                  style={{
                                    display: "block",
                                    fontSize: 12,
                                    color: "var(--text-secondary)",
                                    marginBottom: 4,
                                  }}
                                >
                                  Porta
                                </label>
                                <input
                                  id={`port-${p.id}`}
                                  type="number"
                                  placeholder="9100"
                                  value={editForm.port}
                                  min={1}
                                  max={65535}
                                  onChange={(e) =>
                                    setEditForm((f) => ({
                                      ...f,
                                      port: e.target.value,
                                    }))
                                  }
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: 13,
                                    borderRadius: 6,
                                    border: "1px solid var(--surface-border)",
                                    background:
                                      "var(--input-bg, var(--surface-bg))",
                                    color: "var(--text-primary)",
                                    width: 90,
                                  }}
                                />
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(p.id)}
                                  style={{
                                    padding: "7px 14px",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--text-inverse)",
                                    backgroundColor: "var(--color-primary)",
                                    border: "none",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                  }}
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  style={{
                                    padding: "7px 14px",
                                    fontSize: 13,
                                    color: "var(--text-secondary)",
                                    background: "none",
                                    border: "1px solid var(--surface-border)",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                  }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                            {editForm.ip && (
                              <p
                                style={{
                                  marginTop: 8,
                                  fontSize: 12,
                                  color: "var(--text-secondary)",
                                }}
                              >
                                Dica: a porta padrão para impressoras térmicas
                                de rede é <strong>9100</strong>.
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--surface-border)",
          borderRadius: 12,
          padding: 16,
          backgroundColor: "var(--card-bg-on-dark)",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Rotas de impressão
        </h3>
        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          Associa que impressora recebe cada tipo de pedido ou categoria.
        </p>
        {routes.length === 0 ? (
          <p
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: 14,
              margin: 0,
            }}
          >
            Sem rotas. Adicione impressoras e depois crie rotas.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--surface-border)",
                    textAlign: "left",
                  }}
                >
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Rota
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Impressora
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                      width: 80,
                    }}
                  />
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: "1px solid var(--surface-border)" }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {r.name}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {r.trigger}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        type="button"
                        aria-label={`Eliminar rota ${r.name}`}
                        onClick={() => {
                          impresorasStore.deleteRoute(r.id);
                          refresh();
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          fontSize: 16,
                          padding: "4px 8px",
                          borderRadius: 6,
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
