import { getRuntimeInfo } from "@/lib/runtime";
import { ClusterDashboard } from "@/components/cluster-dashboard";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const runtime = getRuntimeInfo();
  return <ClusterDashboard servingHostname={runtime.podHostname} clusterName={runtime.clusterName} namespace={runtime.namespace} />;
}
