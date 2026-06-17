import type { FastifyInstance } from "fastify";

import {
  serverEventBroadcaster,
  serverEventHub,
  type ServerEventLevel,
} from "../server-events/index.js";

type StreamQuery = {
  channel?: string;
};

type PublishBody = {
  channel?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  message?: string;
  level?: ServerEventLevel;
};

export async function serverEventRoutes(app: FastifyInstance) {
  app.get<{ Querystring: StreamQuery }>("/", async (request, reply) => {
    const channel = request.query.channel?.trim();
    if (!channel) {
      return reply.code(400).send({ error: "channel is required" });
    }

    serverEventHub.connect(channel, reply);
  });

  app.post<{ Body: PublishBody }>("/", async (request, reply) => {
    if (process.env.NODE_ENV === "production") {
      return reply.code(404).send({ error: "Not found" });
    }

    const body = request.body ?? {};
    const channel = body.channel?.trim();
    if (!channel) {
      return reply.code(400).send({ error: "channel is required" });
    }

    const resource = body.resource?.trim();
    if (!resource) {
      return reply.code(400).send({ error: "resource is required" });
    }

    const action = body.action?.trim();
    if (!action) {
      return reply.code(400).send({ error: "action is required" });
    }

    const message = body.message?.trim();
    const resourceId = body.resourceId?.trim();

    const event = serverEventBroadcaster.publish({
      action,
      channel,
      level: body.level,
      message,
      resource,
      resourceId,
    });

    return reply.code(202).send({ event });
  });
}
