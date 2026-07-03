import type { NotificationFilter } from "@otbt/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@otbt/ui";
import { useServerEvent } from "@otbt/web";

import {
  markAllNotificationsRead,
  updateNotificationStatus,
} from "./notifications.request";
import {
  notificationListQuery,
  notificationQueryRoot,
} from "./notifications.query";

const notificationEventResource = "notifications";

export function useNotifications(filter: NotificationFilter = "all") {
  return useQuery(notificationListQuery(filter));
}

export function useNotificationEvents() {
  useServerEvent(notificationEventResource, notificationQueryRoot, {
    onEvent: (event) => {
      toast(event.message ?? "New notification", {
        description: new Date(event.timestamp).toLocaleTimeString(),
      });
    },
  });
}

export function useUpdateNotificationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      notificationId: string;
      status: "read" | "dismissed";
    }) => updateNotificationStatus(input.notificationId, input.status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationQueryRoot });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationQueryRoot });
    },
  });
}
