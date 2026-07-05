import { cp, readdir, rm } from "node:fs/promises";

import { build } from "esbuild";

const external = [
  "@fastify/cors",
  "@fastify/multipart",
  "@fastify/static",
  "@paypal/paypal-server-sdk",
  "bcryptjs",
  "bullmq",
  "dotenv",
  "fastify",
  "ioredis",
  "jsonwebtoken",
  "mongoose",
  "nodemailer",
  "stripe",
];

await rm("dist", { force: true, recursive: true });

await build({
  bundle: true,
  entryPoints: ["src/server.ts"],
  external,
  format: "esm",
  logLevel: "info",
  outfile: "dist/server.js",
  packages: "bundle",
  platform: "node",
  sourcemap: true,
  target: "node24",
});

await build({
  bundle: true,
  entryPoints: ["src/email-worker.ts"],
  external,
  format: "esm",
  logLevel: "info",
  outfile: "dist/email-worker.js",
  packages: "bundle",
  platform: "node",
  sourcemap: true,
  target: "node24",
});

await cp("src/modules/email/templates", "dist/email-templates", {
  recursive: true,
});

const moduleEntries = await readdir("src/modules", { withFileTypes: true });

await Promise.all(
  moduleEntries
    .filter((entry) => entry.isDirectory() && entry.name !== "email")
    .map(async (entry) => {
      const moduleDir = `src/modules/${entry.name}`;

      try {
        await cp(
          `${moduleDir}/emails/templates`,
          `dist/module-emails/${entry.name}/templates`,
          { recursive: true },
        );
      } catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
          throw error;
        }
      }
    }),
);
