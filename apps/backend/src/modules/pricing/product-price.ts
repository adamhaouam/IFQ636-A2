import type { CustomerAccessLevel, ProductPriceCalculation } from "@otbt/types";

export type { ProductPriceCalculation };

export interface ProductPriceContext {
  customerAccessLevel?: CustomerAccessLevel | null;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export abstract class ProductPrice {
  abstract calculate(context?: ProductPriceContext): ProductPriceCalculation;
}

export class BaseProductPrice extends ProductPrice {
  constructor(private readonly price: number) {
    super();

    if (price < 0) {
      throw new Error("Product price must be greater than or equal to 0");
    }
  }

  override calculate(): ProductPriceCalculation {
    const price = roundCurrency(this.price);

    return {
      basePrice: price,
      discountAmount: 0,
      discountRate: 0,
      finalPrice: price,
      membershipDiscountApplied: false,
    };
  }
}

export abstract class ProductPriceDecorator extends ProductPrice {
  protected constructor(protected readonly productPrice: ProductPrice) {
    super();
  }
}

export class MembershipDiscountPriceDecorator extends ProductPriceDecorator {
  constructor(
    productPrice: ProductPrice,
    private readonly discountRate: number,
  ) {
    super(productPrice);

    if (discountRate < 0 || discountRate > 100) {
      throw new Error("Membership discount rate must be between 0 and 100");
    }
  }

  override calculate(context: ProductPriceContext = {}): ProductPriceCalculation {
    const calculation = this.productPrice.calculate(context);

    if (context.customerAccessLevel !== "member" || this.discountRate === 0) {
      return calculation;
    }

    const discountAmount = roundCurrency(
      calculation.finalPrice * (this.discountRate / 100),
    );
    const finalPrice = roundCurrency(calculation.finalPrice - discountAmount);

    return {
      ...calculation,
      discountAmount: roundCurrency(calculation.discountAmount + discountAmount),
      discountRate: this.discountRate,
      finalPrice,
      membershipDiscountApplied: true,
    };
  }
}
