import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DisplayConnection } from "../DisplayConnection";

vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code" data-value={value} />,
}));

vi.mock("@/components/ui/VideoPlayer", () => ({
  VideoPlayer: ({ alt, src }: { alt: string; src: string }) => (
    <div data-testid="gym-video" data-src={src}>
      {alt}
    </div>
  ),
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
    expect(screen.queryByTestId("gym-video")).not.toBeInTheDocument();
  });

  it("shows the gym name as the heading when a profile is stored", async () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Box del Sur", videoUrl: "/v.mp4" })
    );

    render(<DisplayConnection code="ABC123" status="waiting" />);

    await waitFor(() => {
      expect(screen.getByTestId("gym-name")).toHaveTextContent("Box del Sur");
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Box del Sur");
  });

  it("renders the gym video as the connection-screen background when set", async () => {
    window.localStorage.setItem(
      "gymtimer.gymProfile",
      JSON.stringify({ name: "Box del Sur", videoUrl: "/videos/gimnasio.mp4" })
    );

    render(<DisplayConnection code="ABC123" status="waiting" />);

    await waitFor(() => {
      expect(screen.getByTestId("gym-video")).toHaveAttribute(
        "data-src",
        "/videos/gimnasio.mp4"
      );
    });
  });
});
