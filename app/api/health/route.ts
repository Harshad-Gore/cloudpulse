import { NextResponse } from "next/server";
import os from "os";
import { getRuntimeInfo } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      service: "cloudpulse-k8s",
      ...getRuntimeInfo(),
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
