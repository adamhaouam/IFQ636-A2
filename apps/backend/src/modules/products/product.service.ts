import { isValidObjectId, type FilterQuery } from "mongoose";
import type {
  Product,
  ProductCreate,
  ProductStatus,
  ProductUpdate,
  ProductVisibility,
} from "@otbt/types";

import { ProductModel, type ProductDocument } from "./product.model.js";

type ProductRecord = ProductDocument & {
  _id: { toString(): string };
};

interface ProductQueryConstraints {
  status?: ProductStatus;
  visibility?: ProductVisibility;
}

export interface ProductPaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedProductList {
  products: Product[];
  total: number;
}

function applyProductQueryConstraints(
  query: FilterQuery<ProductDocument>,
  constraints: ProductQueryConstraints,
) {
  if (constraints.status) {
    query.status = constraints.status;
  }

  if (constraints.visibility) {
    query.visibility = constraints.visibility;
  }
}

function serializeProduct(product: ProductRecord): Product {
  return {
    id: product._id.toString(),
    name: product.name,
    sku: product.sku,
    description: product.description,
    imageUrl: product.imageUrl,
    price: product.price,
    stock: product.stock,
    status: product.status,
    visibility: product.visibility,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function listProducts(
  filters: ProductQueryConstraints = {},
): Promise<Product[]> {
  const query: FilterQuery<ProductDocument> = {};

  applyProductQueryConstraints(query, filters);

  const products = await ProductModel.find(query)
    .sort({ name: 1 })
    .lean<ProductRecord[]>()
    .exec();

  return products.map((product) => serializeProduct(product));
}

export async function listPaginatedProducts(
  filters: ProductQueryConstraints = {},
  pagination: ProductPaginationOptions,
): Promise<PaginatedProductList> {
  const query: FilterQuery<ProductDocument> = {};

  applyProductQueryConstraints(query, filters);

  const skip = (pagination.page - 1) * pagination.pageSize;
  const [products, total] = await Promise.all([
    ProductModel.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(pagination.pageSize)
      .lean<ProductRecord[]>()
      .exec(),
    ProductModel.countDocuments(query).exec(),
  ]);

  return {
    products: products.map((product) => serializeProduct(product)),
    total,
  };
}

export async function createProduct(product: ProductCreate): Promise<Product> {
  const createdProduct = await ProductModel.create(product);

  return serializeProduct(createdProduct);
}

export async function getProduct(
  productId: string,
  constraints: ProductQueryConstraints = {},
): Promise<Product | null> {
  if (!isValidObjectId(productId)) {
    return null;
  }

  const query: FilterQuery<ProductDocument> = { _id: productId };

  applyProductQueryConstraints(query, constraints);

  const product = await ProductModel.findOne(query).lean<ProductRecord>().exec();

  return product ? serializeProduct(product) : null;
}

export async function updateProduct(
  productId: string,
  product: ProductUpdate,
): Promise<Product | null> {
  if (!isValidObjectId(productId)) {
    return null;
  }

  const updatedProduct = await ProductModel.findByIdAndUpdate(productId, product, {
    new: true,
    runValidators: true,
  })
    .lean<ProductRecord>()
    .exec();

  return updatedProduct ? serializeProduct(updatedProduct) : null;
}

export async function clearProductImage(productId: string): Promise<Product | null> {
  if (!isValidObjectId(productId)) {
    return null;
  }

  const updatedProduct = await ProductModel.findByIdAndUpdate(
    productId,
    { $unset: { imageUrl: "" } },
    {
      new: true,
      runValidators: true,
    },
  )
    .lean<ProductRecord>()
    .exec();

  return updatedProduct ? serializeProduct(updatedProduct) : null;
}
