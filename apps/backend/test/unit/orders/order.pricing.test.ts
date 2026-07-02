import { expect } from "chai";
import sinon from "sinon";

import { ProductModel, type ProductDocument } from "../../../src/modules/products/product.model.js";
import { ProductPricingService } from "../../../src/modules/pricing/index.js";
import { quoteCartItems } from "../../../src/modules/orders/order.service.js";

const PRODUCT_ID = "650000000000000000000001";

type ProductRecord = ProductDocument & { _id: { toString(): string } };

function fakeQuery<T>(result: T) {
  return { exec: () => Promise.resolve(result) };
}

function createProductDocument(overrides: Partial<ProductRecord> = {}): ProductRecord {
  return {
    _id: { toString: () => PRODUCT_ID },
    name: "Thorn Bouquet",
    sku: "THN-001",
    description: "A bouquet of dark thorns.",
    imageUrl: "/uploads/products/thorn.png",
    price: 100,
    membershipDiscountEnabled: false,
    stock: 5,
    status: "active",
    visibility: "public",
    createdAt: new Date("2026-06-20T00:00:00.000Z"),
    updatedAt: new Date("2026-06-20T00:00:00.000Z"),
    ...overrides,
  } as ProductRecord;
}

describe("order pricing flow", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("quotes eligible member cart items with the membership price", async () => {
    sinon
      .stub(ProductModel, "find")
      .returns(fakeQuery([createProductDocument({ membershipDiscountEnabled: true })]) as never);

    const pricingService = new ProductPricingService({ membershipDiscountRate: 10 });

    const quote = await quoteCartItems(
      [{ productId: PRODUCT_ID, quantity: 1 }],
      "member",
      pricingService,
    );

    const item = quote.items[0];

    expect(item.basePrice).to.equal(100);
    expect(item.discountRate).to.equal(10);
    expect(item.discountAmount).to.equal(10);
    expect(item.finalPrice).to.equal(90);
    expect(item.lineTotal).to.equal(90);
    expect(item.membershipDiscountApplied).to.equal(true);
    expect(quote.subtotal).to.equal(90);
  });

  it("quotes ineligible member cart items at the base price", async () => {
    sinon
      .stub(ProductModel, "find")
      .returns(fakeQuery([createProductDocument({ membershipDiscountEnabled: false })]) as never);

    const pricingService = new ProductPricingService({ membershipDiscountRate: 10 });

    const quote = await quoteCartItems(
      [{ productId: PRODUCT_ID, quantity: 1 }],
      "member",
      pricingService,
    );

    const item = quote.items[0];

    expect(item.basePrice).to.equal(100);
    expect(item.discountAmount).to.equal(0);
    expect(item.finalPrice).to.equal(100);
    expect(item.lineTotal).to.equal(100);
    expect(item.membershipDiscountApplied).to.equal(false);
  });
});
