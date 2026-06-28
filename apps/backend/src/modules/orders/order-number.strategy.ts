export interface OrderNumberStrategy {
  format(input: { issuedAt: Date; sequence: number }): string;
}

export class SequentialOrderNumberStrategy implements OrderNumberStrategy {
  constructor(
    private readonly prefix = "ORD",
    private readonly width = 6,
  ) {}

  format({ sequence }: { issuedAt: Date; sequence: number }) {
    return `${this.prefix}-${String(sequence).padStart(this.width, "0")}`;
  }
}

export class DatePrefixedOrderNumberStrategy implements OrderNumberStrategy {
  constructor(
    private readonly prefix = "ORD",
    private readonly width = 6,
  ) {}

  format({ issuedAt, sequence }: { issuedAt: Date; sequence: number }) {
    const date = issuedAt.toISOString().slice(0, 10).replaceAll("-", "");

    return `${this.prefix}-${date}-${String(sequence).padStart(this.width, "0")}`;
  }
}
