/**
 * OriginBadge — testes da convenção de labels para origens AppStaff.
 * Convenção: docs/architecture/APPSTAFF_ORDER_ORIGINS_CONVENTION.md
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OriginBadge } from "./OriginBadge";

describe("OriginBadge", () => {
  it("renders SALÃO for APPSTAFF", () => {
    render(<OriginBadge origin="APPSTAFF" />);
    expect(screen.getByText(/SALÃO/)).toBeTruthy();
  });

  it("renders GERENTE for APPSTAFF_MANAGER", () => {
    render(<OriginBadge origin="APPSTAFF_MANAGER" />);
    expect(screen.getByText(/GERENTE/)).toBeTruthy();
  });

  it("renders DONO for APPSTAFF_OWNER", () => {
    render(<OriginBadge origin="APPSTAFF_OWNER" />);
    expect(screen.getByText(/DONO/)).toBeTruthy();
  });

  it("renders CAIXA for TPV", () => {
    render(<OriginBadge origin="TPV" />);
    expect(screen.getByText(/CAIXA/)).toBeTruthy();
  });

  it("renders WEB for WEB_PUBLIC", () => {
    render(<OriginBadge origin="WEB_PUBLIC" />);
    expect(screen.getByText(/WEB/)).toBeTruthy();
  });

  it("renders QR MESA for QR_MESA", () => {
    render(<OriginBadge origin="QR_MESA" />);
    expect(screen.getByText(/QR MESA/)).toBeTruthy();
  });

  it("does not show GARÇOM for APPSTAFF (distinct labels)", () => {
    render(<OriginBadge origin="APPSTAFF" />);
    expect(screen.queryByText(/GARÇOM/)).toBeNull();
    expect(screen.getByText(/SALÃO/)).toBeTruthy();
  });
});
