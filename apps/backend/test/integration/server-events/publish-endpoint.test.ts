import { expect } from "chai";

import { serverEventRoutes } from "../../../src/routes/server-events.js";
import { buildTestApp } from "../../support/fastify-harness.js";

describe("server events publish endpoint", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("requires a channel when publishing a server event", async () => {
    const app = await buildTestApp(async (testApp) => {
      await testApp.register(serverEventRoutes, { prefix: "/api/server-events" });
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/server-events",
        payload: {
          message: "Missing channel",
        },
      });

      expect(response.statusCode).to.equal(400);
      expect(response.json()).to.deep.equal({ error: "channel is required" });
    } finally {
      await app.close();
    }
  });

  it("requires a resource when publishing a server event", async () => {
    const app = await buildTestApp(async (testApp) => {
      await testApp.register(serverEventRoutes, { prefix: "/api/server-events" });
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/server-events",
        payload: {
          channel: "storefront",
          action: "created",
        },
      });

      expect(response.statusCode).to.equal(400);
      expect(response.json()).to.deep.equal({ error: "resource is required" });
    } finally {
      await app.close();
    }
  });

  it("requires an action when publishing a server event", async () => {
    const app = await buildTestApp(async (testApp) => {
      await testApp.register(serverEventRoutes, { prefix: "/api/server-events" });
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/server-events",
        payload: {
          channel: "storefront",
          resource: "server_event_test",
        },
      });

      expect(response.statusCode).to.equal(400);
      expect(response.json()).to.deep.equal({ error: "action is required" });
    } finally {
      await app.close();
    }
  });

  it("publishes an explicit server event envelope", async () => {
    const app = await buildTestApp(async (testApp) => {
      await testApp.register(serverEventRoutes, { prefix: "/api/server-events" });
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/server-events",
        payload: {
          action: "created",
          channel: "storefront",
          level: "success",
          message: "Hello storefront",
          resource: "server_event_test",
          resourceId: "test-123",
        },
      });

      const body = response.json();

      expect(response.statusCode).to.equal(202);
      expect(body.event).to.include({
        action: "created",
        channel: "storefront",
        level: "success",
        message: "Hello storefront",
        resource: "server_event_test",
        resourceId: "test-123",
      });
      expect(body.event).to.not.have.property("payload");
      expect(body.event.id).to.be.a("string").and.not.equal("");
      expect(Date.parse(body.event.timestamp)).to.not.equal(Number.NaN);
    } finally {
      await app.close();
    }
  });

  it("does not expose the publish endpoint in production", async () => {
    process.env.NODE_ENV = "production";

    const app = await buildTestApp(async (testApp) => {
      await testApp.register(serverEventRoutes, { prefix: "/api/server-events" });
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/server-events",
        payload: {
          action: "created",
          channel: "storefront",
          message: "Production publish attempt",
          resource: "server_event_test",
        },
      });

      expect(response.statusCode).to.equal(404);
      expect(response.json()).to.deep.equal({ error: "Not found" });
    } finally {
      await app.close();
    }
  });
});
