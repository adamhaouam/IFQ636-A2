import { queueEmailJob, type EmailJob } from "./email.queue.js";

export interface EmailDispatcher {
  dispatch(job: EmailJob): void;
}

class BullMqEmailDispatcher implements EmailDispatcher {
  dispatch(job: EmailJob) {
    queueEmailJob(job);
  }
}

export const emailDispatcher = new BullMqEmailDispatcher();
