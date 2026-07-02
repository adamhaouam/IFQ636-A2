export const ORDER_NUMBER_FORMATS = ["sequential", "date_prefixed"] as const;
export const PRODUCT_BROWSING_MODES = ["infinite", "paged"] as const;

export type OrderNumberFormat = (typeof ORDER_NUMBER_FORMATS)[number];
export type ProductBrowsingMode = (typeof PRODUCT_BROWSING_MODES)[number];

export interface StoreSettingsSnapshot {
  orderNumberFormat: OrderNumberFormat;
  membershipDiscountRate: number;
  productBrowsingMode: ProductBrowsingMode;
  productBrowsingPageSize: number;
  createdAt: string;
  updatedAt: string;
}
