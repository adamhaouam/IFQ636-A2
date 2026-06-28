import {
  numberSequenceService,
} from "../number-sequences/index.js";
import {
  SequentialOrderNumberStrategy,
  type OrderNumberStrategy,
} from "./order-number.strategy.js";

const ORDER_SEQUENCE_NAME = "orders";

interface NumberSequenceProvider {
  nextValue(name: string): Promise<number>;
}

export class OrderNumberService {
  constructor(
    private readonly sequence: NumberSequenceProvider = numberSequenceService,
    private readonly strategy: OrderNumberStrategy =
      new SequentialOrderNumberStrategy(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async generateNext() {
    const sequence = await this.sequence.nextValue(ORDER_SEQUENCE_NAME);

    return this.strategy.format({
      issuedAt: this.now(),
      sequence,
    });
  }
}

export const orderNumberService = new OrderNumberService();
