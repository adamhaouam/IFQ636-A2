import type { AdminUser, LoginAdminDto, LoginAdminResponse } from "@otbt/types";
import type { FastifyInstance } from "fastify";

import { HttpError } from "../../middleware/error-handler.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import { AdminUser as AdminUserModel } from "../../modules/admin-users/admin-user.model.js";
import { verifyAdminPassword } from "../../modules/admin-users/admin-user.passwords.js";
import { generateAdminToken } from "../../modules/admin-users/admin-user.tokens.js";

const toAdminUser = (admin: { _id?: unknown; id?: string; email: string }): AdminUser => ({
  id: admin.id ?? String(admin._id),
  email: admin.email,
});

export async function adminAuthRoutes(app: FastifyInstance) {
  app.post<{ Body: Partial<LoginAdminDto> }>("/login", async (request) => {
    const { email, password } = request.body;

    if (!email || !password) {
      throw new HttpError(400, "Email and password are required");
    }

    const admin = await AdminUserModel.findOne({ email: email.toLowerCase() });
    const validPassword = admin
      ? await verifyAdminPassword(password, admin.passwordHash)
      : false;

    if (!admin || !validPassword) {
      throw new HttpError(401, "Invalid admin credentials");
    }

    const response: LoginAdminResponse = {
      ...toAdminUser(admin),
      token: generateAdminToken({ id: admin.id, email: admin.email }),
    };

    return response;
  });

  app.get("/me", { preHandler: requireAdmin }, async (request) => {
    if (!request.admin) {
      throw new HttpError(401, "Not authorized");
    }

    return toAdminUser(request.admin);
  });

  app.post("/logout", { preHandler: requireAdmin }, async (_request, reply) => {
    return reply.status(204).send();
  });
}
