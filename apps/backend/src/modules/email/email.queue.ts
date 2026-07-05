import type { Customer, Order, OrderStatus } from "@otbt/types";
import { Queue } from "bullmq";

import { env } from "../../config/env.js";

export type EmailJob =
  | {
      customer: Customer;
      type: "customer-registration";
    }
  | {
      order: Order;
      type: "order-confirmation";
    }
  | {
      order: Order;
      previousStatus: OrderStatus;
      type: "order-status-update";
    };

export const emailQueueName = "email";

let emailQueue: Queue<EmailJob> | null = null;

function getEmailQueue() {
  if (!emailQueue) {
    emailQueue = new Queue<EmailJob>(emailQueueName, {
      connection: {
        host: env.redis.host,
        password: env.redis.password,
        port: env.redis.port,
      },
    });

    emailQueue.on("error", (error) => {
      console.error("Email queue error", error);
    });
  }

  return emailQueue;
}

export function enqueueEmailJob(job: EmailJob) {
  return getEmailQueue().add(job.type, job, {
    attempts: 3,
    backoff: {
      delay: 5_000,
      type: "exponential",
    },
    removeOnComplete: true,
    removeOnFail: 100,
  });
}

export function queueEmailJob(job: EmailJob) {
  void enqueueEmailJob(job).catch((error) => {
    console.error("Failed to enqueue email job", error);
  });
}
