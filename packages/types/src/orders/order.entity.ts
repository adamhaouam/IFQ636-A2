export const ORDER_STATUSES = ["pending", "packed", "shipped"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderPaymentStatus = "pending" | "paid" | "failed";

export interface OrderCustomerSnapshot {
  customerId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface OrderDeliveryAddress {
  recipientName: string;
  addressLine1: string;
  addressLine2: string | null;
  suburb: string;
  state: string;
  postcode: string;
  instructions: string | null;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  basePrice: number;
  price: number;
  discountAmount: number;
  discountRate: number;
  membershipDiscountApplied: boolean;
  quantity: number;
  lineTotal: number;
}

export interface OrderPayment {
  provider: "stripe" | "paypal"; 
  status: OrderPaymentStatus;
  amount: number;
  currency: "aud";
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: OrderCustomerSnapshot;
  deliveryAddress: OrderDeliveryAddress;
  items: OrderItem[];
  status: OrderStatus;
  payment: OrderPayment | null;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderCreate = Pick<
  Order,
  | "orderNumber"
  | "customer"
  | "deliveryAddress"
  | "items"
  | "payment"
  | "subtotal"
  | "total"
> & {
  status?: OrderStatus;
};
