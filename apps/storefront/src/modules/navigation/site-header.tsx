import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, ReceiptText, ShoppingCart } from "lucide-react";

import { Link } from "@otbt/web";
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@otbt/ui";

import {
  currentCustomerQueryOptions,
  invalidateCustomerSessionQueries,
  useLogoutCustomerMutation,
} from "../customers/auth/customer-auth.query";
import {
  clearSessionToken,
  getSessionToken,
} from "../customers/auth/customer-auth.storage";
import { useCart } from "../cart";

type StorefrontNavItem = {
  label: string;
  to: string;
};

type StorefrontActionLink = {
  label: string;
  href: string;
  variant: "ghost" | "outline" | "default";
};

const storefrontNavItems: StorefrontNavItem[] = [
  { label: "Collection", to: "/" },
  { label: "Occasions", to: "/occasions" },
  { label: "About", to: "/about" },
];

const storefrontAuthLinks: StorefrontActionLink[] = [
  { label: "Sign in", href: "/login", variant: "ghost" },
  { label: "Create account", href: "/register", variant: "default" },
];

function isNavItemActive(item: StorefrontNavItem, pathname: string): boolean {
  if (item.to === "/") {
    return pathname === "/" || pathname.startsWith("/products/");
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function getCustomerInitials(firstName?: string, lastName?: string) {
  const first = firstName?.trim().charAt(0).toUpperCase() ?? "";
  const last = lastName?.trim().charAt(0).toUpperCase() ?? "";
  return `${first}${last}` || "A";
}

function CustomerIdentity({
  customer,
}: {
  customer: { firstName: string; lastName: string; email: string };
}) {
  return (
    <div>
      <p className="truncate text-sm font-medium text-foreground">
        {customer.firstName} {customer.lastName}
      </p>
      <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
    </div>
  );
}

function CartButton() {
  const cart = useCart();

  return (
    <Button asChild className="relative" size="icon" variant="ghost">
      <Link to="/cart" unstyled>
        <ShoppingCart className="size-4" />
        <span className="sr-only">Cart</span>
        {cart.itemCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
            {cart.itemCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}

function SignOutButton({
  disabled,
  onSignOut,
  variant = "ghost",
}: {
  disabled: boolean;
  onSignOut: () => void;
  variant?: "ghost" | "outline";
}) {
  return (
    <Button
      className="w-full justify-start"
      disabled={disabled}
      onClick={onSignOut}
      variant={variant}
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}

export function SiteHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasSessionToken = Boolean(getSessionToken());
  const currentCustomerQuery = useQuery(currentCustomerQueryOptions());
  const logoutCustomerMutation = useLogoutCustomerMutation();
  const customer = hasSessionToken ? currentCustomerQuery.data?.customer : null;
  const customerInitials = useMemo(
    () => getCustomerInitials(customer?.firstName, customer?.lastName),
    [customer?.firstName, customer?.lastName],
  );

  useEffect(() => {
    if (!hasSessionToken || !currentCustomerQuery.isError) {
      return;
    }

    clearSessionToken();
    void invalidateCustomerSessionQueries(queryClient);
  }, [currentCustomerQuery.isError, hasSessionToken, queryClient]);

  async function handleSignOut() {
    try {
      await logoutCustomerMutation.mutateAsync();
    } finally {
      clearSessionToken();
      await invalidateCustomerSessionQueries(queryClient);
      navigate("/");
    }
  }

  return (
    <header className="pt-3">
      <div className="storefront-container grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6 md:px-6">
        <Link className="flex min-w-0 flex-col gap-1" to="/">
          <p className="truncate text-sm font-semibold uppercase tracking-wide text-foreground">
            Order of the Black Thorn
          </p>
          <p className="truncate text-[13px] leading-tight text-muted-foreground">
            Dark florals, vessels, and keepsakes.
          </p>
        </Link>

        <nav className="hidden items-center justify-center gap-6 text-sm md:flex">
          {storefrontNavItems.map((item) => {
            const isActive = isNavItemActive(item, pathname);

            return (
              <Link
                className={
                  isActive
                    ? "relative font-semibold text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:bg-primary"
                    : "font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
                key={item.to}
                to={item.to}
                unstyled
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2">
          {customer ? (
            <>
              <CartButton />
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label="Open account menu"
                      className="size-8 rounded-full border border-border bg-card p-0 hover:bg-card"
                      type="button"
                      variant="ghost"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-card text-xs font-medium text-muted-foreground">
                          {customerInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="sr-only">Open account menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-0">
                    <div className="px-4 py-3">
                      <CustomerIdentity customer={customer} />
                    </div>
                    <DropdownMenuSeparator className="m-0" />
                    <DropdownMenuItem asChild className="rounded-none px-4 py-2.5">
                      <Link to="/orders" unstyled>
                        <ReceiptText className="size-4" />
                        Order history
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                    <DropdownMenuItem
                      className="rounded-none px-4 py-2.5"
                      disabled={logoutCustomerMutation.isPending}
                      onSelect={() => {
                        void handleSignOut();
                      }}
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-2 md:flex">
                {storefrontAuthLinks.map((item) => (
                  <Button asChild key={item.href} size="sm" variant={item.variant}>
                    <Link to={item.href} unstyled>
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </div>
              <CartButton />
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" size="icon" variant="ghost">
                <Menu className="size-4" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-72 p-5" side="right">
              <SheetHeader className="pr-8 text-left">
                <SheetTitle className="text-base">
                  Order of the Black Thorn
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-5 flex flex-col gap-1 border-t pt-4 text-sm">
                {storefrontNavItems.map((item) => {
                  const isActive = isNavItemActive(item, pathname);

                  return (
                    <SheetClose asChild key={item.to}>
                      <Link
                        className={
                          isActive
                            ? "rounded-md px-3 py-2.5 font-medium text-foreground hover:bg-muted"
                            : "rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }
                        to={item.to}
                        unstyled
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>

              <div className="mt-4 border-t pt-4">
                {customer ? (
                  <div className="space-y-3">
                    <CustomerIdentity customer={customer} />
                    <Button asChild className="w-full justify-start" variant="outline">
                      <Link to="/orders" unstyled>
                        <ReceiptText className="size-4" />
                        Order history
                      </Link>
                    </Button>
                    <SignOutButton
                      disabled={logoutCustomerMutation.isPending}
                      onSignOut={handleSignOut}
                      variant="outline"
                    />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {storefrontAuthLinks.map((item) => (
                      <Button
                        asChild
                        key={item.href}
                        variant={item.variant === "ghost" ? "outline" : item.variant}
                      >
                        <Link to={item.href} unstyled>
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
