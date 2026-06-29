export interface ProductPriceCalculation {
  basePrice: number;
  finalPrice: number;
  discountAmount: number;
  discountRate: number;
  membershipDiscountApplied: boolean;
}
