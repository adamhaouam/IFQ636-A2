import { model, Schema } from "mongoose";
import {
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITIES,
  type ProductStatus,
  type ProductVisibility,
} from "@otbt/types";

export interface ProductDocument {
  name: string;
  sku: string;
  description: string;
  imageUrl?: string;
  price: number;
  membershipDiscountEnabled: boolean;
  stock: number;
  status: ProductStatus;
  visibility: ProductVisibility;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    membershipDiscountEnabled: { type: Boolean, default: false, required: true },
    stock: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [...PRODUCT_STATUSES],
      default: "draft",
      required: true,
    },
    visibility: {
      type: String,
      enum: [...PRODUCT_VISIBILITIES],
      default: "hidden",
      required: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ name: 1 });
productSchema.index({ status: 1, visibility: 1 });

export const ProductModel = model<ProductDocument>("Product", productSchema);
