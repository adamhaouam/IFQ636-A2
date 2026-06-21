import type {
  CheckoutRequest,
  CheckoutSessionResponse,
  OrderDetailResponse,
  OrderHistoryResponse,
} from "@otbt/types";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { HttpError } from "../../middleware/error-handler.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import {
  confirmStripeCheckoutOrder,
  createCheckoutSessionForOrder,
  getOrderForCustomer,
  listOrdersForCustomer,
  markStripeCheckoutCancelled,
  OrderValidationError,
} from "../../modules/orders/order.service.js";
import { PaymentValidationError } from "../../modules/payments/payment.service.js";

type OrderParams = {
  orderId: string;
};

type StripeSuccessQuery = {
  orderId?: string | string[];
  session_id?: string | string[];
};

type StripeCancelQuery = {
  orderId?: string | string[];
};

function isPresentString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseCheckoutRequest(body: unknown): CheckoutRequest {
  const input = body as Partial<CheckoutRequest>;

  if (!input.customer || !input.deliveryAddress || !Array.isArray(input.items)) {
    throw new OrderValidationError("Invalid checkout request");
  }

  if (
    !isPresentString(input.customer.firstName) ||
    !isPresentString(input.customer.lastName) ||
    !isPresentString(input.customer.email)
  ) {
    throw new OrderValidationError("Customer details are required");
  }

  if (
    !isPresentString(input.deliveryAddress.recipientName) ||
    !isPresentString(input.deliveryAddress.addressLine1) ||
    !isPresentString(input.deliveryAddress.suburb) ||
    !isPresentString(input.deliveryAddress.state) ||
    !isPresentString(input.deliveryAddress.postcode)
  ) {
    throw new OrderValidationError("Delivery address is required");
  }

  if (
    input.items.length === 0 ||
    input.items.some(
      (item) =>
        !isPresentString(item.productId) ||
        typeof item.quantity !== "number" ||
        item.quantity < 1,
    )
  ) {
    throw new OrderValidationError("Cart items are required");
  }

  return input as CheckoutRequest;
}

function getStringQuery(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function resolvePublicOrigin(request: FastifyRequest) {
  const requestOrigin = getStringQuery(request.headers.origin);

  if (requestOrigin) {
    return requestOrigin;
  }

  const forwardedProto = getStringQuery(request.headers["x-forwarded-proto"])
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = getStringQuery(request.headers["x-forwarded-host"])
    ?.split(",")[0]
    ?.trim();
  const host = (forwardedHost ?? request.headers.host)?.split(",")[0]?.trim();

  if (!host) {
    throw new OrderValidationError("Unable to resolve checkout redirect host");
  }

  return `${forwardedProto ?? "http"}://${host}`;
}

function handleCheckoutRouteError(error: unknown): never {
  if (
    error instanceof OrderValidationError ||
    error instanceof PaymentValidationError
  ) {
    throw new HttpError(400, error.message);
  }

  throw error;
}

export async function storefrontOrdersRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireCustomer }, async (request) => {
    if (!request.customer) {
      throw new HttpError(401, "Not authorized");
    }

    const response: OrderHistoryResponse = {
      orders: await listOrdersForCustomer(request.customer.id),
    };

    return response;
  });

  app.get<{ Querystring: StripeSuccessQuery }>(
    "/checkout/stripe/success",
    async (request, reply) => {
      try {
        const orderId = getStringQuery(request.query.orderId);
        const sessionId = getStringQuery(request.query.session_id);

        if (!isPresentString(orderId) || !isPresentString(sessionId)) {
          throw new OrderValidationError("Invalid checkout confirmation");
        }

        const order = await confirmStripeCheckoutOrder(orderId, sessionId);

        return reply.redirect(
          `/checkout?payment=success&orderId=${encodeURIComponent(order.id)}&orderNumber=${encodeURIComponent(order.orderNumber)}`,
        );
      } catch (error) {
        handleCheckoutRouteError(error);
      }
    },
  );

  app.get<{ Querystring: StripeCancelQuery }>(
    "/checkout/stripe/cancel",
    async (request, reply) => {
      try {
        const orderId = getStringQuery(request.query.orderId);

        if (!isPresentString(orderId)) {
          throw new OrderValidationError("Invalid checkout cancellation");
        }

        await markStripeCheckoutCancelled(orderId);

        return reply.redirect(
          `/checkout?payment=cancelled&orderId=${encodeURIComponent(orderId)}`,
        );
      } catch (error) {
        handleCheckoutRouteError(error);
      }
    },
  );

  app.get<{ Params: OrderParams }>(
    "/:orderId",
    { preHandler: requireCustomer },
    async (request) => {
      if (!request.customer) {
        throw new HttpError(401, "Not authorized");
      }

      const order = await getOrderForCustomer(
        request.params.orderId,
        request.customer.id,
      );

      if (!order) {
        throw new HttpError(404, "Order not found");
      }

      const response: OrderDetailResponse = { order };
      return response;
    },
  );

  app.post<{ Body: CheckoutRequest }>("/checkout", async (request, reply) => {
    try {
      const checkoutRequest = parseCheckoutRequest(request.body);
      const response: CheckoutSessionResponse =
        await createCheckoutSessionForOrder(
          checkoutRequest,
          request.customer?.id ?? null,
          resolvePublicOrigin(request),
        );

      reply.status(201);
      return response;
    } catch (error) {
      handleCheckoutRouteError(error);
    }
  });
}
