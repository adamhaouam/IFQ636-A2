import { expect } from "chai";

import { OrderNumberService } from "../../../src/modules/orders/order-number.service.js";
import {
  DatePrefixedOrderNumberStrategy,
  SequentialOrderNumberStrategy,
} from "../../../src/modules/orders/order-number.strategy.js";

class StubNumberSequenceService {
  private value = 0;
  readonly requestedNames: string[] = [];

  async nextValue(name: string) {
    this.requestedNames.push(name);
    this.value += 1;

    return this.value;
  }
}

describe("OrderNumberService", () => {
  it("uses the sequential strategy without changing the service", async () => {
    const service = new OrderNumberService(
      new StubNumberSequenceService(),
      new SequentialOrderNumberStrategy("ORD", 6),
      () => new Date("2026-06-20T00:00:00.000Z"),
    );

    expect(await service.generateNext()).to.equal("ORD-000001");
    expect(await service.generateNext()).to.equal("ORD-000002");
  });

  it("uses the date-prefixed strategy without changing the service", async () => {
    const service = new OrderNumberService(
      new StubNumberSequenceService(),
      new DatePrefixedOrderNumberStrategy("ORD", 6),
      () => new Date("2026-06-20T00:00:00.000Z"),
    );

    expect(await service.generateNext()).to.equal("ORD-20260620-000001");
    expect(await service.generateNext()).to.equal("ORD-20260620-000002");
  });

  it("uses the orders number sequence", async () => {
    const sequence = new StubNumberSequenceService();
    const service = new OrderNumberService(
      sequence,
      new SequentialOrderNumberStrategy("ORD", 6),
      () => new Date("2026-06-20T00:00:00.000Z"),
    );

    await service.generateNext();

    expect(sequence.requestedNames).to.deep.equal(["orders"]);
  });
});
