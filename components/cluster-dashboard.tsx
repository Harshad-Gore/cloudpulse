"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Server,
  Boxes,
  Activity,
  Plus,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { INITIAL_WORKLOADS, TELEMETRY_SERIES, type WorkloadItem } from "@/lib/workloads-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

const deployWorkloadSchema = z.object({
  podName: z
    .string()
    .min(1, "Enter a pod identifier")
    .max(63, "Pod identifier must be at most 63 characters")
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "Use lowercase letters, digits or hyphens; start and end with a letter or digit"),
  namespace: z.enum(["production", "monitoring", "database"]),
  image: z
    .string()
    .min(3, "Specify a valid image tag (e.g., nginx:1.27-alpine)")
    .regex(/^(?:[a-z0-9.-]+(?::[0-9]+)?\/)?[a-z0-9._/-]+:[a-z0-9_][a-z0-9._-]{0,127}$/i, "Include an explicit version tag (name:tag)"),
  cpuMillicores: z
    .number()
    .int("CPU must be a whole number of millicores")
    .min(50, "Minimum allocation is 50m CPU")
    .max(2000, "Maximum allocation per pod is 2000m CPU"),
  memoryMiB: z
    .number()
    .int("Memory must be a whole number of MiB")
    .min(64, "Minimum allocation is 64 MiB")
    .max(4096, "Maximum allocation is 4096 MiB"),
  nodePort: z
    .number()
    .int("NodePort must be a whole number")
    .min(30000, "Kubernetes NodePort must be between 30000 and 32767")
    .max(32767, "Kubernetes NodePort must be between 30000 and 32767"),
});

type DeployWorkloadValues = z.infer<typeof deployWorkloadSchema>;

export function ClusterDashboard({ servingHostname, clusterName, namespace }: { servingHostname: string; clusterName: string; namespace: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [activeNav, setActiveNav] = React.useState<"workloads" | "services" | "manifests">("workloads");
  const [workloads, setWorkloads] = React.useState<WorkloadItem[]>(INITIAL_WORKLOADS);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [showColumnMenu, setShowColumnMenu] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const form = useForm<DeployWorkloadValues>({
    resolver: zodResolver(deployWorkloadSchema),
    mode: "onBlur",
    defaultValues: {
      podName: "cloudpulse-worker-8f4a2d",
      namespace: "production",
      image: "cloudpulse:1.0.0",
      cpuMillicores: 150,
      memoryMiB: 128,
      nodePort: 30080,
    },
  });

  function onDeploySubmit(values: DeployWorkloadValues) {
    if (workloads.some((pod) => pod.podName === values.podName && pod.namespace === values.namespace)) {
      form.setError("podName", { message: "This pod identifier already exists in this namespace" });
      return;
    }
    const newPod: WorkloadItem = {
      id: `${values.namespace}/${values.podName}`,
      podName: values.podName,
      namespace: values.namespace,
      image: values.image,
      status: "Running",
      restarts: 0,
      cpuMillicores: values.cpuMillicores,
      memoryMiB: values.memoryMiB,
      nodePort: values.nodePort,
      nodeName: "k8s-worker-node-01",
      age: "1m",
    };
    setWorkloads((prev) => [newPod, ...prev]);
    setDialogOpen(false);
    form.reset();
    setGlobalFilter("");
    toast.success(`Added demo pod ${values.podName} to ${values.namespace}`);
  }

  function handleRestartPod(id: string) {
    setWorkloads((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: "Running", restarts: w.restarts + 1, age: "1m" }
          : w
      )
    );
    toast.success("Simulated pod restart");
  }

  const columns = React.useMemo<ColumnDef<WorkloadItem>[]>(
    () => [
      {
        accessorKey: "podName",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
          >
            Pod Name
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-foreground">
            {row.getValue("podName")}
          </span>
        ),
      },
      {
        accessorKey: "namespace",
        header: "Namespace",
        cell: ({ row }) => (
          <span className="rounded-[4px] bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
            {row.getValue("namespace")}
          </span>
        ),
      },
      {
        accessorKey: "image",
        header: "Container Image",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.getValue("image")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as WorkloadItem["status"];
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              {status === "Running" && (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span className="text-foreground">Running</span>
                </>
              )}
              {status === "Degraded" && (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-destructive">Degraded</span>
                </>
              )}
              {status === "Pending" && (
                <>
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  <span className="text-warning">Pending</span>
                </>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "cpuMillicores",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
          >
            CPU (m)
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.getValue("cpuMillicores")}m</span>
        ),
      },
      {
        accessorKey: "memoryMiB",
        header: "Memory",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.getValue("memoryMiB")} MiB</span>
        ),
      },
      {
        accessorKey: "nodePort",
        header: "NodePort",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.getValue("nodePort")}</span>
        ),
      },
      {
        accessorKey: "restarts",
        header: "Restarts",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.getValue("restarts")}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRestartPod(row.original.id)}
            >
              <RefreshCw className="h-3 w-3" />
              Simulate restart
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: workloads,
    getRowId: (row) => row.id,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  const runningCount = workloads.filter((w) => w.status === "Running").length;
  const totalCpu = workloads.reduce((acc, w) => acc + w.cpuMillicores, 0);
  const totalMem = workloads.reduce((acc, w) => acc + w.memoryMiB, 0);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* Compact Collapsible Sidebar */}
      <aside
        className={`flex shrink-0 flex-col border-r border-border bg-surface transition-all duration-150 motion-reduce:transition-none ${
          sidebarCollapsed ? "w-full md:w-14" : "w-full md:w-56"
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-border px-3">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold tracking-tight">CloudPulse</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label="Toggle navigation sidebar"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex flex-1 gap-1 p-2 md:flex-col" aria-label="Cluster navigation">
          <button
            type="button"
            onClick={() => setActiveNav("workloads")}
            aria-label="Pod Workloads"
            aria-current={activeNav === "workloads" ? "page" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[13px] font-medium transition-colors duration-150 ${
              activeNav === "workloads"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Server className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Pod Workloads</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveNav("services")}
            aria-label="Service Endpoints"
            aria-current={activeNav === "services" ? "page" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[13px] font-medium transition-colors duration-150 ${
              activeNav === "services"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Activity className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Service Endpoints</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveNav("manifests")}
            aria-label="Runtime Diagnostics"
            aria-current={activeNav === "manifests" ? "page" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[13px] font-medium transition-colors duration-150 ${
              activeNav === "manifests"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Terminal className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Runtime Diagnostics</span>}
          </button>
        </nav>

        <div className="border-t border-border p-3">
          {!sidebarCollapsed ? (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Serving Container Hostname</div>
              <div className="truncate font-mono text-xs font-medium text-foreground">
                {servingHostname}
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`Pod: ${servingHostname}`}>
              <span className="h-2 w-2 rounded-full bg-success" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact Top Bar */}
        <header className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-3 py-2 sm:px-5">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold">{activeNav === "workloads" ? "Pod Workloads" : activeNav === "services" ? "Service Endpoints" : "Runtime Diagnostics"}</h1>
            <span className="hidden rounded-full border border-border bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline">
              {clusterName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle color theme"
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  Add demo pod
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add demo pod</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">Simulates a workload in this browser session. Reloading resets the sample data. Use kubectl to deploy real pods.</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit(onDeploySubmit)}
                  className="space-y-3.5 pt-2"
                  noValidate
                >
                  <div className="space-y-1">
                    <label htmlFor="podName" className="block text-xs font-medium text-foreground">
                      Pod identifier
                    </label>
                    <Input id="podName" {...form.register("podName")} />
                    {form.formState.errors.podName && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {form.formState.errors.podName.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="namespace"
                        className="block text-xs font-medium text-foreground"
                      >
                        Namespace
                      </label>
                      <select
                        id="namespace"
                        {...form.register("namespace")}
                        className="flex h-8 w-full rounded-[6px] border border-border bg-surface px-2.5 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        <option value="production">production</option>
                        <option value="monitoring">monitoring</option>
                        <option value="database">database</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="nodePort"
                        className="block text-xs font-medium text-foreground"
                      >
                        Service NodePort
                      </label>
                      <Input id="nodePort" type="number" {...form.register("nodePort", { valueAsNumber: true })} />
                      {form.formState.errors.nodePort && (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {form.formState.errors.nodePort.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="image" className="block text-xs font-medium text-foreground">
                      Container image tag
                    </label>
                    <Input id="image" {...form.register("image")} />
                    {form.formState.errors.image && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {form.formState.errors.image.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="cpuMillicores"
                        className="block text-xs font-medium text-foreground"
                      >
                        CPU request (millicores)
                      </label>
                      <Input
                        id="cpuMillicores"
                        type="number"
                        {...form.register("cpuMillicores", { valueAsNumber: true })}
                      />
                      {form.formState.errors.cpuMillicores && (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {form.formState.errors.cpuMillicores.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="memoryMiB"
                        className="block text-xs font-medium text-foreground"
                      >
                        Memory request (MiB)
                      </label>
                      <Input id="memoryMiB" type="number" {...form.register("memoryMiB", { valueAsNumber: true })} />
                      {form.formState.errors.memoryMiB && (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {form.formState.errors.memoryMiB.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add demo pod</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="min-w-0 flex-1 space-y-4 p-3 sm:p-5">
          <p className="text-xs text-muted-foreground">Demo mode: inventory, metrics and pod actions are simulated. The serving hostname and health API come from the running application.</p>
          {activeNav === "services" && (
            <Card>
              <CardHeader><CardTitle>Application service</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>Configured service: <code>cloudpulse-service</code> · NodePort <code>30080 → 80 → 3000</code></p>
                <p>Verify the deployed service with <code>kubectl get service cloudpulse-service</code>.</p>
                <p className="flex flex-wrap gap-4"><a className="text-primary underline" href="/api/health" target="_blank" rel="noreferrer">Open health endpoint</a><a className="text-primary underline" href="/api/workloads" target="_blank" rel="noreferrer">Open sample inventory API</a></p>
              </CardContent>
            </Card>
          )}
          {activeNav === "manifests" && (
            <Card>
              <CardHeader><CardTitle>Serving application</CardTitle></CardHeader>
              <CardContent className="space-y-3 break-words text-sm">
                <p>Hostname: <code>{servingHostname}</code></p>
                <p>Cluster label: <code>{clusterName}</code></p>
                <p>Namespace: <code>{namespace}</code></p>
                <a className="text-primary underline" href="/api/health" target="_blank" rel="noreferrer">Inspect runtime health and uptime</a>
                <p>For actual pod status, run <code>kubectl get pods -l app=cloudpulse -o wide</code>.</p>
              </CardContent>
            </Card>
          )}
          {activeNav === "workloads" && <>
          {/* Asymmetric 4-Column KPI Strip (varied hierarchy: primary readiness card + 3 secondary metrics) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
            <Card className="border-l-4 border-l-primary lg:col-span-4">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Active Pod Replicas</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-2xl font-semibold">
                    {runningCount} / {workloads.length}
                  </span>
                  <span className="text-xs font-medium text-success">
                    {Math.round((runningCount / workloads.length) * 100)}% running
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Cluster CPU Allocation</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-xl font-semibold">{totalCpu}m</span>
                  <span className="text-xs text-muted-foreground">of 4000m quota</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Memory Footprint</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-xl font-semibold">{totalMem} MiB</span>
                  <span className="text-xs text-muted-foreground">sample allocation</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Exposed NodePort</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-mono text-xl font-semibold">30080</span>
                  <span className="font-mono text-xs text-success">TCP/80</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Asymmetric 60 / 40 Split: Cluster CPU/Memory Telemetry Chart + Container Runtime Metadata */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Cluster CPU Consumption (millicores)</CardTitle>
                <span className="font-mono text-xs text-muted-foreground">
                  Sample 30m window
                </span>
              </CardHeader>
              <CardContent>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TELEMETRY_SERIES} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <XAxis
                        dataKey="time"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "currentColor" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "currentColor" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-surface)",
                          borderColor: "var(--color-border)",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cpuMillicores"
                        stroke="var(--color-primary)"
                        fill="var(--color-primary)"
                        fillOpacity={0.14}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader className="pb-2">
                <CardTitle>Container & Kubernetes Runtime Spec</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-[13px]">
                <div className="flex items-center justify-between border-b border-border py-1.5">
                  <span className="text-muted-foreground">Serving Pod Hostname</span>
                  <span className="min-w-0 break-all font-mono text-xs font-medium">{servingHostname}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-1.5">
                  <span className="text-muted-foreground">Container Base Image</span>
                  <span className="font-mono text-xs">node:22-alpine (multi-stage)</span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-1.5">
                  <span className="text-muted-foreground">Kubernetes Deployment</span>
                  <span className="font-mono text-xs">cloudpulse-deployment (3 replicas)</span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-1.5">
                  <span className="text-muted-foreground">Kubernetes Service</span>
                  <span className="font-mono text-xs">NodePort 80:30080/TCP</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Health Probe Endpoint</span>
                  <a className="font-mono text-xs text-primary underline" href="/api/health">GET /api/health</a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TanStack Table for Pod Inventory */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Pod Inventory</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Filter pods by name or image..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="min-w-0 flex-1 sm:w-60"
                  aria-label="Filter pods by name or image"
                />
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowColumnMenu((prev) => !prev)}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Columns
                  </Button>
                  {showColumnMenu && (
                    <div className="absolute right-0 top-9 z-40 w-44 rounded-[6px] border border-border bg-surface p-2 shadow-md">
                      {table
                        .getAllLeafColumns()
                        .filter((col) => col.getCanHide() && col.id !== "actions")
                        .map((col) => (
                          <label
                            key={col.id}
                            className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1 text-xs hover:bg-muted"
                          >
                            <input
                              type="checkbox"
                              checked={col.getIsVisible()}
                              onChange={col.getToggleVisibilityHandler()}
                              className="rounded border-border"
                            />
                            <span className="capitalize">{col.id}</span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            No pods match the current filter — clear the search query or add a demo pod.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setGlobalFilter("")}
                          >
                            Reset filter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Compact Pagination Bar */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                <span>
                  Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} matching pods
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </>}
        </main>
      </div>
    </div>
  );
}

