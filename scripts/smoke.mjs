import assert from "node:assert/strict";

const base = process.env.BASE_URL || "http://localhost:3000";
const healthResponse = await fetch(`${base}/api/health`);
assert.equal(healthResponse.status, 200);
assert.equal(healthResponse.headers.get("cache-control"), "no-store");
const health = await healthResponse.json();
assert.equal(health.status, "healthy");
assert.ok(health.podHostname);
assert.notEqual(health.podHostname, "0.0.0.0", "Report the serving host, not the bind address");
assert.ok(Number.isFinite(health.uptimeSeconds));
assert.ok(Number.isFinite(Date.parse(health.timestamp)));

const inventoryResponse = await fetch(`${base}/api/workloads`);
assert.equal(inventoryResponse.status, 200);
const inventory = await inventoryResponse.json();
assert.equal(inventory.mode, "demo");
assert.equal(inventory.totalPods, inventory.workloads.length);
assert.equal(inventory.clusterName, health.clusterName);
assert.equal(inventory.namespace, health.namespace);

const page = await fetch(base);
assert.equal(page.status, 200);
const html = await page.text();
assert.ok(html.includes("Pod Workloads"));
assert.ok(html.includes("Demo mode"));
console.log(`Smoke checks passed: ${base} (serving host: ${health.podHostname})`);
