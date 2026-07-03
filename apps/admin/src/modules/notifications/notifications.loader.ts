import type { NotificationFilter } from "@otbt/types";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { queryClient } from "../../lib/query-client";
import { getAdminToken } from "../auth/auth.storage";
import { notificationListQuery } from "./notifications.query";

const notificationFilters = ["all", "unread", "order", "system"] as const;

function resolveNotificationFilter(request: Request): NotificationFilter {
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";

  return notificationFilters.includes(filter as NotificationFilter)
    ? (filter as NotificationFilter)
    : "all";
}

export async function notificationListLoader({ request }: LoaderFunctionArgs) {
  if (!getAdminToken()) {
    throw redirect("/login");
  }

  const filter = resolveNotificationFilter(request);
  await queryClient.ensureQueryData(notificationListQuery(filter));

  return { filter };
}
