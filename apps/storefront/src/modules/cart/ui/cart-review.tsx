import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button, Input } from "@otbt/ui";
import { Link } from "@otbt/web";

import { ProductImageWell } from "../../common/product-image-well";
import { StorefrontEmptyState } from "../../common/storefront-empty-state";
import { StorefrontPage } from "../../common/storefront-page";
import {
  clearCartItems,
  removeCartItem,
  updateCartItemQuantity,
  useCart,
  useCartQuoteQuery,
} from "..";

const cartBreadcrumbs = [
  { label: "Collection", to: "/" },
  { label: "Cart" },
] as const;

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(price);
}

export function CartReview() {
  const cart = useCart();
  const cartQuoteQuery = useCartQuoteQuery(cart.items);
  const quote = cartQuoteQuery.data;
  const quotedItemsByProductId = new Map(
    quote?.items.map((item) => [item.productId, item]) ?? [],
  );
  const subtotal = quote?.subtotal ?? cart.subtotal;

  if (cart.items.length === 0) {
    return (
      <StorefrontPage breadcrumbs={[...cartBreadcrumbs]}>
        <div className="mt-4">
          <StorefrontEmptyState
            description="Browse the collection and add selected arrangements before checkout."
            icon={ShoppingCart}
            label="Cart empty"
            title="Your cart is empty."
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
    <StorefrontPage breadcrumbs={[...cartBreadcrumbs]}>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <h1 className="text-4xl font-semibold text-foreground">Your cart</h1>
          <div className="mt-8 divide-y rounded-lg border bg-card">
            {cart.items.map((item) => {
              const quotedItem = quotedItemsByProductId.get(item.productId);
              const displayPrice = quotedItem?.finalPrice ?? item.price;
              const displayLineTotal = quotedItem?.lineTotal ?? item.lineTotal;
              const hasDiscount = Boolean(
                quotedItem?.membershipDiscountApplied &&
                  quotedItem.basePrice > quotedItem.finalPrice,
              );

              return (
                <article
                  className="grid gap-4 p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
                  key={item.productId}
                >
                  <ProductImageWell
                    alt={item.name}
                    className="size-24 rounded-md"
                    imageClassName="size-[74px]"
                    imageUrl={item.imageUrl}
                  />

                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">
                      {item.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatPrice(displayPrice)}
                      {hasDiscount && quotedItem ? (
                        <span className="ml-2 text-xs line-through">
                          {formatPrice(quotedItem.basePrice)}
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() =>
                          updateCartItemQuantity(
                            item.productId,
                            item.quantity - 1,
                          )
                        }
                        size="icon"
                        type="button"
                        variant="outline"
                      >
                        <Minus className="size-4" />
                        <span className="sr-only">Decrease quantity</span>
                      </Button>
                      <Input
                        aria-label={`Quantity for ${item.name}`}
                        className="h-9 w-16 text-center"
                        min="1"
                        onChange={(event) => {
                          const nextQuantity = Number(event.currentTarget.value);

                          if (
                            !Number.isFinite(nextQuantity) ||
                            nextQuantity < 1
                          ) {
                            return;
                          }

                          updateCartItemQuantity(item.productId, nextQuantity);
                        }}
                        type="number"
                        value={item.quantity}
                      />
                      <Button
                        onClick={() =>
                          updateCartItemQuantity(
                            item.productId,
                            item.quantity + 1,
                          )
                        }
                        size="icon"
                        type="button"
                        variant="outline"
                      >
                        <Plus className="size-4" />
                        <span className="sr-only">Increase quantity</span>
                      </Button>
                      <Button
                        onClick={() => removeCartItem(item.productId)}
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-foreground">
                    {formatPrice(displayLineTotal)}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Summary</h2>
          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-base font-semibold text-foreground">
              {formatPrice(subtotal)}
            </span>
          </div>
          <Button asChild className="mt-5 w-full">
            <Link to="/checkout" unstyled>
              Checkout
            </Link>
          </Button>
          <Button
            className="mt-2 w-full"
            onClick={clearCartItems}
            type="button"
            variant="ghost"
          >
            Clear cart
          </Button>
        </aside>
      </div>
    </StorefrontPage>
  );
}
