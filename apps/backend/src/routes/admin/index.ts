import type { FastifyInstance } from "fastify";

import { adminAuthRoutes } from "./auth.js";
import { adminCustomersRoutes } from "./customers.js";
import { adminNotificationsRoutes } from "./notifications/index.js";
import { adminOrdersRoutes } from "./orders.js";
import { adminProductsRoutes } from "./products.js";
import { adminSettingsRoutes } from "./settings.js";

export async function adminRoutes(app: FastifyInstance) {
  await app.register(adminAuthRoutes, { prefix: "/auth" });
  await app.register(adminCustomersRoutes, { prefix: "/customers" });
  await app.register(adminNotificationsRoutes, { prefix: "/notifications" });
  await app.register(adminOrdersRoutes, { prefix: "/orders" });
  await app.register(adminProductsRoutes, { prefix: "/products" });
  await app.register(adminSettingsRoutes, { prefix: "/settings" });
}
