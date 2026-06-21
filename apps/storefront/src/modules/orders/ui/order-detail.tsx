import type { Order } from "@otbt/types";

import { Link } from "@otbt/web";

import { ProductImageWell } from "../../common/product-image-well";
import { StorefrontPage } from "../../common/storefront-page";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(price);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatOrderStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function addressLines(order: Order) {
  return [
    order.deliveryAddress.recipientName,
    order.deliveryAddress.addressLine1,
    order.deliveryAddress.addressLine2,
    `${order.deliveryAddress.suburb} ${order.deliveryAddress.state} ${order.deliveryAddress.postcode}`,
  ].filter(Boolean);
}

type OrderDetailProps = {
  order: Order;
};

export function OrderDetail({ order }: OrderDetailProps) {
  const displayReference = order.orderNumber;

  return (
    <StorefrontPage
      breadcrumbs={[
        { label: "Account" },
        { label: "Orders", to: "/orders" },
        { label: `Order ${displayReference}` },
      ]}
    >
      <section className="mt-4">
        <Link className="text-sm font-medium text-muted-foreground" to="/orders">
          Back to orders
        </Link>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-foreground">
              Order {displayReference}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Placed {formatDate(order.createdAt)}
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {formatOrderStatus(order.status)}
          </span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">Items</h2>
            <div className="mt-4 divide-y">
              {order.items.map((item) => (
                <div
                  className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_80px_110px] sm:items-start"
                  key={item.productId}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <ProductImageWell
                      alt={item.name}
                      className="size-[60px] rounded-[5px]"
                      imageClassName="size-[50px]"
                      imageUrl={item.imageUrl}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        SKU {item.sku}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Qty {item.quantity}
                  </p>
                  <p className="text-sm font-semibold text-foreground sm:text-right">
                    {formatPrice(item.lineTotal)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">Total</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t pt-3 text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">
                Delivery
              </h2>
              <div className="mt-4 space-y-1 text-sm leading-6 text-muted-foreground">
                {addressLines(order).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              {order.deliveryAddress.instructions ? (
                <p className="mt-4 border-t pt-4 text-sm leading-6 text-muted-foreground">
                  {order.deliveryAddress.instructions}
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </section>
    </StorefrontPage>
  );
}
