import { expect } from "chai";

import { OrderNumberService } from "../../../src/modules/orders/order-number.service.js";

class StubNumberSequenceService {
  private value = 0;
  readonly requestedNames: string[] = [];

  async nextValue(name: string) {
    this.requestedNames.push(name);
    this.value += 1;

    return this.value;
  }
}

class StubOrderNumberSettings {
  constructor(private readonly format: "sequential" | "date_prefixed") {}

  async getOrderNumberFormat() {
    return this.format;
  }
}

describe("OrderNumberService", () => {
  it("uses the configured sequential strategy", async () => {
    const service = new OrderNumberService(
      new StubNumberSequenceService(),
      new StubOrderNumberSettings("sequential"),
      () => new Date("2026-06-20T00:00:00.000Z"),
    );

    expect(await service.generateNext()).to.equal("ORD-000001");
    expect(await service.generateNext()).to.equal("ORD-000002");
  });

  it("uses the configured date-prefixed strategy", async () => {
    const service = new OrderNumberService(
      new StubNumberSequenceService(),
      new StubOrderNumberSettings("date_prefixed"),
      () => new Date("2026-06-20T00:00:00.000Z"),
    );

    expect(await service.generateNext()).to.equal("ORD-20260620-000001");
    expect(await service.generateNext()).to.equal("ORD-20260620-000002");
  });

  it("uses the orders number sequence", async () => {
    const sequence = new StubNumberSequenceService();
    const service = new OrderNumberService(
      sequence,
      new StubOrderNumberSettings("sequential"),
      () => new Date("2026-06-20T00:00:00.000Z"),
    );

    await service.generateNext();

    expect(sequence.requestedNames).to.deep.equal(["orders"]);
  });
});
