/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CatalogPublishPage } from "./CatalogPublishPage";

const listPublicationPreviewsMock = vi.fn();
const listPublicationRecordsMock = vi.fn();
const publishCatalogTargetMock = vi.fn();
const rollbackPublicationTargetMock = vi.fn();
const schedulePublicationTargetMock = vi.fn();
const compareLatestPublicationDiffMock = vi.fn();

vi.mock("../../../../core/catalog/catalogApi", () => ({
  listPublicationPreviews: (...args: unknown[]) =>
    listPublicationPreviewsMock(...args),
  listPublicationRecords: (...args: unknown[]) =>
    listPublicationRecordsMock(...args),
  publishCatalogTarget: (...args: unknown[]) =>
    publishCatalogTargetMock(...args),
  rollbackPublicationTarget: (...args: unknown[]) =>
    rollbackPublicationTargetMock(...args),
  schedulePublicationTarget: (...args: unknown[]) =>
    schedulePublicationTargetMock(...args),
  compareLatestPublicationDiff: (...args: unknown[]) =>
    compareLatestPublicationDiffMock(...args),
}));

vi.mock("../../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "rest-publish-1",
    },
  }),
}));

vi.mock("../components/CatalogLayout", () => ({
  CatalogLayout: ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  ),
}));

describe("CatalogPublishPage", () => {
  it("loads publication previews and publishes a target", async () => {
    listPublicationPreviewsMock.mockResolvedValue([
      {
        target: "TPV",
        totalItems: 12,
        activeItems: 10,
        warnings: 1,
      },
      {
        target: "WEB_QR",
        totalItems: 12,
        activeItems: 9,
        warnings: 2,
      },
    ]);

    publishCatalogTargetMock.mockResolvedValue({
      id: "pub-1",
      target: "TPV",
      status: "published",
      publishedAt: "2026-03-06T00:00:00.000Z",
      versionTag: "v1",
      snapshot: {
        target: "TPV",
        totalItems: 12,
        activeItems: 10,
        warnings: 1,
      },
    });

    rollbackPublicationTargetMock.mockResolvedValue({
      id: "pub-rollback-1",
      target: "TPV",
      status: "rolled_back",
      publishedAt: "2026-03-06T01:00:00.000Z",
      versionTag: "rollback-v1",
      snapshot: {
        target: "TPV",
        totalItems: 12,
        activeItems: 10,
        warnings: 1,
      },
    });

    schedulePublicationTargetMock.mockResolvedValue({
      id: "pub-scheduled-1",
      target: "TPV",
      status: "scheduled",
      publishedAt: "2026-03-06T02:00:00.000Z",
      versionTag: "schedule-v1",
      snapshot: {
        target: "TPV",
        totalItems: 12,
        activeItems: 10,
        warnings: 1,
      },
    });

    listPublicationRecordsMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "pub-1",
          target: "TPV",
          status: "published",
          publishedAt: "2026-03-06T00:00:00.000Z",
          versionTag: "v1",
          snapshot: {
            target: "TPV",
            totalItems: 12,
            activeItems: 10,
            warnings: 1,
          },
        },
      ])
      .mockResolvedValue([
        {
          id: "pub-1",
          target: "TPV",
          status: "published",
          publishedAt: "2026-03-06T00:00:00.000Z",
          versionTag: "v1",
          snapshot: {
            target: "TPV",
            totalItems: 12,
            activeItems: 10,
            warnings: 1,
          },
        },
      ]);

    compareLatestPublicationDiffMock.mockResolvedValue({
      target: "TPV",
      latestVersionTag: "v2",
      previousVersionTag: "v1",
      changedItems: 3,
    });

    render(
      <MemoryRouter>
        <CatalogPublishPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("TPV")).toBeTruthy();
    expect(screen.getAllByText("12 itens").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Publicar TPV" }));

    expect(await screen.findByText("Publicacao TPV concluida (v1)."));
    expect(await screen.findByText("Historico recente")).toBeTruthy();
    expect(screen.getByText("TPV · published · v1")).toBeTruthy();
    expect(listPublicationRecordsMock).toHaveBeenCalledWith("rest-publish-1");
    expect(publishCatalogTargetMock).toHaveBeenCalledWith(
      "TPV",
      "rest-publish-1",
    );

    fireEvent.click(screen.getByRole("button", { name: "Rollback TPV" }));

    expect(await screen.findByText("Rollback TPV concluido (rollback-v1)."));
    expect(rollbackPublicationTargetMock).toHaveBeenCalledWith(
      "TPV",
      "rest-publish-1",
    );

    fireEvent.click(screen.getByRole("button", { name: "Agendar TPV" }));

    expect(await screen.findByText("Agendamento TPV criado (schedule-v1)."));

    fireEvent.click(screen.getByRole("button", { name: "Comparar TPV" }));

    expect(await screen.findByText("Diff TPV: 3 itens alterados (v1 -> v2)."));
    expect(compareLatestPublicationDiffMock).toHaveBeenCalledWith(
      "TPV",
      "rest-publish-1",
    );
  });
});
