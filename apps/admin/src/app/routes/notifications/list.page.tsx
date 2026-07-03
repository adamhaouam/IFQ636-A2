import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@otbt/ui";

import { NotificationList } from "../../../modules/notifications";

export function NotificationListPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Storefront</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Notifications</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Notifications</h1>
        <p className="mt-1 text-muted-foreground">
          Review recent order activity and notification history.
        </p>
      </div>

      <NotificationList />
    </div>
  );
}
