/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TiendaOnlineConfigPage } from "./TiendaOnlineConfigPage";

vi.mock("../../../../core/identity/useRestaurantIdentity", () => ({
  useRestaurantIdentity: () => ({
    identity: { id: "rest_123", name: "Sofia Gastrobar" },
  }),
}));

vi.mock("../../../../infra/readers/RestaurantReader", () => ({
  readRestaurantById: vi.fn().mockResolvedValue({ slug: "sofia-gastrobar" }),
}));

vi.mock("../../../../infra/readers/ProductAssetReader", () => ({
  readProductAssets: vi.fn().mockResolvedValue([
    {
      id: "asset_1",
      category: "hero",
      label: "Hambúrguer assinatura",
      image_url: "https://example.com/hero.jpg",
    },
  ]),
}));

vi.mock("../../../../pages/Config/PublicPresenceFields", () => ({
  PublicPresenceFields: () => <div>public-presence-fields</div>,
}));

vi.mock("../../../../pages/Config/PublicQRSection", () => ({
  PublicQRSection: () => <div>public-qr-section</div>,
}));

vi.mock("../../dashboard/components/AdminPageHeader", () => ({
  AdminPageHeader: ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("TiendaOnlineConfigPage layout", () => {
  it("renders the online page sections with public URL, presence fields and QR", async () => {
    render(<TiendaOnlineConfigPage />);

    expect(await screen.findByText("URL pública")).toBeTruthy();
    expect(screen.getByText("public-presence-fields")).toBeTruthy();
    expect(screen.getByText("Biblioteca de Imagens")).toBeTruthy();
    expect(screen.getByText("public-qr-section")).toBeTruthy();
  });
});
