import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import request from "supertest";

import app from "../server.js";
import { initSchema, resetTables, teardown } from "./helpers.js";

async function loginAgent() {
  const agent = request.agent(app);
  await agent
    .post("/api/register")
    .send({ username: "alice", password: "hunter2" });
  await agent
    .post("/api/session")
    .send({ username: "alice", password: "hunter2" });
  return agent;
}

beforeAll(async () => {
  await initSchema();
});
beforeEach(async () => {
  await resetTables();
});
afterAll(async () => {
  await teardown();
});

describe("cards", () => {
  it("requires auth", async () => {
    const res = await request(app).get("/api/cards");
    expect(res.status).toBe(401);
  });

  it("creates, lists, and deletes a card", async () => {
    const agent = await loginAgent();

    const create = await agent
      .post("/api/card")
      .send({ front: "2+2", explain: "4" });
    expect(create.status).toBe(200);
    const { cardId } = create.body;
    expect(cardId).toBeTruthy();

    const list = await agent.get("/api/cards");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const del = await agent.delete(`/api/card/${cardId}`);
    expect(del.status).toBe(200);

    const empty = await agent.get("/api/cards");
    expect(empty.body).toHaveLength(0);
  });

  it("reports stats", async () => {
    const agent = await loginAgent();
    await agent.post("/api/card").send({ front: "a", explain: "1" });
    await agent.post("/api/card").send({ front: "b", explain: "2" });

    const res = await agent.get("/api/cards/stats");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.unlearned).toBe(2);
    expect(res.body.due).toBe(2);
  });

  it("hard review sets a 5-minute interval", async () => {
    const agent = await loginAgent();
    const created = await agent
      .post("/api/card")
      .send({ front: "x", explain: "y" });

    const review = await agent
      .post(`/api/card/${created.body.cardId}/review`)
      .send({ reviewOption: "hard" });

    expect(review.status).toBe(200);
    expect(review.body.updatedCard.expireMs).toBe(5 * 60 * 1000);
    expect(review.body.updatedCard.lastReviewed).toBeTruthy();
  });

  it("users can only see their own cards", async () => {
    const alice = await loginAgent();
    await alice.post("/api/card").send({ front: "secret", explain: "shhh" });

    const bob = request.agent(app);
    await bob
      .post("/api/register")
      .send({ username: "bob", password: "hunter2" });
    await bob
      .post("/api/session")
      .send({ username: "bob", password: "hunter2" });

    const list = await bob.get("/api/cards");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(0);
  });

  it("next returns done when empty", async () => {
    const agent = await loginAgent();
    const res = await agent.get("/api/cards/next");
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });
});
