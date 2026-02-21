/**
 * Teste: ConfigSidebar não renderiza itens proibidos para o papel
 * Manager não deve ver Integrações, Módulos, Estado, Pagamentos
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ConfigSidebar } from "./ConfigSidebar";

const mockUseRoleOptional = vi.fn();
vi.mock("../../core/roles", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../../core/roles")>();
  return {
    ...mod,
    useRoleOptional: () => mockUseRoleOptional(),
  };
});

describe("ConfigSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("com role manager não mostra Integrações, Módulos, Estado, Pagamentos", () => {
    mockUseRoleOptional.mockReturnValue({
      role: "manager",
      setRole: () => {},
    });

    render(
      <MemoryRouter initialEntries={["/config"]}>
        <ConfigSidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Integrações")).toBeNull();
    expect(screen.queryByText("Módulos")).toBeNull();
    expect(screen.queryByText("Estado")).toBeNull();
    expect(screen.queryByText("Pagamentos")).toBeNull();
  });

  it("com role manager mostra itens permitidos (ex.: Identidade, Percepção)", () => {
    mockUseRoleOptional.mockReturnValue({
      role: "manager",
      setRole: () => {},
    });

    render(
      <MemoryRouter initialEntries={["/config"]}>
        <ConfigSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText("Identidade")).toBeTruthy();
    expect(screen.getByText("Percepção")).toBeTruthy();
  });
});
