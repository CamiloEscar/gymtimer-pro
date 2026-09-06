import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

function buildRequest(body: Record<string, string>): NextRequest {
  const form = new URLSearchParams(body);
  return new NextRequest("http://localhost/api/pusher/auth", {
    method: "POST",
    body: form.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

describe("POST /api/pusher/auth", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      PUSHER_APP_ID: "app-id",
      PUSHER_KEY: "key",
      PUSHER_SECRET: "secret",
      PUSHER_CLUSTER: "us2",
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("authorizes a valid presence channel subscription", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      buildRequest({
        socket_id: "123.456",
        channel_name: "presence-gymtimer-session-ABC123",
        role: "trainer",
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.auth).toBeDefined();
    expect(body.channel_data).toBeDefined();
  });

  it("rejects a channel name that isn't a gymtimer session presence channel", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      buildRequest({
        socket_id: "123.456",
        channel_name: "presence-something-else",
        role: "trainer",
      })
    );
    expect(response.status).toBe(403);
  });

  it("returns 500 if server env vars are missing", async () => {
    delete process.env.PUSHER_SECRET;
    const { POST } = await import("../route");
    const response = await POST(
      buildRequest({
        socket_id: "123.456",
        channel_name: "presence-gymtimer-session-ABC123",
        role: "trainer",
      })
    );
    expect(response.status).toBe(500);
  });
});
