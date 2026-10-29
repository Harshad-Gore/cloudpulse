import { NextResponse } from "next/server";
import { getRuntimeInfo } from "@/lib/runtime";
import { INITIAL_WORKLOADS } from "@/lib/workloads-data";

export async function GET() {
  const runtime = getRuntimeInfo();
  return NextResponse.json({
    servedByPod: runtime.podHostname,
    clusterName: runtime.clusterName,
    namespace: runtime.namespace,
    mode: "demo",
    totalPods: INITIAL_WORKLOADS.length,
    workloads: INITIAL_WORKLOADS,
  });
}
