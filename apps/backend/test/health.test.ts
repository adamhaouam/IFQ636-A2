import { expect } from "chai";

import { healthRoutes } from "../src/routes/health.js";
import { buildTestApp } from "./support/fastify-harness.js";

describe("healthRoutes", () => {
  it("returns ok status", async () => {
    const app = await buildTestApp(async (testApp) => {
      await testApp.register(healthRoutes, { prefix: "/health" });
    });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).to.equal(200);
      expect(response.json()).to.deep.equal({ status: "ok" });
    } finally {
      await app.close();
    }
  });
});
