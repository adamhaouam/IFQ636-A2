import { expect } from "chai";

import {
  BaseProductPrice,
  MembershipDiscountPriceDecorator,
  ProductPrice,
  ProductPricingService,
} from "../../../src/modules/pricing/index.js";

describe("ProductPricingService", () => {
  it("calculates base product prices without discounts", () => {
    const productPrice = new BaseProductPrice(42);

    expect(productPrice.calculate()).to.deep.equal({
      basePrice: 42,
      discountAmount: 0,
      discountRate: 0,
      finalPrice: 42,
      membershipDiscountApplied: false,
    });
  });

  it("applies the membership discount decorator for member customers", () => {
    const productPrice = new MembershipDiscountPriceDecorator(
      new BaseProductPrice(120),
      15,
    );

    expect(productPrice.calculate({ customerAccessLevel: "member" })).to.deep.equal({
      basePrice: 120,
      discountAmount: 18,
      discountRate: 15,
      finalPrice: 102,
      membershipDiscountApplied: true,
    });
  });

  it("uses calculate polymorphically through the ProductPrice base class", () => {
    const productPrices: ProductPrice[] = [
      new BaseProductPrice(50),
      new MembershipDiscountPriceDecorator(new BaseProductPrice(50), 10),
    ];

    const finalPrices = productPrices.map((productPrice) =>
      productPrice.calculate({ customerAccessLevel: "member" }).finalPrice,
    );

    expect(finalPrices).to.deep.equal([50, 45]);
  });

  it("does not discount standard customers", () => {
    const service = new ProductPricingService({ membershipDiscountRate: 10 });

    const calculation = service.calculateProductPrice(
      { membershipDiscountEnabled: true, price: 80 },
      { customerAccessLevel: "standard" },
    );

    expect(calculation).to.deep.equal({
      basePrice: 80,
      discountAmount: 0,
      discountRate: 0,
      finalPrice: 80,
      membershipDiscountApplied: false,
    });
  });

  it("does not discount ineligible products", () => {
    const service = new ProductPricingService({ membershipDiscountRate: 10 });

    const calculation = service.calculateProductPrice(
      { membershipDiscountEnabled: false, price: 80 },
      { customerAccessLevel: "member" },
    );

    expect(calculation).to.deep.equal({
      basePrice: 80,
      discountAmount: 0,
      discountRate: 0,
      finalPrice: 80,
      membershipDiscountApplied: false,
    });
  });
});
