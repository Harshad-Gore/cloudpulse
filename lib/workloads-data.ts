export interface WorkloadItem {
  id: string;
  podName: string;
  namespace: string;
  image: string;
  status: "Running" | "Pending" | "Degraded";
  restarts: number;
  cpuMillicores: number;
  memoryMiB: number;
  nodePort: number;
  nodeName: string;
  age: string;
}

export const INITIAL_WORKLOADS: WorkloadItem[] = [
  {
    id: "wk-01",
    podName: "cloudpulse-deployment-7d9f8b6c4-x9k2m",
    namespace: "production",
    image: "cloudpulse:1.0.0",
    status: "Running",
    restarts: 0,
    cpuMillicores: 145,
    memoryMiB: 118,
    nodePort: 30080,
    nodeName: "k8s-worker-node-01",
    age: "4d 11h",
  },
  {
    id: "wk-02",
    podName: "cloudpulse-deployment-7d9f8b6c4-p4l8n",
    namespace: "production",
    image: "cloudpulse:1.0.0",
    status: "Running",
    restarts: 0,
    cpuMillicores: 132,
    memoryMiB: 114,
    nodePort: 30080,
    nodeName: "k8s-worker-node-02",
    age: "4d 11h",
  },
  {
    id: "wk-03",
    podName: "cloudpulse-deployment-7d9f8b6c4-v2m9q",
    namespace: "production",
    image: "cloudpulse:1.0.0",
    status: "Running",
    restarts: 1,
    cpuMillicores: 168,
    memoryMiB: 126,
    nodePort: 30080,
    nodeName: "k8s-worker-node-01",
    age: "4d 11h",
  },
  {
    id: "wk-04",
    podName: "redis-state-cache-6b8c4f5d9-r7t3w",
    namespace: "production",
    image: "redis:7.4-alpine",
    status: "Running",
    restarts: 0,
    cpuMillicores: 85,
    memoryMiB: 64,
    nodePort: 30379,
    nodeName: "k8s-worker-node-02",
    age: "12d 04h",
  },
  {
    id: "wk-05",
    podName: "otel-collector-daemon-5f7a9c2b1-j8k4z",
    namespace: "monitoring",
    image: "otel/opentelemetry-collector:0.114.0",
    status: "Running",
    restarts: 0,
    cpuMillicores: 210,
    memoryMiB: 192,
    nodePort: 30417,
    nodeName: "k8s-worker-node-01",
    age: "9d 18h",
  },
  {
    id: "wk-06",
    podName: "postgres-read-replica-8c4d2e1f3-m5n6p",
    namespace: "database",
    image: "postgres:16.6-alpine",
    status: "Degraded",
    restarts: 3,
    cpuMillicores: 420,
    memoryMiB: 248,
    nodePort: 30543,
    nodeName: "k8s-worker-node-02",
    age: "2d 07h",
  },
];

export const TELEMETRY_SERIES = [
  { time: "18:00", cpuMillicores: 640, memoryMiB: 790 },
  { time: "18:05", cpuMillicores: 710, memoryMiB: 815 },
  { time: "18:10", cpuMillicores: 695, memoryMiB: 805 },
  { time: "18:15", cpuMillicores: 880, memoryMiB: 845 },
  { time: "18:20", cpuMillicores: 920, memoryMiB: 860 },
  { time: "18:25", cpuMillicores: 810, memoryMiB: 830 },
  { time: "18:30", cpuMillicores: 1160, memoryMiB: 862 },
];
