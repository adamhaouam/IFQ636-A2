import path from "node:path";

import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

const required = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string) => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : undefined;
};

const booleanValue = (key: string, fallback: boolean) => {
  const value = optional(key);

  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const numberValue = (key: string, fallback?: number) => {
  const value = optional(key);

  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric environment variable: ${key}`);
  }

  return parsed;
};

export const env = {
  host: process.env.BACKEND_HOST ?? "0.0.0.0",
  port: Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3000),
  clientOrigins: (process.env.CLIENT_ORIGINS ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  get mongodbUri() {
    return required("MONGODB_URI");
  },
  get adminJwtSecret() {
    return required("ADMIN_JWT_SECRET");
  },
  get stripeSecretKey() {
    return required("STRIPE_SECRET_KEY");
  },
  get paypalSecretKey() {
    return required("PAYPAL_SECRET_KEY");
  },
  get paypalClientId() {
    return required("PAYPAL_CLIENT_ID");
  },
  uploadsDir: process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), "uploads"),
  email: {
    enabled: booleanValue("EMAIL_ENABLED", false),
    host: optional("SMTP_HOST"),
    port: numberValue("SMTP_PORT"),
    user: optional("SMTP_USER"),
    pass: optional("SMTP_PASS"),
    from: optional("SMTP_FROM"),
  },
};
