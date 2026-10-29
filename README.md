# CloudPulse — Docker and Kubernetes Assignment

A Next.js + TypeScript application for demonstrating containerization and Kubernetes deployment. The dashboard uses **sample workloads and telemetry**. Adding or restarting a demo pod changes only browser memory and resets on reload; it does not call Kubernetes. `/api/health` reports the real serving process and hostname.

## Run locally and resolve editor errors

Install Node.js 22 or newer. Open a terminal in this folder:

```powershell
npm ci
npm run typecheck
npm run lint
npm run dev
```

Open http://localhost:3000. Run `npm test` in another terminal while the app is running to check the page and APIs. Missing dependencies cause red underlines on imports and JSX. After installation, reopen the editor if its TypeScript errors remain stale. `next-env.d.ts` supplies Next.js types. For a production check, stop the dev server, then run `npm run build` and `npm start`. Docker sets `BUILD_STANDALONE=true` to produce its minimal runtime bundle; ordinary Windows builds do not require symlink privileges. Fonts and their licenses are bundled in `public/fonts` so builds do not need Google Fonts access.

## Part A — Docker

Start Docker Desktop and wait for its engine to run in Linux container mode. After a new installation, reopen the terminal so `docker` is on PATH. Confirm `docker version` shows both Client and Server.

```powershell
docker build -t cloudpulse:1.0.0 .
docker image ls cloudpulse
docker run -d --name cloudpulse-app -p 3000:3000 cloudpulse:1.0.0
docker ps
docker logs cloudpulse-app
curl.exe http://localhost:3000/api/health
```

Stop a locally running Next.js server before using port 3000. Open http://localhost:3000 and capture the dashboard, image list, running container and health response. A reused container name must be removed or replaced with a new name.

The Dockerfile installs locked dependencies with `npm ci`, builds Next.js, and runs its standalone output as a non-root user on Node 22 Alpine. Only the built application and required runtime dependencies reach the final stage. The health check calls `/api/health`.

An **image** is the packaged application and dependencies; a **container** is a running instance of that image with its own process environment and writable layer. Port mapping `3000:3000` connects a host port to the container port.

## Part B — Kubernetes

In Docker Desktop, create/enable a Kubernetes cluster and wait until it is ready. For this exercise, a single-node kubeadm cluster is sufficient. Verify the current context before applying resources:

```powershell
kubectl config get-contexts
kubectl --context docker-desktop get nodes
```

The image must be available to the cluster. Docker Desktop's image-store/provisioner settings affect local image availability. With a separately created Kind cluster, run `kind load docker-image cloudpulse:1.0.0`; with Minikube, run `minikube image load cloudpulse:1.0.0`. If Docker Desktop pods show `ImagePullBackOff`, inspect events and ensure the cluster can access the image; use a registry image if necessary.

The following commands target Docker Desktop explicitly:

```powershell
kubectl --context docker-desktop apply -f deployment.yaml -f service.yaml
kubectl --context docker-desktop rollout status deployment/cloudpulse-deployment --timeout=180s
kubectl --context docker-desktop get deployment cloudpulse-deployment
kubectl --context docker-desktop get pods -l app=cloudpulse -o wide
kubectl --context docker-desktop get service cloudpulse-service
kubectl --context docker-desktop get endpointslices -l kubernetes.io/service-name=cloudpulse-service
kubectl --context docker-desktop port-forward svc/cloudpulse-service 8080:80
```

Keep port-forward running and open http://localhost:8080 and http://localhost:8080/api/health. The port-forward provides a reliable local access route. NodePort access, when supported by the local networking setup, is http://localhost:30080.

The Deployment requests **3 replicas**, each serving on container port **3000**. The Service selects `app: cloudpulse` and maps **NodePort 30080 → Service port 80 → container port 3000**. Readiness controls whether a pod receives traffic; liveness can restart an unhealthy container. CPU/memory requests inform scheduling and limits bound usage. `POD_NAME` comes from Kubernetes metadata, independently of the standalone server's `HOSTNAME=0.0.0.0` bind address.

Root manifests are the submission files; `k8s/` contains identical copies. Apply one set only and keep both synchronized if editing.

### Architecture to explain in the recording

- The API server accepts `kubectl` requests; etcd stores cluster state.
- The scheduler assigns pods to nodes. Controllers reconcile desired state, including the Deployment's replica count.
- Each worker's kubelet asks its container runtime to run containers and checks health.
- Pods contain application containers. A Service gives selected ready pods a stable network endpoint.
- A single-node development cluster combines control-plane and worker responsibilities on one machine.

### Troubleshooting

- `docker` or `kubectl` not recognized: reopen the terminal. Per-user Docker Desktop binaries are under `%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin`.
- Docker pipe/daemon error: start Docker Desktop and complete any first-run requirements.
- No Kubernetes context: create/enable the cluster in Docker Desktop first.
- `ImagePullBackOff`: check `kubectl describe pod <pod-name>` and make the exact image/tag available to the cluster.
- `Pending`: check node capacity and events with `kubectl describe pod <pod-name>`.
- Port already in use: stop the process using it or choose a different host port.

## Submission and recording checklist

Submit the GitHub repository URL, `Dockerfile`, `deployment.yaml`, `service.yaml`, screenshots of actual commands/results, a recording and a short technical report. Do not use simulated dashboard rows as evidence of real pods.

Suggested recording order:

1. Show the repository and explain the app and sample-data limitation.
2. Explain the Dockerfile stages, build the image, run the container, and open the app and health endpoint.
3. Explain image versus container and host/container ports.
4. Explain the Deployment selector, replicas, resources, probes, and Service port mapping.
5. Apply the manifests, show three ready pods and the Service, then open the service through port-forward.
6. Explain the control plane, nodes, kubelet, runtime, pods and Services.
7. Show the repository URL and summarize your observed results.

Use [REPORT.md](REPORT.md) to write the report with your own execution results. Git is not initialized automatically; create your repository and push these source files after reviewing them. `.gitignore` excludes installed packages, build output and local environment files.

## References

- [Docker Desktop Kubernetes setup](https://docs.docker.com/desktop/use-desktop/kubernetes/)
- [Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/)
- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
