import { Outlet } from "react-router";
import { Toaster } from "@otbt/ui";
import { ServerEventsProvider } from "@otbt/web";

import { SiteFooter } from "../../modules/navigation/site-footer";
import { SiteHeader } from "../../modules/navigation/site-header";
import { useServerEventTestToast } from "../../modules/server-event-tests/hooks/use-server-event-test-toast";

export function RootLayout() {
  useServerEventTestToast();

  return (
    <ServerEventsProvider channel="storefront">
      <div className="flex min-h-svh flex-col pb-10 text-foreground">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
        <SiteFooter />
        <Toaster />
      </div>
    </ServerEventsProvider>
  );
}
