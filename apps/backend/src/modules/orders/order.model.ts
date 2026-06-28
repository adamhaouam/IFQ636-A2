import { model, Schema } from "mongoose";

import {
  ORDER_STATUSES,
  type OrderCustomerSnapshot,
  type OrderDeliveryAddress,
  type OrderItem,
  type OrderPayment,
  type OrderStatus,
} from "@otbt/types";

export interface OrderDocument {
  orderNumber: string;
  customer: OrderCustomerSnapshot;
  deliveryAddress: OrderDeliveryAddress;
  items: OrderItem[];
  status: OrderStatus;
  payment: OrderPayment | null;
  subtotal: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderCustomerSchema = new Schema<OrderCustomerSnapshot>(
  {
    customerId: { type: String, default: null },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: null, trim: true },
  },
  { _id: false },
);

const orderDeliveryAddressSchema = new Schema<OrderDeliveryAddress>(
  {
    recipientName: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: null, trim: true },
    suburb: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postcode: { type: String, required: true, trim: true },
    instructions: { type: String, default: null, trim: true },
  },
  { _id: false },
);

const orderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderPaymentSchema = new Schema<OrderPayment>(
  {
    provider: { type: String, enum: ["stripe", "paypal"], required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["aud"], required: true },
    checkoutSessionId: { type: String, default: null },
    paymentIntentId: { type: String, default: null },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, trim: true, unique: true },
    customer: { type: orderCustomerSchema, required: true },
    deliveryAddress: { type: orderDeliveryAddressSchema, required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(items: OrderItem[]) {
          return items.length > 0;
        },
        message: "Order requires at least one item.",
      },
    },
    status: {
      type: String,
      enum: [...ORDER_STATUSES],
      default: "pending",
      required: true,
    },
    payment: { type: orderPaymentSchema, default: null },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

orderSchema.index({ "customer.email": 1 });
orderSchema.index({ "customer.customerId": 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "payment.checkoutSessionId": 1 });

export const OrderModel = model<OrderDocument>("Order", orderSchema);
