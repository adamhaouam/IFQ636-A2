import Fastify, { type FastifyInstance } from "fastify";

type RegisterRoutes = (app: FastifyInstance) => Promise<void> | void;

export async function buildTestApp(registerRoutes: RegisterRoutes) {
  const app = Fastify();

  await registerRoutes(app);
  await app.ready();

  return app;
}
