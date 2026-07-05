import { startEmailWorker } from "./modules/email/email.worker.js";

const worker = startEmailWorker();

async function shutdown() {
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

console.log("Email worker started.");
