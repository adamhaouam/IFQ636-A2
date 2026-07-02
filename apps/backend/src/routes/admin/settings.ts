import type {
  StoreSettingsResponse,
  StoreSettingsUpdate,
} from "@otbt/types";
import type { FastifyInstance } from "fastify";

import { HttpError } from "../../middleware/error-handler.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import { StoreSettings } from "../../modules/settings/index.js";

function handleSettingsRouteError(error: unknown): never {
  if (error instanceof Error) {
    throw new HttpError(400, error.message);
  }

  throw error;
}

export async function adminSettingsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAdmin }, async () => {
    const settings = StoreSettings.getInstance();
    const response: StoreSettingsResponse = {
      settings: await settings.getSettings(),
    };

    return response;
  });

  app.patch<{ Body: StoreSettingsUpdate }>(
    "/",
    { preHandler: requireAdmin },
    async (request) => {
      try {
        const settings = StoreSettings.getInstance();
        const response: StoreSettingsResponse = {
          settings: await settings.updateSettings(request.body ?? {}),
        };

        return response;
      } catch (error) {
        handleSettingsRouteError(error);
      }
    },
  );
}
