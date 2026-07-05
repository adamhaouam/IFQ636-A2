import type { ComponentProps } from "react";

import type { Order, OrderStatus } from "@otbt/types";
import { Badge } from "@otbt/ui";

import { useUpdateOrderStatus } from "../orders.hooks";
import { OrderStatusForm } from "./order-status-form";

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  currency: "AUD",
  style: "currency",
});

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

function formatAddress(order: Order) {
  return [
    order.deliveryAddress.addressLine1,
    order.deliveryAddress.addressLine2,
    `${order.deliveryAddress.suburb}, ${order.deliveryAddress.state} ${order.deliveryAddress.postcode}`,
  ].filter(Boolean);
}

export function OrderDetail({ order }: { order: Order }) {
  const status = statusConfig[order.status];
  const paymentStatus = paymentStatusConfig[order.payment?.status ?? "pending"];
  const updateOrderStatus = useUpdateOrderStatus(order.id);

  async function saveStatus(nextStatus: OrderStatus) {
    await updateOrderStatus.mutateAsync({ status: nextStatus });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border bg-background p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Order items</h2>
            <p className="text-sm text-muted-foreground">
              {order.items.length} submitted item{order.items.length === 1 ? "" : "s"}
            </p>
          </div>
          <Badge className="w-fit" variant={status.variant}>
            {status.label}
          </Badge>
        </div>

        <div className="mt-6 divide-y">
          {order.items.map((item) => (
            <div className="flex items-center gap-4 py-4" key={item.productId}>
              {item.imageUrl ? (
                <img
                  alt={item.name}
                  className="size-14 shrink-0 rounded-md border object-cover"
                  src={item.imageUrl}
                />
              ) : (
                <div className="size-14 shrink-0 rounded-md border bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Qty {item.quantity} · SKU {item.sku}
                </p>
              </div>
              <p className="shrink-0 font-medium text-foreground">
                {currencyFormatter.format(item.lineTotal)}
              </p>
            </div>
          ))}
        </div>

        <dl className="mt-6 border-t pt-4 text-sm">
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium text-foreground">
              {currencyFormatter.format(order.subtotal)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-1 text-base">
            <dt className="font-semibold text-foreground">Total</dt>
            <dd className="font-semibold text-foreground">
              {currencyFormatter.format(order.total)}
            </dd>
          </div>
        </dl>
      </section>

      <aside className="space-y-6">
        <section className="rounded-lg border bg-background p-6 shadow-xs">
          <h2 className="text-lg font-semibold text-foreground">Fulfilment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update the order status shown to customers.
          </p>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-md border px-3 py-2">
            <span className="text-sm font-medium text-foreground">Payment</span>
            <Badge
              className={paymentStatus.className}
              variant={paymentStatus.variant}
            >
              {paymentStatus.label}
            </Badge>
          </div>
          <div className="mt-4">
            <OrderStatusForm
              defaultStatus={order.status}
              error={updateOrderStatus.error}
              onSubmit={saveStatus}
              submitting={updateOrderStatus.isPending}
            />
          </div>
        </section>

        <section className="rounded-lg border bg-background p-6 shadow-xs">
          <h2 className="text-lg font-semibold text-foreground">Customer</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-foreground">
                {order.customer.firstName} {order.customer.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all font-medium text-foreground">
                {order.customer.email}
              </dd>
            </div>
            {order.customer.phone ? (
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium text-foreground">{order.customer.phone}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="rounded-lg border bg-background p-6 shadow-xs">
          <h2 className="text-lg font-semibold text-foreground">Delivery</h2>
          <div className="mt-4 space-y-1 text-sm text-foreground">
            <p className="font-medium">{order.deliveryAddress.recipientName}</p>
            {formatAddress(order).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {order.deliveryAddress.instructions ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {order.deliveryAddress.instructions}
            </p>
          ) : null}
        </section>

        <section className="rounded-lg border bg-background p-6 shadow-xs">
          <h2 className="text-lg font-semibold text-foreground">Timeline</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium text-foreground">
                {new Date(order.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="font-medium text-foreground">
                {new Date(order.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
