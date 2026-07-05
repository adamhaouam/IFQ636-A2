import type {
  NotificationFilter,
  NotificationItem,
  NotificationSummary,
  Order,
} from "@otbt/types";

import type { NotificationDocument } from "./notification.model.js";
import {
  NotificationPublisher,
  type NotificationEventPublisher,
} from "./notification.publisher.js";
import {
  MongoNotificationRepository,
  type NotificationCreateInput,
  type NotificationQuery,
  type NotificationRepository,
} from "./notification.repository.js";

function getOrderDisplayNumber(order: Order) {
  return order.orderNumber || order.id;
}

function serializeNotification(
  notification: NotificationDocument,
): NotificationItem {
  return {
    action: notification.action,
    createdAt: notification.createdAt.toISOString(),
    dismissedAt: notification.dismissedAt?.toISOString(),
    id: notification._id.toString(),
    message: notification.message,
    readAt: notification.readAt?.toISOString(),
    resource: notification.resource,
    resourceId: notification.resourceId ?? undefined,
    status: notification.status,
    title: notification.title,
    type: notification.type,
  };
}

export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository =
      new MongoNotificationRepository(),
    private readonly publisher: NotificationEventPublisher =
      new NotificationPublisher(),
  ) {}

  async create(input: NotificationCreateInput) {
    const created = await this.repository.create(input);
    return serializeNotification(created);
  }

  async recordOrderReceived(order: Order) {
    const orderDisplayNumber = getOrderDisplayNumber(order);

    return await this.createAndPublish({
      action: "received",
      message: `Order #${orderDisplayNumber} from storefront checkout`,
      resource: "orders",
      resourceId: order.id,
      title: "New order received",
      type: "order",
    });
  }

  async recordOrderStatusChanged(order: Order) {
    const orderDisplayNumber = getOrderDisplayNumber(order);

    return await this.createAndPublish({
      action: "status_changed",
      message: `Order #${orderDisplayNumber} marked as ${order.status}`,
      resource: "orders",
      resourceId: order.id,
      title: "Order status changed",
      type: "order",
    });
  }

  async list(filter: NotificationFilter = "all") {
    const notifications = await this.repository.find(this.resolveListQuery(filter));

    return notifications.map((notification) => serializeNotification(notification));
  }

  async getSummary(): Promise<NotificationSummary> {
    const [unreadCount, recentOrderCount] = await Promise.all([
      this.repository.count({ status: "unread" }),
      this.repository.count({
        status: { $ne: "dismissed" },
        type: "order",
      }),
    ]);

    return { recentOrderCount, unreadCount };
  }

  async markAllRead() {
    const readAt = new Date();

    await this.repository.updateMany(
      { status: "unread" },
      { readAt, status: "read" },
    );

    this.publisher.publishUpdated({
      action: "mark_all_read",
      createdAt: readAt.toISOString(),
      id: "notifications-mark-all-read",
      message: "All notifications marked as read",
      resource: "notifications",
      status: "read",
      title: "Notifications updated",
      type: "system",
    });
  }

  async updateStatus(id: string, status: "read" | "dismissed") {
    const now = new Date();
    const update =
      status === "dismissed"
        ? { dismissedAt: now, status }
        : { readAt: now, status };

    const notification = await this.repository.updateStatus(id, update);

    if (!notification) {
      return null;
    }

    const serialized = serializeNotification(notification);
    this.publisher.publishUpdated(serialized);
    return serialized;
  }

  private resolveListQuery(filter: NotificationFilter): NotificationQuery {
    if (filter === "unread") {
      return { status: "unread" };
    }

    if (filter === "order" || filter === "system") {
      return { status: { $ne: "dismissed" }, type: filter };
    }

    return { status: { $ne: "dismissed" } };
  }

  private async createAndPublish(input: NotificationCreateInput) {
    const notification = await this.create(input);
    this.publisher.publishCreated(notification);
    return notification;
  }
}

export const notificationService = new NotificationService();
