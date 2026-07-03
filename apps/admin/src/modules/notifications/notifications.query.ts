import type { NotificationFilter } from "@otbt/types";
import { queryOptions } from "@tanstack/react-query";

import { fetchNotifications } from "./notifications.request";

export const notificationQueryRoot = ["notifications"] as const;

export function notificationListQueryKey(filter: NotificationFilter = "all") {
  return [...notificationQueryRoot, "list", filter] as const;
}

export function notificationListQuery(filter: NotificationFilter = "all") {
  return queryOptions({
    queryKey: notificationListQueryKey(filter),
    queryFn: () => fetchNotifications(filter),
  });
}
