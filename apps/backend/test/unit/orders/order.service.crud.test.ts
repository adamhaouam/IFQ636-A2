import { expect } from "chai";
import sinon from "sinon";

import { OrderModel, type OrderDocument } from "../../../src/modules/orders/order.model.js";
import { ProductModel, type ProductDocument } from "../../../src/modules/products/product.model.js";
import { notificationService } from "../../../src/modules/notifications/index.js";
import { StripePaymentAdapter } from "../../../src/modules/payments/stripe.adapter.js";
import {
  OrderValidationError,
  confirmCheckoutOrder,
  createCheckoutOrder,
  createCheckoutSessionForOrder,
  getAdminOrder,
  getOrderForCustomer,
  listAdminOrders,
  listOrdersForCustomer,
  markCheckoutCancelled,
  updateAdminOrderStatus,
} from "../../../src/modules/orders/order.service.js";

type OrderRecord = OrderDocument & { _id: { toString(): string } };
type ProductRecord = ProductDocument & { _id: { toString(): string } };

const PRODUCT_ID = "650000000000000000000001";
const ORDER_ID = "660000000000000000000001";

function fakeQuery<T>(result: T) {
  const query = {
    exec: () => Promise.resolve(result),
    select: () => query,
    sort: () => query,
  };

  return query;
}

function createProductDocument(overrides: Partial<ProductRecord> = {}): ProductRecord {
  return {
    _id: { toString: () => PRODUCT_ID },
    name: "Thorn Bouquet",
    sku: "THN-001",
    description: "A bouquet of dark thorns.",
    imageUrl: "/uploads/products/thorn.png",
    price: 20,
    stock: 5,
    status: "active",
    visibility: "public",
    createdAt: new Date("2026-06-20T00:00:00.000Z"),
    updatedAt: new Date("2026-06-20T00:00:00.000Z"),
    ...overrides,
  } as ProductRecord;
}

function createOrderItem(overrides: Partial<OrderDocument["items"][number]> = {}) {
  return {
    productId: PRODUCT_ID,
    name: "Thorn Bouquet",
    sku: "THN-001",
    imageUrl: "/uploads/products/thorn.png",
    price: 20,
    quantity: 1,
    lineTotal: 20,
    ...overrides,
  };
}

function createOrderDocument(
  overrides: Partial<OrderRecord> = {},
): OrderRecord & { save: sinon.SinonStub } {
  const doc = {
    _id: { toString: () => ORDER_ID },
    customer: {
      customerId: null,
      firstName: "Mara",
      lastName: "Vale",
      email: "mara@example.com",
      phone: null,
    },
    deliveryAddress: {
      recipientName: "Mara Vale",
      addressLine1: "1 Thorn Lane",
      addressLine2: null,
      suburb: "Brisbane",
      state: "QLD",
      postcode: "4000",
      instructions: null,
    },
    items: [createOrderItem()],
    status: "pending",
    payment: null,
    subtotal: 20,
    total: 20,
    createdAt: new Date("2026-06-20T00:00:00.000Z"),
    updatedAt: new Date("2026-06-20T00:00:00.000Z"),
    ...overrides,
  } as OrderRecord & { save: sinon.SinonStub };

  doc.save = sinon.stub().callsFake(async () => doc);

  return doc;
}

describe("order.service CRUD", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("createCheckoutOrder (create)", () => {
    it("throws when the cart is empty", async () => {
      try {
        await createCheckoutOrder(
          {
            customer: { firstName: "Mara", lastName: "Vale", email: "mara@example.com", phone: null },
            deliveryAddress: {
              recipientName: "Mara Vale",
              addressLine1: "1 Thorn Lane",
              addressLine2: null,
              suburb: "Brisbane",
              state: "QLD",
              postcode: "4000",
              instructions: null,
            },
            items: [],
            paymentMethod: "stripe",
          },
          null,
        );
        expect.fail("expected createCheckoutOrder to throw");
      } catch (error) {
        expect(error).to.be.instanceOf(OrderValidationError);
        expect((error as OrderValidationError).message).to.equal("Cart cannot be empty");
      }
    });
  });

  describe("confirmCheckoutOrder (update/confirm)", () => {
    it("throws for an invalid orderId or blank sessionId", async () => {
      try {
        await confirmCheckoutOrder("not-a-valid-id", "sess_123");
        expect.fail("expected confirmCheckoutOrder to throw");
      } catch (error) {
        expect(error).to.be.instanceOf(OrderValidationError);
      }
    });

    it("throws when the order does not exist", async () => {
      sinon.stub(OrderModel, "findById").returns(fakeQuery(null) as never);

      try {
        await confirmCheckoutOrder(ORDER_ID, "sess_123");
        expect.fail("expected confirmCheckoutOrder to throw");
      } catch (error) {
        expect(error).to.be.instanceOf(OrderValidationError);
        expect((error as OrderValidationError).message).to.equal("Order not found");
      }
    });

    it("returns the existing order without re-verifying when already paid", async () => {
      sinon.stub(OrderModel, "findById").returns(
        fakeQuery(
          createOrderDocument({
            payment: {
              provider: "stripe",
              status: "paid",
              amount: 20,
              currency: "aud",
              checkoutSessionId: "sess_123",
              paymentIntentId: "pi_123",
            },
          }),
        ) as never,
      );
      const verifyStub = sinon.stub(StripePaymentAdapter.prototype, "verifyCheckoutSession");

      const order = await confirmCheckoutOrder(ORDER_ID, "sess_123");

      expect(order.payment?.status).to.equal("paid");
      expect(verifyStub.called).to.equal(false);
    });

    it("throws when the checkout session id does not match", async () => {
      sinon.stub(OrderModel, "findById").returns(
        fakeQuery(
          createOrderDocument({
            payment: {
              provider: "stripe",
              status: "pending",
              amount: 20,
              currency: "aud",
              checkoutSessionId: "sess_other",
              paymentIntentId: null,
            },
          }),
        ) as never,
      );

      try {
        await confirmCheckoutOrder(ORDER_ID, "sess_123");
        expect.fail("expected confirmCheckoutOrder to throw");
      } catch (error) {
        expect(error).to.be.instanceOf(OrderValidationError);
        expect((error as OrderValidationError).message).to.equal("Invalid checkout session");
      }
    });

    it("verifies payment, updates the order, and records a notification", async () => {
      sinon.stub(OrderModel, "findById").returns(
        fakeQuery(
          createOrderDocument({
            payment: {
              provider: "stripe",
              status: "pending",
              amount: 20,
              currency: "aud",
              checkoutSessionId: "sess_123",
              paymentIntentId: null,
            },
          }),
        ) as never,
      );
      sinon.stub(StripePaymentAdapter.prototype, "verifyCheckoutSession").resolves({
        amount: 20,
        currency: "aud",
        paymentReference: "pi_123",
        providerSessionId: "sess_123",
      });
      const updatedOrder = createOrderDocument({
        payment: {
          provider: "stripe",
          status: "paid",
          amount: 20,
          currency: "aud",
          checkoutSessionId: "sess_123",
          paymentIntentId: "pi_123",
        },
      });
      sinon.stub(OrderModel, "findByIdAndUpdate").returns(fakeQuery(updatedOrder) as never);
      const recordOrderReceivedStub = sinon
        .stub(notificationService, "recordOrderReceived")
        .resolves(undefined as never);

      const order = await confirmCheckoutOrder(ORDER_ID, "sess_123");

      expect(order.payment?.status).to.equal("paid");
      expect(recordOrderReceivedStub.calledOnce).to.equal(true);
    });
  });

  describe("markCheckoutCancelled (delete/cancel)", () => {
    it("throws for an invalid orderId", async () => {
      try {
        await markCheckoutCancelled("not-a-valid-id");
        expect.fail("expected markCheckoutCancelled to throw");
      } catch (error) {
        expect(error).to.be.instanceOf(OrderValidationError);
      }
    });

    it("marks a pending payment as failed", async () => {
      const updateOneStub = sinon
        .stub(OrderModel, "updateOne")
        .returns(fakeQuery(undefined) as never);

      await markCheckoutCancelled(ORDER_ID);

      expect(updateOneStub.calledOnce).to.equal(true);

      const [filter, update] = updateOneStub.firstCall.args as unknown as [
        Record<string, unknown>,
        { $set: Record<string, unknown> },
      ];

      expect(filter).to.deep.equal({
        _id: ORDER_ID,
        "payment.status": "pending",
      });
      expect(update).to.deep.equal({
        $set: { "payment.status": "failed" },
      });
    });
  });

  describe("listOrdersForCustomer (fetch)", () => {
    it("returns an empty list without querying for a blank customerId", async () => {
      const findStub = sinon.stub(OrderModel, "find");

      const orders = await listOrdersForCustomer("   ");

      expect(orders).to.deep.equal([]);
      expect(findStub.called).to.equal(false);
    });

    it("returns the customer's order history", async () => {
      sinon.stub(OrderModel, "find").returns(fakeQuery([createOrderDocument()]) as never);

      const orders = await listOrdersForCustomer("customer-1");

      expect(orders).to.have.length(1);
      expect(orders[0].id).to.equal(ORDER_ID);
    });
  });

  describe("getOrderForCustomer (fetch)", () => {
    it("returns null without querying for an invalid orderId", async () => {
      const findOneStub = sinon.stub(OrderModel, "findOne");

      const order = await getOrderForCustomer("not-a-valid-id", "customer-1");

      expect(order).to.equal(null);
      expect(findOneStub.called).to.equal(false);
    });

    it("returns the order when found", async () => {
      sinon.stub(OrderModel, "findOne").returns(fakeQuery(createOrderDocument()) as never);

      const order = await getOrderForCustomer(ORDER_ID, "customer-1");

      expect(order?.id).to.equal(ORDER_ID);
    });

    it("returns null when not found", async () => {
      sinon.stub(OrderModel, "findOne").returns(fakeQuery(null) as never);

      const order = await getOrderForCustomer(ORDER_ID, "customer-1");

      expect(order).to.equal(null);
    });
  });

  describe("listAdminOrders (fetch)", () => {
    it("returns all orders serialized for admin", async () => {
      sinon.stub(OrderModel, "find").returns(fakeQuery([createOrderDocument()]) as never);

      const orders = await listAdminOrders();

      expect(orders).to.have.length(1);
      expect(orders[0].id).to.equal(ORDER_ID);
    });
  });

  describe("getAdminOrder (fetch)", () => {
    it("returns null without querying for an invalid orderId", async () => {
      const findByIdStub = sinon.stub(OrderModel, "findById");

      const order = await getAdminOrder("not-a-valid-id");

      expect(order).to.equal(null);
      expect(findByIdStub.called).to.equal(false);
    });

    it("returns the order when found", async () => {
      sinon.stub(OrderModel, "findById").returns(fakeQuery(createOrderDocument()) as never);

      const order = await getAdminOrder(ORDER_ID);

      expect(order?.id).to.equal(ORDER_ID);
    });
  });

  describe("updateAdminOrderStatus (update)", () => {
    it("returns null without querying for an invalid orderId", async () => {
      const findByIdStub = sinon.stub(OrderModel, "findById");

      const order = await updateAdminOrderStatus("not-a-valid-id", "packed");

      expect(order).to.equal(null);
      expect(findByIdStub.called).to.equal(false);
    });

    it("throws for an invalid status", async () => {
      const findByIdStub = sinon.stub(OrderModel, "findById");

      try {
        await updateAdminOrderStatus(ORDER_ID, "bogus" as never);
        expect.fail("expected updateAdminOrderStatus to throw");
      } catch (error) {
        expect(error).to.be.instanceOf(OrderValidationError);
      }

      expect(findByIdStub.called).to.equal(false);
    });

    it("returns null when the order does not exist", async () => {
      sinon.stub(OrderModel, "findById").returns(fakeQuery(null) as never);

      const order = await updateAdminOrderStatus(ORDER_ID, "packed");

      expect(order).to.equal(null);
    });

    it("saves the new status and records a status-changed notification", async () => {
      const existingOrder = createOrderDocument({ status: "pending" });
      sinon.stub(OrderModel, "findById").returns(fakeQuery(existingOrder) as never);
      const recordStatusChangedStub = sinon
        .stub(notificationService, "recordOrderStatusChanged")
        .resolves(undefined as never);

      const order = await updateAdminOrderStatus(ORDER_ID, "packed");

      expect(order?.status).to.equal("packed");
      expect((existingOrder.save as sinon.SinonStub).calledOnce).to.equal(true);
      expect(recordStatusChangedStub.calledOnce).to.equal(true);
    });

    it("does not record a notification when the status is unchanged", async () => {
      const existingOrder = createOrderDocument({ status: "packed" });
      sinon.stub(OrderModel, "findById").returns(fakeQuery(existingOrder) as never);
      const recordStatusChangedStub = sinon
        .stub(notificationService, "recordOrderStatusChanged")
        .resolves(undefined as never);

      const order = await updateAdminOrderStatus(ORDER_ID, "packed");

      expect(order?.status).to.equal("packed");
      expect(recordStatusChangedStub.called).to.equal(false);
    });
  });
});
