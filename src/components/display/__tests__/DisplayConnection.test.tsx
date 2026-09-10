import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DisplayConnection } from "../DisplayConnection";

vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code" data-value={value} />,
}));

describe("DisplayConnection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("points the QR code at the workout-list quickstart URL, not at itself", async () => {
    render(<DisplayConnection code="ABC123" status="waiting" />);
    await waitFor(() => {
      expect(screen.getByTestId("qr-code")).toHaveAttribute(
        "data-value",
        `${window.location.origin}/app/workouts?code=ABC123`
      );
    });
  });

  it("falls back to CONECTAR PANTALLA when no gym profile is stored", () => {
    render(<DisplayConnection code="ABC123" status="waiting" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("CONECTAR PANTALLA");
    expect(screen.queryByTestId("gym-logo")).not.toBeInTheDocument();
  });

  it("shows the gym name as the heading when a profile is stored", async () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Box del Sur", logoUrl: "/logos/box.png" })
    );

    render(<DisplayConnection code="ABC123" status="waiting" />);

    await waitFor(() => {
      expect(screen.getByTestId("gym-name")).toHaveTextContent("Box del Sur");
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Box del Sur");
  });

  it("renders the gym logo in place of the video", async () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Box del Sur", logoUrl: "/logos/box.png" })
    );

    render(<DisplayConnection code="ABC123" status="waiting" />);

    await waitFor(() => {
      expect(screen.getByTestId("gym-logo")).toHaveAttribute("src", "/logos/box.png");
    });
    expect(screen.getByTestId("gym-logo")).toHaveAttribute("alt", "Logo de Box del Sur");
  });
});
