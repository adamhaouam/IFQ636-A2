import type { ProductBrowsingMode } from "../settings/settings.entity.js";
import type { Product } from "./product.entity.js";

export type ProductListItem = Pick<
  Product,
  "id" | "name" | "description" | "imageUrl" | "price" | "membershipDiscountEnabled"
>;

export interface ProductListResponse {
  products: ProductListItem[];
  pagination: ProductListPagination;
  settings: ProductListSettings;
}

export interface ProductListPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface ProductListSettings {
  productBrowsingMode: ProductBrowsingMode;
  productBrowsingPageSize: number;
}

export type ProductDetail = Pick<
  Product,
  | "id"
  | "name"
  | "sku"
  | "description"
  | "imageUrl"
  | "price"
  | "membershipDiscountEnabled"
  | "stock"
  | "status"
  | "visibility"
>;

export interface ProductDetailResponse {
  product: ProductDetail;
}
