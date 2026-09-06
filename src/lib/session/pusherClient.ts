import Pusher from "pusher-js";

export function createPusherClient(role: "trainer" | "display"): Pusher {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_PUSHER_KEY environment variable. See README.md for Pusher setup."
    );
  }
  if (!cluster) {
    throw new Error(
      "Missing NEXT_PUBLIC_PUSHER_CLUSTER environment variable. See README.md for Pusher setup."
    );
  }

  return new Pusher(key, {
    cluster,
    channelAuthorization: {
      endpoint: "/api/pusher/auth",
      transport: "ajax",
      params: { role },
    },
  });
}
