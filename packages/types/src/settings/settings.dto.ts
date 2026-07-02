import type { StoreSettingsSnapshot } from "./settings.entity.js";

export type StoreSettingsUpdate = Partial<
  Pick<
    StoreSettingsSnapshot,
    | "orderNumberFormat"
    | "membershipDiscountRate"
    | "productBrowsingMode"
    | "productBrowsingPageSize"
  >
>;

export interface StoreSettingsResponse {
  settings: StoreSettingsSnapshot;
}
