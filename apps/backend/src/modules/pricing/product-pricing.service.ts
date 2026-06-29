import type { Product } from "@otbt/types";

import {
  BaseProductPrice,
  MembershipDiscountPriceDecorator,
  type ProductPriceContext,
} from "./product-price.js";
import { StoreSettings } from "../settings/index.js";

export type PriceableProduct = Pick<
  Product,
  "membershipDiscountEnabled" | "price"
>;

export interface ProductPricingOptions {
  membershipDiscountRate: number;
}

export interface ProductPricingSettings {
  getMembershipDiscountRate(): Promise<number>;
}

export class ProductPricingService {
  constructor(private readonly options: ProductPricingOptions) {}

  createProductPrice(product: PriceableProduct) {
    const basePrice = new BaseProductPrice(product.price);

    if (!product.membershipDiscountEnabled) {
      return basePrice;
    }

    return new MembershipDiscountPriceDecorator(
      basePrice,
      this.options.membershipDiscountRate,
    );
  }

  calculateProductPrice(
    product: PriceableProduct,
    context: ProductPriceContext = {},
  ) {
    return this.createProductPrice(product).calculate(context);
  }

  calculateLineTotal(
    product: PriceableProduct,
    quantity: number,
    context: ProductPriceContext = {},
  ) {
    const calculation = this.calculateProductPrice(product, context);

    return {
      ...calculation,
      lineTotal: Math.round(calculation.finalPrice * quantity * 100) / 100,
    };
  }
}

export async function createProductPricingService(
  settings: ProductPricingSettings = StoreSettings.getInstance(),
) {
  return new ProductPricingService({
    membershipDiscountRate: await settings.getMembershipDiscountRate(),
  });
}
