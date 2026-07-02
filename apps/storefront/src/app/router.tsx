import { createBrowserRouter } from "react-router";

import { queryClient } from "../lib/query-client";
import {
  currentCustomerQueryKey,
  currentCustomerQueryOptions,
} from "../modules/customers/auth/customer-auth.query";
import {
  clearSessionToken,
  getSessionToken,
} from "../modules/customers/auth/customer-auth.storage";
import {
  publicProductQueryOptions,
  publicProductsQueryOptions,
} from "../modules/products/products.query";
import { CartPage } from "./routes/cart/cart.page";
import { CheckoutPage } from "./routes/checkout/checkout.page";
import { HomePage } from "./routes/home/home.page";
import { LoginPage } from "./routes/login/login.page";
import { NotFoundPage } from "./routes/not-found.page";
import { OrderDetailPage } from "./routes/orders/order-detail.page";
import { OrderHistoryPage } from "./routes/orders/order-history.page";
import { ProductDetailPage } from "./routes/products/product-detail.page";
import { RegisterPage } from "./routes/register/register.page";
import { RootLayout } from "./routes/root.layout";
import { RootLoading } from "./routes/root-loading";
import { RouteError } from "./routes/route-error";

async function loadCurrentCustomerSession() {
  if (!getSessionToken()) {
    return null;
  }

  try {
    return await queryClient.ensureQueryData(currentCustomerQueryOptions());
  } catch {
    clearSessionToken();
    queryClient.removeQueries({ queryKey: currentCustomerQueryKey });
    return null;
  }
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    hydrateFallbackElement: <RootLoading />,
    loader: loadCurrentCustomerSession,
    children: [
      {
        index: true,
        loader: () =>
          queryClient.ensureQueryData(publicProductsQueryOptions({ page: 1 })),
        element: <HomePage />,
        errorElement: <RouteError />,
      },
      {
        path: "cart",
        element: <CartPage />,
        errorElement: <RouteError />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
        errorElement: <RouteError />,
      },
      {
        path: "orders",
        element: <OrderHistoryPage />,
        errorElement: <RouteError />,
      },
      {
        path: "orders/:orderId",
        element: <OrderDetailPage />,
        errorElement: <RouteError />,
      },
      {
        path: "login",
        element: <LoginPage />,
        errorElement: <RouteError />,
      },
      {
        path: "register",
        element: <RegisterPage />,
        errorElement: <RouteError />,
      },
      {
        path: "products/:productId",
        loader: ({ params }) => {
          if (!params.productId) {
            throw new Response("Product not found", { status: 404 });
          }

          return queryClient.ensureQueryData(
            publicProductQueryOptions(params.productId),
          );
        },
        element: <ProductDetailPage />,
        errorElement: <RouteError />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
