import request from "supertest";
import { createApp } from "../src/app.js";

describe("app", () => {
  it("returns 404 for unknown route", async () => {
    const app = createApp();
    const res = await request(app).get("/not-real");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Route not found");
  });
});
