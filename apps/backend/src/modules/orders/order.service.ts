import { isValidObjectId } from "mongoose";

import {
  ORDER_STATUSES,
  type CartQuoteLineItemRequest,
  type CartQuoteResponse,
  type AdminOrderListItem,
  type CheckoutRequest,
  type CheckoutSessionResponse,
  type CustomerAccessLevel,
  type Order,
  type OrderCreate,
  type OrderHistoryItem,
  type OrderItem,
  type OrderStatus,
} from "@otbt/types";

import { notificationService } from "../notifications/index.js";
import { getPaymentProvider } from "../payments/payment-provider.factory.js";
import {
  createProductPricingService,
  type ProductPricingService,
} from "../pricing/index.js";
import { ProductModel } from "../products/product.model.js";
import { orderNumberService } from "./order-number.service.js";
import { OrderModel, type OrderDocument } from "./order.model.js";

type OrderRecord = OrderDocument & {
  _id: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

interface OrderItemPricingContext {
  customerAccessLevel?: CustomerAccessLevel | null;
  pricingService?: ProductPricingService;
}

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

async function hydrateOrderItemImages(items: OrderItem[]): Promise<OrderItem[]> {
  const productIdsNeedingImages = [
    ...new Set(
      items
        .filter((item) => !item.imageUrl)
        .map((item) => item.productId)
        .filter((productId) => isValidObjectId(productId)),
    ),
  ];

  if (productIdsNeedingImages.length === 0) {
    return items;
  }

  const products = await ProductModel.find({
    _id: { $in: productIdsNeedingImages },
  })
    .select({ imageUrl: 1 })
    .exec();

  const imageUrlByProductId = new Map(
    products.map((product) => [product._id.toString(), product.imageUrl ?? null]),
  );

  return items.map((item) => ({
    ...item,
    imageUrl: item.imageUrl ?? imageUrlByProductId.get(item.productId) ?? null,
  }));
}

async function serializeOrder(order: OrderRecord): Promise<Order> {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    customer: order.customer,
    deliveryAddress: order.deliveryAddress,
    items: await hydrateOrderItemImages(order.items.map(normalizeOrderItemPricing)),
    status: order.status,
    payment: order.payment,
    subtotal: order.subtotal,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function normalizeOrderItemPricing(item: OrderItem): OrderItem {
  const legacyItem = item as Partial<OrderItem> & Pick<OrderItem, "price" | "quantity">;
  const basePrice = legacyItem.basePrice ?? item.price;
  const discountAmount = legacyItem.discountAmount ?? 0;
  const discountRate = legacyItem.discountRate ?? 0;
  const membershipDiscountApplied = legacyItem.membershipDiscountApplied ?? false;

  return {
    productId: item.productId,
    name: item.name,
    sku: item.sku,
    imageUrl: item.imageUrl ?? null,
    basePrice,
    price: item.price,
    discountAmount,
    discountRate,
    membershipDiscountApplied,
    quantity: item.quantity,
    lineTotal: item.lineTotal ?? item.price * item.quantity,
  };
}

function serializeOrderHistoryItem(order: OrderRecord): OrderHistoryItem {
  const id = order._id.toString();
  const itemNames = order.items.map((item) => item.name);
  const remainingItemCount = Math.max(0, itemNames.length - 2);
  const itemSummary =
    remainingItemCount > 0
      ? `${itemNames.slice(0, 2).join(", ")} +${remainingItemCount} more`
      : itemNames.join(", ");

  return {
    id,
    reference: order.orderNumber,
    status: order.status,
    total: order.total,
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
    itemSummary,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

async function serializeAdminOrderListItem(
  order: OrderRecord,
): Promise<AdminOrderListItem> {
  const serializedOrder = await serializeOrder(order);
  const itemNames = serializedOrder.items.map((item) => item.name);
  const remainingItemCount = Math.max(0, itemNames.length - 2);
  const itemSummary =
    remainingItemCount > 0
      ? `${itemNames.slice(0, 2).join(", ")} +${remainingItemCount} more`
      : itemNames.join(", ");

  return {
    id: serializedOrder.id,
    reference: serializedOrder.orderNumber,
    customerName: `${serializedOrder.customer.firstName} ${serializedOrder.customer.lastName}`,
    customerEmail: serializedOrder.customer.email,
    status: serializedOrder.status,
    total: serializedOrder.total,
    paymentStatus: serializedOrder.payment?.status || null,
    itemCount: serializedOrder.items.reduce(
      (total, item) => total + item.quantity,
      0,
    ),
    itemSummary,
    createdAt: serializedOrder.createdAt,
    updatedAt: serializedOrder.updatedAt,
  };
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    throw new OrderValidationError("Invalid product quantity");
  }

  const normalizedQuantity = Math.floor(quantity);

  if (normalizedQuantity < 1) {
    throw new OrderValidationError("Invalid product quantity");
  }

  return normalizedQuantity;
}

async function buildOrderItems(
  items: CartQuoteLineItemRequest[],
  context: OrderItemPricingContext = {},
): Promise<OrderItem[]> {
  if (items.length === 0) {
    throw new OrderValidationError("Cart cannot be empty");
  }

  const requestedItems = items.map((item) => {
    if (!isValidObjectId(item.productId)) {
      throw new OrderValidationError("Cart contains an unavailable product");
    }

    return {
      productId: item.productId,
      quantity: normalizeQuantity(item.quantity),
    };
  });

  const products = await ProductModel.find({
    _id: { $in: requestedItems.map((item) => item.productId) },
    status: "active",
    visibility: "public",
  }).exec();
  const pricingService =
    context.pricingService ?? (await createProductPricingService());

  return requestedItems.map((requestedItem) => {
    const product = products.find(
      (candidate) => candidate._id.toString() === requestedItem.productId,
    );

    if (!product) {
      throw new OrderValidationError("Cart contains an unavailable product");
    }

    const pricing = pricingService.calculateLineTotal(
      {
        membershipDiscountEnabled: product.membershipDiscountEnabled,
        price: product.price,
      },
      requestedItem.quantity,
      { customerAccessLevel: context.customerAccessLevel },
    );

    return {
      productId: product._id.toString(),
      name: product.name,
      sku: product.sku,
      imageUrl: product.imageUrl ?? null,
      basePrice: pricing.basePrice,
      price: pricing.finalPrice,
      discountAmount: pricing.discountAmount,
      discountRate: pricing.discountRate,
      membershipDiscountApplied: pricing.membershipDiscountApplied,
      quantity: requestedItem.quantity,
      lineTotal: pricing.lineTotal,
    };
  });
}

export async function quoteCartItems(
  items: CartQuoteLineItemRequest[],
  customerAccessLevel?: CustomerAccessLevel | null,
  pricingService?: ProductPricingService,
): Promise<CartQuoteResponse> {
  const orderItems = await buildOrderItems(items, {
    customerAccessLevel,
    pricingService,
  });
  const subtotal = orderItems.reduce((total, item) => total + item.lineTotal, 0);

  return {
    items: orderItems.map((item) => ({
      basePrice: item.basePrice,
      discountAmount: item.discountAmount,
      discountRate: item.discountRate,
      finalPrice: item.price,
      imageUrl: item.imageUrl,
      lineTotal: item.lineTotal,
      membershipDiscountApplied: item.membershipDiscountApplied,
      name: item.name,
      productId: item.productId,
      quantity: item.quantity,
      sku: item.sku,
    })),
    subtotal,
    total: subtotal,
  };
}

export async function createCheckoutOrder(
  input: CheckoutRequest,
  customerId: string | null,
  customerAccessLevel?: CustomerAccessLevel | null,
): Promise<Order> {
  const items = await buildOrderItems(input.items, { customerAccessLevel });
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);

  const order: OrderCreate = {
    orderNumber: await orderNumberService.generateNext(),
    customer: {
      customerId,
      firstName: input.customer.firstName,
      lastName: input.customer.lastName,
      email: input.customer.email,
      phone: input.customer.phone,
    },
    deliveryAddress: input.deliveryAddress,
    items,
    payment: null,
    status: "pending",
    subtotal,
    total: subtotal,
  };

  const createdOrder = await OrderModel.create(order);
  const serializedOrder = await serializeOrder(createdOrder as OrderRecord);

  await notificationService.recordOrderReceived(serializedOrder);

  return serializedOrder;
}



function getOrderOrThrow(order: OrderRecord | null) {
  if (!order) {
    throw new OrderValidationError("Order not found");
  }

  return order;
}

export async function createCheckoutSessionForOrder(
  input: CheckoutRequest,
  customerId: string | null,
  origin: string,
  customerAccessLevel?: CustomerAccessLevel | null,
): Promise<CheckoutSessionResponse> {
  const items = await buildOrderItems(input.items, { customerAccessLevel });
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);

  const provider = getPaymentProvider(input.paymentMethod);

  const order: OrderCreate = {
    orderNumber: await orderNumberService.generateNext(),
    customer: {
      customerId,
      firstName: input.customer.firstName,
      lastName: input.customer.lastName,
      email: input.customer.email,
      phone: input.customer.phone,
    },
    deliveryAddress: input.deliveryAddress,
    items,
    payment: {
      amount: subtotal,
      checkoutSessionId: null,
      currency: "aud",
      paymentIntentId: null,
      provider: input.paymentMethod,
      status: "pending",
    },
    status: "pending",
    subtotal,
    total: subtotal,
  };

  const createdOrder = await OrderModel.create(order);
  const orderId = createdOrder._id.toString();
  const encodedOrderId = encodeURIComponent(orderId);
  const successUrl  = input.paymentMethod === "stripe"
    ? `${origin}/api/storefront/orders/checkout/${input.paymentMethod}/success?orderId=${encodedOrderId}&session_id={CHECKOUT_SESSION_ID}`
    : `${origin}/api/storefront/orders/checkout/${input.paymentMethod}/success?orderId=${encodedOrderId}`;
  const cancelUrl = `${origin}/api/storefront/orders/checkout/${input.paymentMethod}/cancel?orderId=${encodedOrderId}`;
  const checkoutSession = await provider.createCheckoutSession({
    cancelUrl: cancelUrl,
    customerEmail: input.customer.email,
    items,
    orderId,
    successUrl: successUrl,
  });

  await OrderModel.updateOne(
    { _id: orderId },
    { $set: { "payment.checkoutSessionId": checkoutSession.sessionId } },
  ).exec();

  return {
    orderId,
    redirectUrl: checkoutSession.redirectUrl,
  };
}

export async function confirmCheckoutOrder(
  orderId: string,
  sessionId: string,
): Promise<Order> {
  if (!isValidObjectId(orderId) || !sessionId.trim()) {
    throw new OrderValidationError("Invalid checkout confirmation");
  }

  const existingOrder = getOrderOrThrow(
    (await OrderModel.findById(orderId).exec()) as OrderRecord | null,
  );

  if (existingOrder.payment?.status === "paid") {
    return await serializeOrder(existingOrder);
  }

  if (
    existingOrder.payment?.checkoutSessionId &&
    existingOrder.payment.checkoutSessionId !== sessionId
  ) {
    throw new OrderValidationError("Invalid checkout session");
  }

  const provider = getPaymentProvider(existingOrder.payment!.provider);

  const checkoutSession = await provider.verifyCheckoutSession({
    expectedTotal: existingOrder.total,
    orderId,
    sessionId,
  });

  const updatedOrder = getOrderOrThrow(
    (await OrderModel.findByIdAndUpdate(
      orderId,
      {
        $set: {
          payment: {
            amount: checkoutSession.amount,
            checkoutSessionId: checkoutSession.providerSessionId,
            currency: "aud",
            paymentIntentId: checkoutSession.paymentReference,
            provider: existingOrder.payment!.provider,
            status: "paid",
          },
        },
      },
      { new: true, runValidators: true },
    ).exec()) as OrderRecord | null,
  );
  const serializedOrder = await serializeOrder(updatedOrder);

  await notificationService.recordOrderReceived(serializedOrder);

  return serializedOrder;
}

export async function markCheckoutCancelled(orderId: string) {
  if (!isValidObjectId(orderId)) {
    throw new OrderValidationError("Invalid checkout cancellation");
  }

  await OrderModel.updateOne(
    { _id: orderId, "payment.status": "pending" },
    { $set: { "payment.status": "failed" } },
  ).exec();
}

export async function listOrdersForCustomer(
  customerId: string,
): Promise<OrderHistoryItem[]> {
  if (!customerId.trim()) {
    return [];
  }

  const orders = await OrderModel.find({
    "customer.customerId": customerId,
    "payment.status": "paid",
  })
    .sort({ createdAt: -1 })
    .exec();

  return orders.map((order) => serializeOrderHistoryItem(order as OrderRecord));
}

export async function getOrderForCustomer(
  orderId: string,
  customerId: string,
): Promise<Order | null> {
  if (!isValidObjectId(orderId) || !customerId.trim()) {
    return null;
  }

  const order = await OrderModel.findOne({
    _id: orderId,
    "customer.customerId": customerId,
    "payment.status": "paid",
  }).exec();

  return order ? await serializeOrder(order as OrderRecord) : null;
}

export async function listAdminOrders(): Promise<AdminOrderListItem[]> {
  const orders = await OrderModel.find().sort({ createdAt: -1 }).exec();

  return Promise.all(
    orders.map((order) => serializeAdminOrderListItem(order as OrderRecord)),
  );
}

export async function getAdminOrder(orderId: string): Promise<Order | null> {
  if (!isValidObjectId(orderId)) {
    return null;
  }

  const order = await OrderModel.findById(orderId).exec();

  return order ? await serializeOrder(order as OrderRecord) : null;
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order | null> {
  if (!isValidObjectId(orderId)) {
    return null;
  }

  if (!ORDER_STATUSES.includes(status)) {
    throw new OrderValidationError("Invalid order status");
  }

  const existingOrder = await OrderModel.findById(orderId).exec();

  if (!existingOrder) {
    return null;
  }

  const previousStatus = existingOrder.status;
  existingOrder.status = status;

  const savedOrder = await existingOrder.save();
  const serializedOrder = await serializeOrder(savedOrder as OrderRecord);

  if (serializedOrder.status !== previousStatus) {
    await notificationService.recordOrderStatusChanged(
      serializedOrder,
      previousStatus,
    );
  }

  return serializedOrder;
}
