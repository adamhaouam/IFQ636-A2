import { Outlet } from "react-router";
import { Toaster } from "@otbt/ui";

import { AuthProvider } from "../../modules/auth";

export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
