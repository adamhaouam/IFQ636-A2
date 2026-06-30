import type {
  CurrentCustomerResponse,
  LoginCustomerDto,
  LoginCustomerResponse,
} from "@otbt/types";
import type { FastifyInstance } from "fastify";

import { HttpError } from "../../middleware/error-handler.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { findCustomerByCredentials } from "../../modules/customers/customer.service.js";
import { generateCustomerToken } from "../../modules/customers/customer.tokens.js";

export async function storefrontAuthRoutes(app: FastifyInstance) {
  app.post<{ Body: Partial<LoginCustomerDto> }>("/login", async (request) => {
    const { email, password } = request.body;

    if (!email || !password) {
      throw new HttpError(400, "Email and password are required");
    }

    const customer = await findCustomerByCredentials(email, password);

    if (!customer) {
      throw new HttpError(401, "Invalid customer credentials");
    }

    const response: LoginCustomerResponse = {
      customer,
      token: generateCustomerToken({ id: customer.id, email: customer.email }),
    };

    return response;
  });

  app.get("/me", { preHandler: requireCustomer }, async (request) => {
    if (!request.customer) {
      throw new HttpError(401, "Not authorized");
    }

    const response: CurrentCustomerResponse = { customer: request.customer };
    return response;
  });

  app.post("/logout", { preHandler: requireCustomer }, async (_request, reply) => {
    return reply.status(204).send();
  });
}
