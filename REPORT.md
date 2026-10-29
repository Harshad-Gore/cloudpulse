# Technical Report — CloudPulse

## Objective
Containerize a web application using Docker, deploy it using a Kubernetes Deployment and Service, and demonstrate the running application.

## Application and implementation
CloudPulse uses Next.js, React and TypeScript. The dashboard displays simulated workload data and supports local demo actions. Its `/api/health` endpoint reports the actual server hostname, uptime and application version. Kubernetes deployment is performed with kubectl, independently of dashboard actions.

The multi-stage Dockerfile installs locked dependencies, builds standalone output, and runs the app as a non-root user. The Kubernetes Deployment defines three replicas, resource requests/limits, readiness and liveness probes. A NodePort Service exposes the app using matching labels.

## Environment — complete after running
- Operating system: Windows host; Linux containers
- Docker Desktop / engine version: 4.97.0 / 29.9.2
- Kubernetes version / provisioner: 1.36.1 / Kind, three ready nodes (one control plane and two workers)
- GitHub repository URL:
- Demonstration video URL:

## Execution results — record your actual observations

Verified during project repair on 29 October 2026: TypeScript checks, ESLint and production build passed. Dependency audit reported zero vulnerabilities. Image `cloudpulse:1.0.0` built successfully; container `cloudpulse-app` served on port 3000, became healthy and ran as UID 1001. API smoke checks passed against the container and reported hostname `f19cd752feff`. Chrome checks passed at desktop (1440 × 1050) and mobile (390 × 844), covering filtering, pagination, sorting, columns, navigation, themes, validation, adding demo pods, duplicate prevention and simulated restarts, with no browser console errors. Kubernetes deployment subsequently rolled out successfully: all three replicas were available, all pods were Running and Ready (1/1) with zero restarts, and the Service had three endpoints. API and browser checks also passed through the Service at http://localhost:8080 using kubectl port-forward. Direct localhost:30080 access was unavailable in this Kind networking setup; port-forward access was verified.
| Step | Command / action | Observed result | Evidence filename |
| --- | --- | --- | --- |
| Build image | docker build -t cloudpulse:1.0.0 . | Built successfully | Capture terminal during your recording |
| Run container | docker run -d --name cloudpulse-app -p 3000:3000 cloudpulse:1.0.0 | Running and healthy; UID 1001 | Capture Docker Desktop / terminal |
| Health check | GET /api/health | HTTP 200, healthy, actual container/pod hostname | Capture browser response |
| Deploy | kubectl apply -f deployment.yaml -f service.yaml | Created; rollout succeeded, 3/3 available | Capture terminal |
| Pods | kubectl get pods -l app=cloudpulse -o wide | Three pods Running, 1/1 Ready, zero restarts | Capture terminal |
| Service | kubectl get service cloudpulse-service | NodePort 80:30080/TCP; three ready endpoints | Capture terminal |
| Browser access | Port-forward service to localhost:8080 | Page and APIs accessible; browser checks passed | Capture browser with URL |

Use the intended cluster context explicitly, as shown in README.md. Include screenshots showing real command output and the browser URL.

## Concepts
An image packages an application and its dependencies. A container runs an instance of an image. Kubernetes manages containers in pods, reconciles desired replicas through controllers, schedules pods onto nodes, and exposes ready pods through Services. The API server accepts requests, etcd stores state, and each node's kubelet coordinates with its container runtime.

## Conclusion — complete after running
State whether the image built, the container served requests, three replicas became ready, and the service was accessible. Record any failures and their resolution. Attach your screenshots and video; do not claim unexecuted checks passed.

