import { useParams } from "react-router";
import { AlertCircle, LogIn } from "lucide-react";

import { Button } from "@otbt/ui";
import { Link } from "@otbt/web";

import { StorefrontEmptyState } from "../../../modules/common/storefront-empty-state";
import { StorefrontPage } from "../../../modules/common/storefront-page";
import { getSessionToken } from "../../../modules/customers/auth/customer-auth.storage";
import { useOrderDetailQuery } from "../../../modules/orders/orders.query";
import { OrderDetail } from "../../../modules/orders/ui/order-detail";

const orderDetailBreadcrumbs = [
  { label: "Account" },
  { label: "Orders", to: "/orders" },
  { label: "Order" },
] as const;

export function OrderDetailPage() {
  const { orderId } = useParams();
  const hasSessionToken = Boolean(getSessionToken());
  const orderDetailQuery = useOrderDetailQuery(
    orderId ?? "",
    Boolean(orderId && hasSessionToken),
  );

  if (!hasSessionToken) {
    return (
      <StorefrontPage breadcrumbs={[...orderDetailBreadcrumbs]}>
        <div className="mt-4">
          <StorefrontEmptyState
            description="Sign in to view order details for your account."
            icon={LogIn}
            label="Sign in required"
            title="This order is private."
            actions={
              <Button asChild className="h-10 min-w-[168px] px-4">
                <Link to="/login" unstyled>
                  Sign in
                </Link>
              </Button>
            }
          />
        </div>
      </StorefrontPage>
    );
  }

  if (!orderId) {
    throw new Error("Order id is required");
  }

  if (orderDetailQuery.isLoading) {
    return (
      <StorefrontPage breadcrumbs={[...orderDetailBreadcrumbs]}>
        <div className="mt-4 rounded-lg border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading order...</p>
        </div>
      </StorefrontPage>
    );
  }

  if (orderDetailQuery.isError || !orderDetailQuery.data) {
    return (
      <StorefrontPage breadcrumbs={[...orderDetailBreadcrumbs]}>
        <div className="mt-4">
          <StorefrontEmptyState
            description="This order may not exist or is no longer available."
            icon={AlertCircle}
            label="Order unavailable"
            title="We could not load this order."
            actions={
              <Button asChild className="h-10 min-w-[168px] px-4" variant="outline">
                <Link to="/orders" unstyled>
                  Back to orders
                </Link>
              </Button>
            }
          />
        </div>
      </StorefrontPage>
    );
  }

  return <OrderDetail order={orderDetailQuery.data.order} />;
}
