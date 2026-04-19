import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";

import app from "../server.js";
import { initSchema, teardown } from "./helpers.js";

beforeAll(async () => {
  await initSchema();
});
afterAll(async () => {
  await teardown();
});

describe("probes and metrics", () => {
  it("/livez returns ok", async () => {
    const res = await request(app).get("/livez");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("/readyz returns ready when db is up", async () => {
    const res = await request(app).get("/readyz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
  });

  it("/metrics exposes Prometheus text", async () => {
    // Warm one request so http_requests_total has data.
    await request(app).get("/livez");
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("http_requests_total");
    expect(res.text).toContain("process_cpu_seconds_total");
  });
});
