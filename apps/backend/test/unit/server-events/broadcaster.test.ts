import { expect } from "chai";

import { ServerEventBroadcaster } from "../../../src/server-events/broadcaster.js";

describe("ServerEventBroadcaster", () => {
  describe("create", () => {
    it("creates an envelope with generated metadata", () => {
      const broadcaster = new ServerEventBroadcaster();

      const event = broadcaster.create({
        action: "created",
        channel: "storefront",
        level: "info",
        message: "Server event test",
        resource: "server_event_test",
        resourceId: "test-123",
      });

      expect(event).to.include({
        action: "created",
        channel: "storefront",
        level: "info",
        message: "Server event test",
        resource: "server_event_test",
        resourceId: "test-123",
      });
      expect(event.id).to.be.a("string").and.not.equal("");
      expect(Date.parse(event.timestamp)).to.not.equal(Number.NaN);
    });
  });
});
