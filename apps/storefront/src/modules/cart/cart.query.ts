import { queryOptions, useQuery } from "@tanstack/react-query";

import type { CartQuoteRequest, CartQuoteResponse } from "@otbt/types";

import { storefrontRequest } from "../../lib/http.client";
import { getSessionToken } from "../../lib/session-token";
import type { CartItem } from "./cart.types";

const cartQuoteQueryKey = (items: CartItem[]) =>
  [
    "cart-quote",
    getSessionToken(),
    items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  ] as const;

function toCartQuoteRequest(items: CartItem[]): CartQuoteRequest {
  return {
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  };
}

function fetchCartQuote(items: CartItem[]) {
  return storefrontRequest<CartQuoteResponse>("/orders/quote", {
    method: "POST",
    body: JSON.stringify(toCartQuoteRequest(items)),
  });
}

export function cartQuoteQueryOptions(items: CartItem[]) {
  return queryOptions({
    enabled: items.length > 0,
    queryFn: () => fetchCartQuote(items),
    queryKey: cartQuoteQueryKey(items),
  });
}

export function useCartQuoteQuery(items: CartItem[]) {
  return useQuery(cartQuoteQueryOptions(items));
}
