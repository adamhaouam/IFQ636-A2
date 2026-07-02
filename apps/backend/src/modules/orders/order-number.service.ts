import type { OrderNumberFormat } from "@otbt/types";

import {
  numberSequenceService,
} from "../number-sequences/index.js";
import { StoreSettings } from "../settings/index.js";
import {
  DatePrefixedOrderNumberStrategy,
  SequentialOrderNumberStrategy,
  type OrderNumberStrategy,
} from "./order-number.strategy.js";

const ORDER_SEQUENCE_NAME = "orders";

interface NumberSequenceProvider {
  nextValue(name: string): Promise<number>;
}

interface OrderNumberSettings {
  getOrderNumberFormat(): Promise<OrderNumberFormat>;
}

function resolveOrderNumberStrategy(format: OrderNumberFormat): OrderNumberStrategy {
  if (format === "date_prefixed") {
    return new DatePrefixedOrderNumberStrategy();
  }

  return new SequentialOrderNumberStrategy();
}

export class OrderNumberService {
  constructor(
    private readonly sequence: NumberSequenceProvider = numberSequenceService,
    private readonly settings: OrderNumberSettings = StoreSettings.getInstance(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async generateNext() {
    const [sequence, format] = await Promise.all([
      this.sequence.nextValue(ORDER_SEQUENCE_NAME),
      this.settings.getOrderNumberFormat(),
    ]);
    const strategy = resolveOrderNumberStrategy(format);

    return strategy.format({
      issuedAt: this.now(),
      sequence,
    });
  }
}

export const orderNumberService = new OrderNumberService();
