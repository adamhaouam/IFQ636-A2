import { randomUUID } from "node:crypto";

import type { ServerEventEnvelope, ServerEventInput } from "./events.js";
import { serverEventHub } from "./hub.js";

export class ServerEventBroadcaster {
  create(input: ServerEventInput): ServerEventEnvelope {
    return {
      ...input,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };
  }

  publish(input: ServerEventInput): ServerEventEnvelope {
    const event = this.create(input);
    serverEventHub.publish(event);
    return event;
  }
}

export const serverEventBroadcaster = new ServerEventBroadcaster();
