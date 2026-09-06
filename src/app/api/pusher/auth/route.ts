import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";

const CHANNEL_NAME_PATTERN = /^presence-gymtimer-session-[A-Za-z0-9]+$/;

function getPusherServer(): Pusher {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      "Missing one of PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER environment variables."
    );
  }

  return new Pusher({ appId, key, secret, cluster, useTLS: true });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const socketId = form.get("socket_id");
  const channelName = form.get("channel_name");
  const role = form.get("role");

  if (typeof socketId !== "string" || typeof channelName !== "string") {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  if (!CHANNEL_NAME_PATTERN.test(channelName)) {
    return NextResponse.json({ error: "Invalid channel name" }, { status: 403 });
  }

  if (role !== "trainer" && role !== "display") {
    return NextResponse.json({ error: "Missing or invalid role" }, { status: 400 });
  }

  let pusherServer: Pusher;
  try {
    pusherServer = getPusherServer();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: crypto.randomUUID(),
    user_info: { role },
  });

  return NextResponse.json(authResponse);
}
