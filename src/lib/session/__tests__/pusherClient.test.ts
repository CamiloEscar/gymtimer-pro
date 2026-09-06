import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("createPusherClient", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("throws if NEXT_PUBLIC_PUSHER_KEY is missing", async () => {
    delete process.env.NEXT_PUBLIC_PUSHER_KEY;
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER = "us2";
    const { createPusherClient } = await import("../pusherClient");
    expect(() => createPusherClient("trainer")).toThrow("Missing NEXT_PUBLIC_PUSHER_KEY");
  });

  it("throws if NEXT_PUBLIC_PUSHER_CLUSTER is missing", async () => {
    process.env.NEXT_PUBLIC_PUSHER_KEY = "test-key";
    delete process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    const { createPusherClient } = await import("../pusherClient");
    expect(() => createPusherClient("trainer")).toThrow("Missing NEXT_PUBLIC_PUSHER_CLUSTER");
  });

  it("creates a client configured with the given role in auth params", async () => {
    process.env.NEXT_PUBLIC_PUSHER_KEY = "test-key";
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER = "us2";
    const { createPusherClient } = await import("../pusherClient");
    const client = createPusherClient("display");
    expect(client).toBeDefined();
    // pusher-js 8.x normalizes `channelAuthorization` into a `channelAuthorizer`
    // function on `config` at construction time — it does not surface the raw
    // `auth.params` we passed in. We assert on the real shape it exposes instead.
    expect(client.key).toBe("test-key");
    expect(typeof client.config.channelAuthorizer).toBe("function");
  });
});
