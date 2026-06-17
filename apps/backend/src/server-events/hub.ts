import type { FastifyReply } from "fastify";

import type { ServerEventEnvelope } from "./events.js";

type Client = {
  channel: string;
  write(event: ServerEventEnvelope): void;
  close(): void;
};

const HEARTBEAT_MS = 25_000;

function toFrame(event: ServerEventEnvelope) {
  return `id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`;
}

export class ServerEventHub {
  private readonly clients = new Set<Client>();

  connect(channel: string, reply: FastifyReply) {
    reply.hijack();
    reply.raw.writeHead(200, {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    });

    const heartbeat = setInterval(() => {
      reply.raw.write(`: heartbeat ${new Date().toISOString()}\n\n`);
    }, HEARTBEAT_MS);

    const client: Client = {
      channel,
      write: (event) => {
        reply.raw.write(toFrame(event));
      },
      close: () => {
        clearInterval(heartbeat);
        this.clients.delete(client);
      },
    };

    this.clients.add(client);
    reply.raw.on("close", client.close);
    reply.raw.write(": connected\n\n");
  }

  publish(event: ServerEventEnvelope) {
    for (const client of this.clients) {
      if (client.channel === event.channel) {
        client.write(event);
      }
    }
  }
}

export const serverEventHub = new ServerEventHub();
