import type { ProductPriceCalculation } from "../pricing/pricing.entity.js";

export interface CartQuoteLineItemRequest {
  productId: string;
  quantity: number;
}

export interface CartQuoteRequest {
  items: CartQuoteLineItemRequest[];
}

export interface CartQuoteItem extends ProductPriceCalculation {
  productId: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  quantity: number;
  lineTotal: number;
}

export interface CartQuoteResponse {
  items: CartQuoteItem[];
  subtotal: number;
  total: number;
}
