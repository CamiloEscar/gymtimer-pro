import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DisplayConnection } from "../DisplayConnection";

vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="qr-code" data-value={value} />,
}));

describe("DisplayConnection", () => {
  it("points the QR code at the workout-list quickstart URL, not at itself", async () => {
    render(<DisplayConnection code="ABC123" status="waiting" />);
    await waitFor(() => {
      expect(screen.getByTestId("qr-code")).toHaveAttribute(
        "data-value",
        `${window.location.origin}/app/workouts?code=ABC123`
      );
    });
  });
});
