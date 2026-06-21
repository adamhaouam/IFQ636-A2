import { useLoaderData } from "react-router";
import { Link } from "@otbt/web";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@otbt/ui";

import { OrderDetail, useOrderDetail } from "../../../modules/orders";

type OrderDetailLoaderData = {
  orderId: string;
};

export function OrderDetailPage() {
  const { orderId } = useLoaderData() as OrderDetailLoaderData;
  const { order } = useOrderDetail(orderId);

  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                to="/orders"
                unstyled
              >
                Orders
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{order.orderNumber}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-2">
          <h1 className="break-all text-3xl font-semibold tracking-tight text-foreground">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Review customer, delivery, item, and fulfilment details.
          </p>
        </div>
      </div>

      <OrderDetail order={order} />
    </section>
  );
}
