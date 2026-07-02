import { env } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/db/connect.js";
import { orderNumberService } from "../src/modules/orders/order-number.service.js";
import { OrderModel } from "../src/modules/orders/order.model.js";

const missingOrderNumberQuery = {
  $or: [
    { orderNumber: { $exists: false } },
    { orderNumber: null },
    { orderNumber: "" },
  ],
};

async function main() {
  await connectDatabase(env.mongodbUri);

  try {
    const orders = await OrderModel.find(missingOrderNumberQuery)
      .sort({ createdAt: 1 })
      .exec();

    if (orders.length === 0) {
      console.log("No orders need order number backfill.");
      return;
    }

    for (const order of orders) {
      order.orderNumber = await orderNumberService.generateNext();
      await order.save();

      console.log(`Backfilled order ${order._id.toString()} -> ${order.orderNumber}`);
    }

    console.log(`Backfilled ${orders.length} order number(s).`);
  } finally {
    await disconnectDatabase();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
