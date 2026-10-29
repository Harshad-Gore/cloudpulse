import os from "node:os";

export function getRuntimeInfo() {
  return {
    // HOSTNAME configures the standalone server's bind address (0.0.0.0).
    podHostname: process.env.POD_NAME || os.hostname(),
    clusterName: process.env.K8S_CLUSTER_NAME || "local-development",
    namespace: process.env.K8S_NAMESPACE || "default",
    version: process.env.APP_VERSION || "1.0.0",
  };
}
