import { type FormEvent, useEffect, useState } from "react";
import { CircleCheck, ShoppingCart } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import type { CheckoutRequest } from "@otbt/types";
import { Button, Input } from "@otbt/ui";
import { Link } from "@otbt/web";

import { clearCartItems, useCart } from "../../cart";
import { ProductImageWell } from "../../common/product-image-well";
import { StorefrontEmptyState } from "../../common/storefront-empty-state";
import { StorefrontPage } from "../../common/storefront-page";
import { currentCustomerQueryOptions } from "../../customers/auth/customer-auth.query";
import { useCheckoutMutation } from "../checkout.query";

type CheckoutFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  paymentMethod: "stripe" | "paypal";
  recipientName: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
  instructions: string;
};

const checkoutBreadcrumbs = [
  { label: "Collection", to: "/" },
  { label: "Cart", to: "/cart" },
  { label: "Checkout" },
] as const;

const initialCheckoutFormState: CheckoutFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  paymentMethod: "stripe",
  recipientName: "",
  addressLine1: "",
  addressLine2: "",
  suburb: "",
  state: "",
  postcode: "",
  instructions: "",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(price);
}

function optionalValue(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function buildCheckoutRequest(
  form: CheckoutFormState,
  cart: ReturnType<typeof useCart>,
): CheckoutRequest {
  return {
    customer: {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: optionalValue(form.phone),
    },
    deliveryAddress: {
      recipientName: form.recipientName.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: optionalValue(form.addressLine2),
      suburb: form.suburb.trim(),
      state: form.state.trim(),
      postcode: form.postcode.trim(),
      instructions: optionalValue(form.instructions),
    },
    items: cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    paymentMethod: form.paymentMethod,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Checkout failed";
}

export function CheckoutForm() {
  const cart = useCart();
  const checkoutMutation = useCheckoutMutation();
  const currentCustomerQuery = useQuery(currentCustomerQueryOptions());
  const currentCustomer = currentCustomerQuery.data?.customer;
  const [form, setForm] = useState(initialCheckoutFormState);
  const [completedOrderId] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("payment") === "success"
      ? searchParams.get("orderId")
      : null;
  });
  const [cancelledOrderId] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("payment") === "cancelled"
      ? searchParams.get("orderId")
      : null;
  });

  useEffect(() => {
    if (completedOrderId) {
      clearCartItems();
    }
  }, [completedOrderId]);

  useEffect(() => {
    if (!currentCustomer) {
      return;
    }

    const fullName = `${currentCustomer.firstName} ${currentCustomer.lastName}`;

    setForm((currentForm) => ({
      ...currentForm,
      email: currentForm.email || currentCustomer.email,
      firstName: currentForm.firstName || currentCustomer.firstName,
      lastName: currentForm.lastName || currentCustomer.lastName,
      recipientName: currentForm.recipientName || fullName,
    }));
  }, [currentCustomer]);

  function updateField(field: keyof CheckoutFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cart.items.length === 0) {
      return;
    }

    try {
      const response = await checkoutMutation.mutateAsync(
        buildCheckoutRequest(form, cart),
      );

      window.location.assign(response.redirectUrl);
    } catch {
      // Mutation state renders the checkout error.
    }
  }

  if (completedOrderId) {
    return (
      <StorefrontPage breadcrumbs={[...checkoutBreadcrumbs]}>
        <div className="mt-4">
          <StorefrontEmptyState
            description={
              <>
                Your order reference is{" "}
                <span className="font-medium text-foreground">
                  {completedOrderId}
                </span>
                . We will prepare your arrangement for delivery.
              </>
            }
            icon={CircleCheck}
            label="Payment received"
            title="Your order has been placed."
            actions={
              <Button asChild className="h-10 min-w-[168px] px-4">
                <Link to="/" unstyled>
                  Browse catalogue
                </Link>
              </Button>
            }
          />
        </div>
      </StorefrontPage>
    );
  }

  if (cart.items.length === 0) {
    return (
      <StorefrontPage breadcrumbs={[...checkoutBreadcrumbs]}>
        <div className="mt-4">
          <StorefrontEmptyState
            description="Add arrangements to your cart before continuing to checkout."
            icon={ShoppingCart}
            label="Cart empty"
            title="Nothing to checkout yet."
            actions={
              <Button asChild className="h-10 min-w-[168px] px-4">
                <Link to="/" unstyled>
                  Browse catalogue
                </Link>
              </Button>
            }
          />
        </div>
      </StorefrontPage>
    );
  }

  return (
    <StorefrontPage breadcrumbs={[...checkoutBreadcrumbs]}>
      <div className="mb-8 mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Checkout</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Add delivery details and submit your order.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/cart" unstyled>
            Back to cart
          </Link>
        </Button>
      </div>

      <form
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
        onSubmit={handleSubmit}
      >
        <section className="rounded-lg border bg-card p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Contact details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                First name
                <Input
                  autoComplete="given-name"
                  name="firstName"
                  onChange={(event) =>
                    updateField("firstName", event.currentTarget.value)
                  }
                  required
                  value={form.firstName}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Last name
                <Input
                  autoComplete="family-name"
                  name="lastName"
                  onChange={(event) =>
                    updateField("lastName", event.currentTarget.value)
                  }
                  required
                  value={form.lastName}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
                Email
                <Input
                  autoComplete="email"
                  name="email"
                  onChange={(event) =>
                    updateField("email", event.currentTarget.value)
                  }
                  required
                  type="email"
                  value={form.email}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
                Phone
                <Input
                  autoComplete="tel"
                  name="phone"
                  onChange={(event) =>
                    updateField("phone", event.currentTarget.value)
                  }
                  type="tel"
                  value={form.phone}
                />
              </label>
            </div>
          </div>
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold text-foreground">
              Payment Method
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-input bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/40">
                <input
                  checked={form.paymentMethod === "stripe"}
                  className="size-4 accent-foreground"
                  name="paymentMethod"
                  onChange={(event) =>
                    updateField("paymentMethod", event.currentTarget.value)
                  }
                  type="radio"
                  value="stripe"
                />
                Credit Card
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-input bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/40">
                <input
                  checked={form.paymentMethod === "paypal"}
                  className="size-4 accent-foreground"
                  name="paymentMethod"
                  onChange={(event) =>
                    updateField("paymentMethod", event.currentTarget.value)
                  }
                  type="radio"
                  value="paypal"
                />
                PayPal
              </label>
            </div>
          </div>
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold text-foreground">
              Delivery details
            </h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Recipient name
                <Input
                  autoComplete="shipping name"
                  name="recipientName"
                  onChange={(event) =>
                    updateField("recipientName", event.currentTarget.value)
                  }
                  required
                  value={form.recipientName}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Address line 1
                <Input
                  autoComplete="shipping address-line1"
                  name="addressLine1"
                  onChange={(event) =>
                    updateField("addressLine1", event.currentTarget.value)
                  }
                  required
                  value={form.addressLine1}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Address line 2
                <Input
                  autoComplete="shipping address-line2"
                  name="addressLine2"
                  onChange={(event) =>
                    updateField("addressLine2", event.currentTarget.value)
                  }
                  value={form.addressLine2}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px_140px]">
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Suburb
                  <Input
                    autoComplete="shipping address-level2"
                    name="suburb"
                    onChange={(event) =>
                      updateField("suburb", event.currentTarget.value)
                    }
                    required
                    value={form.suburb}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  State
                  <Input
                    autoComplete="shipping address-level1"
                    name="state"
                    onChange={(event) =>
                      updateField("state", event.currentTarget.value)
                    }
                    required
                    value={form.state}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  Postcode
                  <Input
                    autoComplete="shipping postal-code"
                    name="postcode"
                    onChange={(event) =>
                      updateField("postcode", event.currentTarget.value)
                    }
                    required
                    value={form.postcode}
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Delivery instructions
                <textarea
                  className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onChange={(event) =>
                    updateField("instructions", event.currentTarget.value)
                  }
                  value={form.instructions}
                />
              </label>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">
            Order summary
          </h2>
          <div className="mt-5 divide-y border-y">
            {cart.items.map((item) => (
              <div className="py-4" key={item.productId}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <ProductImageWell
                      alt={item.name}
                      className="size-[50px] rounded-[5px]"
                      imageClassName="size-[42px]"
                      imageUrl={item.imageUrl}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatPrice(item.lineTotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-base font-semibold text-foreground">
              {formatPrice(cart.subtotal)}
            </span>
          </div>
          {cancelledOrderId ? (
            <p className="mt-4 text-sm text-destructive">
              Payment was cancelled. Your order was not completed.
            </p>
          ) : null}
          {checkoutMutation.isError ? (
            <p className="mt-4 text-sm text-destructive">
              {getErrorMessage(checkoutMutation.error)}
            </p>
          ) : null}
          <Button
            className="mt-5 w-full"
            disabled={checkoutMutation.isPending}
            type="submit"
          >
            {checkoutMutation.isPending
              ? "Preparing payment..."
              : "Continue to payment"}
          </Button>
        </aside>
      </form>
    </StorefrontPage>
  );
}
