import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LabelEnginePage } from "./LabelEnginePage";

const mockListLabelProfiles = vi.fn();
const mockSaveLabelProfile = vi.fn();
const mockCreateLabelJob = vi.fn();
const mockSetPrintJobStatus = vi.fn();
const mockT = vi.fn((key: string) => key);

vi.mock("../../../../core/identity/useRestaurantIdentity", () => ({
  useRestaurantIdentity: () => ({
    identity: {
      id: "rest-1",
      name: "Restaurante",
    },
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

vi.mock("../../../../core/print/LabelEngineApi", () => ({
  listLabelProfiles: (...args: unknown[]) => mockListLabelProfiles(...args),
  saveLabelProfile: (...args: unknown[]) => mockSaveLabelProfile(...args),
  createLabelJob: (...args: unknown[]) => mockCreateLabelJob(...args),
}));

vi.mock("../../../../core/print/CorePrintApi", () => ({
  setPrintJobStatus: (...args: unknown[]) => mockSetPrintJobStatus(...args),
}));

describe("LabelEnginePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockT.mockImplementation((key: string) => key);
    vi.spyOn(window, "alert").mockImplementation(() => undefined);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    mockCreateLabelJob.mockResolvedValue({
      data: { job_id: "job-1", status: "pending" },
      error: null,
    });
    mockSaveLabelProfile.mockResolvedValue({
      data: { id: "profile-saved" },
      error: null,
    });
    mockSetPrintJobStatus.mockResolvedValue({
      data: { ok: true },
      error: null,
    });
    (
      window as Window & {
        electronBridge?: {
          printLabel?: (payload: unknown) => Promise<{ ok: boolean }>;
        };
      }
    ).electronBridge = undefined;
  });

  it("prints using selected saved profile id", async () => {
    const user = userEvent.setup();
    mockListLabelProfiles.mockResolvedValue({
      data: [
        {
          id: "profile-42",
          name: "Default profile",
        },
      ],
      error: null,
    });

    render(<LabelEnginePage />);

    await waitFor(() => {
      expect(mockListLabelProfiles).toHaveBeenCalledWith("rest-1");
    });

    await user.click(screen.getByRole("button", { name: "buttons.print" }));

    await waitFor(() => {
      expect(mockCreateLabelJob).toHaveBeenCalled();
    });

    const callArg = mockCreateLabelJob.mock.calls[0][0];
    expect(callArg.profileId).toBe("profile-42");
    expect(mockSaveLabelProfile).not.toHaveBeenCalled();
  });

  it("autosaves profile before printing when none is selected", async () => {
    const user = userEvent.setup();
    mockListLabelProfiles.mockResolvedValue({
      data: [],
      error: null,
    });

    render(<LabelEnginePage />);

    await waitFor(() => {
      expect(mockListLabelProfiles).toHaveBeenCalledWith("rest-1");
    });

    await user.click(screen.getByRole("button", { name: "buttons.print" }));

    await waitFor(() => {
      expect(mockSaveLabelProfile).toHaveBeenCalled();
      expect(mockCreateLabelJob).toHaveBeenCalled();
    });

    const callArg = mockCreateLabelJob.mock.calls[0][0];
    expect(callArg.profileId).toBe("profile-saved");
  });

  it("prints via electron bridge and acks job as sent", async () => {
    const user = userEvent.setup();
    mockListLabelProfiles.mockResolvedValue({
      data: [
        {
          id: "profile-42",
          name: "Default profile",
        },
      ],
      error: null,
    });

    (
      window as Window & {
        electronBridge?: {
          printLabel?: (payload: unknown) => Promise<{ ok: boolean }>;
        };
      }
    ).electronBridge = {
      printLabel: vi.fn().mockResolvedValue({ ok: true }),
    };

    render(<LabelEnginePage />);

    await waitFor(() => {
      expect(mockListLabelProfiles).toHaveBeenCalledWith("rest-1");
    });

    await user.click(screen.getByRole("button", { name: "buttons.print" }));

    await waitFor(() => {
      expect(mockSetPrintJobStatus).toHaveBeenCalledWith({
        jobId: "job-1",
        status: "sent",
      });
    });
  });
});
