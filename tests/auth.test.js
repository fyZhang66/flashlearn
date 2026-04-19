import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import request from "supertest";

import app from "../server.js";
import { initSchema, resetTables, teardown } from "./helpers.js";

beforeAll(async () => {
  await initSchema();
});
beforeEach(async () => {
  await resetTables();
});
afterAll(async () => {
  await teardown();
});

describe("auth", () => {
  it("registers a user", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ username: "alice", password: "hunter2" });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("alice");
  });

  it("rejects duplicate registration", async () => {
    await request(app)
      .post("/api/register")
      .send({ username: "alice", password: "hunter2" });

    const res = await request(app)
      .post("/api/register")
      .send({ username: "alice", password: "hunter2" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("username-already-exists");
  });

  it("rejects short password", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ username: "alice", password: "abc" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("required-password");
  });

  it("logs in with correct password", async () => {
    await request(app)
      .post("/api/register")
      .send({ username: "alice", password: "hunter2" });

    const res = await request(app)
      .post("/api/session")
      .send({ username: "alice", password: "hunter2" });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("alice");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^sid=/);
  });

  it("rejects login with wrong password", async () => {
    await request(app)
      .post("/api/register")
      .send({ username: "alice", password: "hunter2" });

    const res = await request(app)
      .post("/api/session")
      .send({ username: "alice", password: "wrong!" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("bad-password");
  });

  it("rejects login for unknown user", async () => {
    const res = await request(app)
      .post("/api/session")
      .send({ username: "bob", password: "whatever" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("user-not-registered");
  });

  it("returns the session on GET after login", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/register")
      .send({ username: "alice", password: "hunter2" });
    await agent
      .post("/api/session")
      .send({ username: "alice", password: "hunter2" });

    const res = await agent.get("/api/session");
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("alice");
  });

  it("logout clears the session", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/register")
      .send({ username: "alice", password: "hunter2" });
    await agent
      .post("/api/session")
      .send({ username: "alice", password: "hunter2" });

    const del = await agent.delete("/api/session");
    expect(del.status).toBe(200);
    expect(del.body.wasLoggedIn).toBe(true);

    const after = await agent.get("/api/session");
    expect(after.status).toBe(401);
  });
});
