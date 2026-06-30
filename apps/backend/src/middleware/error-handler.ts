import type { FastifyError, FastifyInstance } from "fastify";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | HttpError, _request, reply) => {
    if (error instanceof HttpError) {
      reply.status(error.status).send({ error: error.message });
      return;
    }

    const status = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    const message = status < 500 ? error.message : "Unexpected server error";

    reply.status(status).send({ error: message });
  });
}
