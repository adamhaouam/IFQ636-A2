import type { ComponentProps } from "react";
import { Link } from "react-router";

import type { AdminOrderListItem, OrderStatus } from "@otbt/types";
import { Badge } from "@otbt/ui";

interface OrderListProps {
  orders: AdminOrderListItem[];
}

const statusConfig: Record<
  OrderStatus,
  { variant: ComponentProps<typeof Badge>["variant"]; label: string }
> = {
  pending: { variant: "secondary", label: "Pending" },
  packed: { variant: "default", label: "Packed" },
  shipped: { variant: "outline", label: "Shipped" },
};

const paymentStatusConfig: Record<
  string,
  {
    className: string;
    label: string;
    variant: ComponentProps<typeof Badge>["variant"];
  }
> = {
  failed: {
    className: "border-transparent bg-red-100 text-red-700 hover:bg-red-100",
    label: "Cancelled",
    variant: "secondary",
  },
  paid: {
    className: "border-transparent bg-green-100 text-green-700 hover:bg-green-100",
    label: "Approved",
    variant: "secondary",
  },
  pending: {
    className:
      "border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100",
    label: "Awaiting payment",
    variant: "secondary",
  },
};

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  currency: "AUD",
  style: "currency",
});

export function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-md border bg-background px-4 py-10 text-center">
        <p className="text-sm font-medium text-foreground">No orders found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Submitted checkout orders will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <table className="w-full min-w-[1060px] table-fixed caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-12 w-[20%] px-4 text-left align-middle font-medium text-muted-foreground">
              Order
            </th>
            <th className="h-12 w-[21%] px-4 text-left align-middle font-medium text-muted-foreground">
              Customer
            </th>
            <th className="h-12 w-[21%] px-4 text-left align-middle font-medium text-muted-foreground">
              Items
            </th>
            <th className="h-12 w-[10%] px-4 text-left align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 w-[10%] px-4 text-left align-middle font-medium text-muted-foreground">
              Payment
            </th>
            <th className="h-12 w-[10%] px-4 text-right align-middle font-medium text-muted-foreground">
              Total
            </th>
            <th className="h-12 w-[8%] px-4 text-right align-middle font-medium text-muted-foreground">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            const paymentStatus =
              paymentStatusConfig[order.paymentStatus ?? "pending"];
            
            return (
              <tr
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                key={order.id}
              >
                <td className="p-4 align-middle">
                  <Link
                    className="font-medium text-foreground transition-colors hover:text-primary"
                    to={`/orders/${order.id}`}
                  >
                    {order.reference}
                  </Link>
                </td>
                <td className="p-4 align-middle">
                  <p className="font-medium text-foreground">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                </td>
                <td className="p-4 align-middle text-muted-foreground">
                  {order.itemSummary}
                </td>
                <td className="whitespace-nowrap p-4 align-middle">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="whitespace-nowrap p-4 align-middle">
                  {paymentStatus ? (
                    <Badge
                      className={paymentStatus.className}
                      variant={paymentStatus.variant}
                    >
                      {paymentStatus.label}
                    </Badge>
                  ) : null}
                </td>
                <td className="p-4 text-right align-middle font-medium">
                  <p className="font-medium text-foreground">
                    {currencyFormatter.format(order.total)}
                  </p>
                </td>
                <td className="whitespace-nowrap p-4 text-right align-middle text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
