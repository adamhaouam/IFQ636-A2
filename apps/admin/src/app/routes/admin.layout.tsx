import { Button, Input, SidebarProvider, SidebarTrigger } from "@otbt/ui";
import { ServerEventsProvider } from "@otbt/web";
import { Bell, MessageSquareMore, Package2, Search } from "lucide-react";
import { Outlet, useNavigate } from "react-router";

import { AdminSidebar } from "../../components/sidebar";
import { AccountMenu } from "../../modules/admin-shell";
import { useAuth } from "../../modules/auth";
import { useServerEventTestToast } from "../../modules/server-event-tests/hooks/use-server-event-test-toast";

export function AdminLayout() {
  const { adminUser, logout } = useAuth();
  const navigate = useNavigate();
  useServerEventTestToast();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <ServerEventsProvider channel="admin">
      <SidebarProvider className="flex-col">
        <div className="shell min-h-svh bg-background">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger />
                <div className="flex size-9 items-center justify-center rounded-lg border bg-primary text-primary-foreground">
                  <Package2 className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">Order of the Black Thorn</p>
                  <p className="truncate text-xs text-muted-foreground">Store Management</p>
                </div>
              </div>

              <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search products, orders, or customers" type="search" />
              </div>

              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost">
                  <Bell className="size-4" />
                  <span className="sr-only">Notifications</span>
                </Button>
                <Button size="icon" variant="ghost">
                  <MessageSquareMore className="size-4" />
                  <span className="sr-only">Messages</span>
                </Button>
                <AccountMenu adminUser={adminUser} onSignOut={handleLogout} />
              </div>
            </div>
          </header>

          <div className="flex h-[calc(100svh-4rem)] w-full overflow-hidden">
            <AdminSidebar />
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-muted/30">
              <div className="px-4 py-6 md:px-6">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ServerEventsProvider>
  );
}
