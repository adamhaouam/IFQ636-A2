import { Worker } from "bullmq";

import { env } from "../../config/env.js";
import {
  sendCustomerRegistrationEmail,
} from "../customers/emails/customer-email.service.js";
import {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
} from "../orders/emails/order-email.service.js";
import { emailQueueName, type EmailJob } from "./email.queue.js";

export function startEmailWorker() {
  const worker = new Worker<EmailJob>(
    emailQueueName,
    async (job) => {
      if (job.data.type === "customer-registration") {
        return await sendCustomerRegistrationEmail(job.data.customer);
      }

      if (job.data.type === "order-confirmation") {
        return await sendOrderConfirmationEmail(job.data.order);
      }

      return await sendOrderStatusUpdateEmail(
        job.data.order,
        job.data.previousStatus,
      );
    },
    {
      connection: {
        host: env.redis.host,
        password: env.redis.password,
        port: env.redis.port,
      },
    },
  );

  worker.on("completed", (job) => {
    console.log(`Email job completed: ${job.name} ${job.id ?? ""}`.trim());
  });

  worker.on("failed", (job, error) => {
    console.error(`Email job failed: ${job?.name ?? "unknown"}`, error);
  });

  return worker;
}
