import { expect } from "chai";

import { quoteCartItems } from "../../../src/modules/orders/order.service.js";
import { ProductPricingService } from "../../../src/modules/pricing/index.js";
import { ProductModel } from "../../../src/modules/products/product.model.js";

const PRODUCT_ID = "507f1f77bcf86cd799439011";

function createProduct(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => PRODUCT_ID },
    imageUrl: null,
    membershipDiscountEnabled: true,
    name: "Black Calla Study",
    price: 100,
    sku: "BCS-003",
    ...overrides,
  };
}

describe("order pricing flow", () => {
  const originalFind = ProductModel.find;

  afterEach(() => {
    ProductModel.find = originalFind;
  });

  it("quotes eligible member cart items with the membership price", async () => {
    ProductModel.find = (() => ({
      exec: async () => [createProduct()],
    })) as typeof ProductModel.find;

    const quote = await quoteCartItems(
      [{ productId: PRODUCT_ID, quantity: 2 }],
      "member",
      new ProductPricingService({ membershipDiscountRate: 15 }),
    );

    expect(quote).to.deep.equal({
      items: [
        {
          basePrice: 100,
          discountAmount: 15,
          discountRate: 15,
          finalPrice: 85,
          imageUrl: null,
          lineTotal: 170,
          membershipDiscountApplied: true,
          name: "Black Calla Study",
          productId: PRODUCT_ID,
          quantity: 2,
          sku: "BCS-003",
        },
      ],
      subtotal: 170,
      total: 170,
    });
  });

  it("quotes ineligible member cart items at the base price", async () => {
    ProductModel.find = (() => ({
      exec: async () => [createProduct({ membershipDiscountEnabled: false })],
    })) as typeof ProductModel.find;

    const quote = await quoteCartItems(
      [{ productId: PRODUCT_ID, quantity: 2 }],
      "member",
      new ProductPricingService({ membershipDiscountRate: 15 }),
    );

    expect(quote.items[0]).to.include({
      basePrice: 100,
      discountAmount: 0,
      discountRate: 0,
      finalPrice: 100,
      lineTotal: 200,
      membershipDiscountApplied: false,
    });
    expect(quote.total).to.equal(200);
  });
});
