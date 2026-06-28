import { queryOptions, useQuery } from "@tanstack/react-query";

import type { ProductDetailResponse, ProductListResponse } from "@otbt/types";

import { storefrontRequest } from "../../lib/http.client";

type PublicProductsPageParams = {
  page: number;
};

const publicProductsQueryKey = (params: PublicProductsPageParams) =>
  ["public-products", params] as const;
const publicProductQueryKey = (productId: string) =>
  ["public-product", productId] as const;

function toProductSearchParams(params: PublicProductsPageParams) {
  return new URLSearchParams({ page: String(params.page) }).toString();
}

async function fetchPublicProducts(params: PublicProductsPageParams) {
  return storefrontRequest<ProductListResponse>(
    `/products?${toProductSearchParams(params)}`,
  );
}

async function fetchPublicProduct(productId: string) {
  return storefrontRequest<ProductDetailResponse>(`/products/${productId}`);
}

export function publicProductsQueryOptions(params: PublicProductsPageParams) {
  return queryOptions({
    queryKey: publicProductsQueryKey(params),
    queryFn: () => fetchPublicProducts(params),
  });
}

export function publicProductQueryOptions(productId: string) {
  return queryOptions({
    queryKey: publicProductQueryKey(productId),
    queryFn: () => fetchPublicProduct(productId),
  });
}

export function usePublicProductsQuery(params: PublicProductsPageParams) {
  return useQuery(publicProductsQueryOptions(params));
}

export function usePublicProductQuery(productId: string) {
  return useQuery(publicProductQueryOptions(productId));
}
