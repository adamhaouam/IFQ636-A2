import type { ProductDetailResponse, ProductListResponse } from "@otbt/types";
import type { FastifyInstance } from "fastify";

import { HttpError } from "../../middleware/error-handler.js";
import {
  getProduct,
  listPaginatedProducts,
} from "../../modules/products/product.service.js";
import { createProductPricingService } from "../../modules/pricing/index.js";
import { StoreSettings } from "../../modules/settings/index.js";

type ProductParams = {
  productId: string;
};

type ProductListQuery = {
  page?: string;
};

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function storefrontProductsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: ProductListQuery }>("/", async (request) => {
    const settings =
      await StoreSettings.getInstance().getProductBrowsingSettings();
    const page = parsePositiveInteger(request.query.page, 1);
    const pageSize = settings.productBrowsingPageSize;
    const result = await listPaginatedProducts(
      {
        status: "active",
        visibility: "public",
      },
      { page, pageSize },
    );
    const pricingService = await createProductPricingService();
    const pricingContext = {
      customerAccessLevel: request.customer?.accessLevel ?? null,
    };
    const totalPages = Math.max(1, Math.ceil(result.total / pageSize));

    const response: ProductListResponse = {
      products: result.products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        membershipDiscountEnabled: product.membershipDiscountEnabled,
        price: pricingService.calculateProductPrice(product, pricingContext)
          .finalPrice,
      })),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages,
        hasNextPage: page < totalPages,
      },
      settings,
    };

    return response;
  });

  app.get<{ Params: ProductParams }>("/:productId", async (request) => {
    const product = await getProduct(request.params.productId, {
      status: "active",
      visibility: "public",
    });

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    const pricingService = await createProductPricingService();
    const pricingContext = {
      customerAccessLevel: request.customer?.accessLevel ?? null,
    };

    const response: ProductDetailResponse = {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        imageUrl: product.imageUrl,
        membershipDiscountEnabled: product.membershipDiscountEnabled,
        price: pricingService.calculateProductPrice(product, pricingContext)
          .finalPrice,
        stock: product.stock,
        status: product.status,
        visibility: product.visibility,
      },
    };

    return response;
  });
}
