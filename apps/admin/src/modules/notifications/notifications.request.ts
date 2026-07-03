import type {
  NotificationFilter,
  NotificationListResponse,
  NotificationStatusUpdateResponse,
} from "@otbt/types";

import { adminHttpRequest } from "../../lib/http.client";

export function fetchNotifications(filter: NotificationFilter = "all") {
  return adminHttpRequest<NotificationListResponse>(
    `/notifications?filter=${encodeURIComponent(filter)}`,
  );
}

export function updateNotificationStatus(
  notificationId: string,
  status: "read" | "dismissed",
) {
  return adminHttpRequest<NotificationStatusUpdateResponse>(
    `/notifications/${notificationId}/status`,
    {
      body: JSON.stringify({ status }),
      method: "PATCH",
    },
  );
}

export function markAllNotificationsRead() {
  return adminHttpRequest<{ ok: true }>("/notifications/mark-all-read", {
    method: "POST",
  });
}
