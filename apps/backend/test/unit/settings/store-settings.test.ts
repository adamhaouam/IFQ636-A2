import { expect } from "chai";

import { StoreSettings } from "../../../src/modules/settings/store-settings.js";

describe("StoreSettings", () => {
  afterEach(() => {
    StoreSettings.resetForTesting();
  });

  it("returns one shared Singleton instance", () => {
    expect(StoreSettings.getInstance()).to.equal(StoreSettings.getInstance());
  });

  it("can reset the Singleton instance for isolated tests", () => {
    const first = StoreSettings.getInstance();

    StoreSettings.resetForTesting();

    expect(StoreSettings.getInstance()).to.not.equal(first);
  });

  it("validates updates before saving", async () => {
    const settings = StoreSettings.getInstance();

    try {
      await settings.updateSettings({ productBrowsingPageSize: 0 });
      throw new Error("Expected validation to fail");
    } catch (error) {
      expect((error as Error).message).to.equal(
        "Product browsing page size must be between 1 and 100",
      );
    }
  });
});
