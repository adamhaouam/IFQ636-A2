import { createBrowserRouter } from "react-router";

import { RequireAdmin, requireAdminSession } from "../modules/auth";
import { customerEditLoader, customerListLoader } from "../modules/customers";
import { orderDetailLoader, orderListLoader } from "../modules/orders";
import { productEditLoader, productListLoader } from "../modules/products";
import { settingsLoader } from "../modules/settings";
import { AdminLayout } from "./routes/admin.layout";
import { CatalogueCreatePage } from "./routes/catalog/create.page";
import { CatalogueEditPage } from "./routes/catalog/edit.page";
import { CatalogueListPage } from "./routes/catalog/list.page";
import { CustomerEditPage } from "./routes/customers/edit.page";
import { CustomerListPage } from "./routes/customers/list.page";
import { LoginPage } from "./routes/login/login.page";
import { OrderDetailPage } from "./routes/orders/detail.page";
import { OrderListPage } from "./routes/orders/list.page";
import { PublicLayout } from "./routes/public.layout";
import { RootLayout } from "./routes/root.layout";
import { RouteError } from "./routes/route-error";
import { SettingsPage } from "./routes/settings/settings.page";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      errorElement: <RouteError />,
      children: [
        {
          element: <PublicLayout />,
          children: [
            {
              path: "login",
              element: <LoginPage />,
            },
          ],
        },
        {
          id: "admin",
          element: <RequireAdmin />,
          loader: requireAdminSession,
          children: [
            {
              element: <AdminLayout />,
              children: [
                { index: true, loader: productListLoader, element: <CatalogueListPage /> },
                {
                  path: "products/new",
                  element: <CatalogueCreatePage />,
                },
                {
                  path: "products/:productId",
                  loader: productEditLoader,
                  element: <CatalogueEditPage />,
                },
                {
                  path: "customers",
                  loader: customerListLoader,
                  element: <CustomerListPage />,
                },
                {
                  path: "customers/:customerId",
                  loader: customerEditLoader,
                  element: <CustomerEditPage />,
                },
                {
                  path: "orders",
                  loader: orderListLoader,
                  element: <OrderListPage />,
                },
                {
                  path: "orders/:orderId",
                  loader: orderDetailLoader,
                  element: <OrderDetailPage />,
                },
                {
                  path: "settings",
                  loader: settingsLoader,
                  element: <SettingsPage />,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  {
    basename: "/admin/",
  },
);
