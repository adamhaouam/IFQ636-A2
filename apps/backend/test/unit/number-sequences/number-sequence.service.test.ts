import { expect } from "chai";

import {
  NumberSequenceService,
  type NumberSequenceStore,
} from "../../../src/modules/number-sequences/index.js";

class StubNumberSequenceStore implements NumberSequenceStore {
  readonly requestedNames: string[] = [];
  private readonly values = new Map<string, number>();

  async nextValue(name: string) {
    this.requestedNames.push(name);

    const next = (this.values.get(name) ?? 0) + 1;
    this.values.set(name, next);

    return next;
  }
}

describe("NumberSequenceService", () => {
  it("increments separate named number sequences independently", async () => {
    const service = new NumberSequenceService(new StubNumberSequenceStore());

    expect(await service.nextValue("orders")).to.equal(1);
    expect(await service.nextValue("orders")).to.equal(2);
    expect(await service.nextValue("memberships")).to.equal(1);
  });

  it("normalizes number sequence names before incrementing", async () => {
    const store = new StubNumberSequenceStore();
    const service = new NumberSequenceService(store);

    expect(await service.nextValue("  orders  ")).to.equal(1);
    expect(store.requestedNames).to.deep.equal(["orders"]);
  });

  it("requires a number sequence name", async () => {
    const service = new NumberSequenceService(new StubNumberSequenceStore());

    expect(() => service.nextValue("   ")).to.throw(
      "Number sequence name is required",
    );
  });
});
