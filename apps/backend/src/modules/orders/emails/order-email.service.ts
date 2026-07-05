import type { Order, OrderItem, OrderStatus } from "@otbt/types";

import { sendEmail } from "../../email/email.service.js";
import {
  escapeHtml,
  renderRegisteredEmailTemplate,
} from "../../email/email.templates.js";
import { orderEmailRegistry } from "./email.registry.js";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    currency: "AUD",
    style: "currency",
  }).format(amount);
}

function formatStatus(status: Order["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const statusEmailCopy: Record<
  OrderStatus,
  { heading: string; intro: string; label: string }
> = {
  pending: {
    heading: "Your order is pending.",
    intro: "Your order is waiting to be prepared by the store team.",
    label: "Pending",
  },
  packed: {
    heading: "Your order has been packed.",
    intro: "Your selected pieces have been prepared and are ready for dispatch.",
    label: "Packed",
  },
  shipped: {
    heading: "Your order has shipped.",
    intro: "Your order has left the store and is now in transit.",
    label: "Shipped",
  },
};

function formatItemSummary(order: Order) {
  return order.items.map((item) => `${item.quantity} x ${item.name}`).join(", ");
}

function formatDeliveryAddress(order: Order) {
  return [
    order.deliveryAddress.addressLine1,
    order.deliveryAddress.addressLine2,
    order.deliveryAddress.suburb,
    order.deliveryAddress.state,
    order.deliveryAddress.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

function getTotalItemCount(order: Order) {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}

function resolveEmailImageUrl(imageUrl: string | null) {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (!imageUrl.startsWith("/")) {
    return null;
  }

  const assetOrigin =
    process.env.EMAIL_ASSET_ORIGIN ??
    (process.env.NGINX_PORT ? `http://localhost:${process.env.NGINX_PORT}` : undefined);

  return assetOrigin ? `${assetOrigin}${imageUrl}` : null;
}

function resolveStorefrontUrl(pathname: string) {
  const storefrontOrigin =
    process.env.STOREFRONT_ORIGIN ??
    (process.env.NGINX_PORT ? `http://localhost:${process.env.NGINX_PORT}` : undefined);

  return storefrontOrigin ? `${storefrontOrigin}${pathname}` : pathname;
}

function renderOrderItemImage(item: OrderItem) {
  const imageUrl = resolveEmailImageUrl(item.imageUrl);

  const imageContent = imageUrl
    ? `
            <img src="${escapeHtml(imageUrl)}" width="44" height="44" alt="${escapeHtml(item.name)}" style="display:block;width:44px;height:44px;border:0;object-fit:cover;border-radius:6px;" />
          `
    : `
            <span style="display:block;width:44px;height:44px;border-radius:6px;background-color:#211d25;"></span>
          `;

  return `
    <td width="48" valign="middle" style="width:48px;padding:0 12px 0 0;">
      <table role="presentation" width="48" height="48" cellspacing="0" cellpadding="0" bgcolor="#18151d" style="width:48px;height:48px;border-collapse:separate;border-spacing:0;background-color:#18151d;border:1px solid #2b2630;border-radius:7px;">
        <tr>
          <td align="center" valign="middle" style="padding:1px;">
            ${imageContent}
          </td>
        </tr>
      </table>
    </td>
  `;
}

function renderOrderItemRows(order: Order) {
  return order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:0 0 10px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                ${renderOrderItemImage(item)}
                <td valign="middle" style="padding:0;">
                  <p style="margin:0 0 2px;font-size:12px;line-height:17px;font-weight:700;color:#f2ede3;">
                    ${escapeHtml(item.name)}
                  </p>
                  <p style="margin:0;font-size:11px;line-height:16px;color:#a79f94;">
                    Qty ${item.quantity} &middot; SKU ${escapeHtml(item.sku)}
                  </p>
                </td>
                <td align="right" valign="middle" style="padding:0 0 0 12px;font-size:12px;line-height:17px;font-weight:700;color:#f2ede3;white-space:nowrap;">
                  ${formatCurrency(item.lineTotal)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderStatusProgressHtml(order: Order) {
  const activeStatuses: OrderStatus[] =
    order.status === "pending"
      ? ["pending"]
      : order.status === "packed"
        ? ["pending", "packed"]
        : ["pending", "packed", "shipped"];

  const steps: Array<{ status: OrderStatus; label: string; caption: string }> = [
    { status: "pending", label: "Pending", caption: "received" },
    { status: "packed", label: "Packed", caption: "prepared" },
    { status: "shipped", label: "Shipped", caption: "in transit" },
  ];

  const stepCells = steps
    .map((step) => {
      const isActive = activeStatuses.includes(step.status);
      const markerStyle = isActive
        ? "background-color:#d6b24c;"
        : "border:1px solid #2b2630;";
      const labelColor = isActive ? "#d6b24c" : "#a79e94";

      return `
        <td align="center" width="33.33%" style="padding:0 4px;">
          <div style="width:14px;height:14px;margin:0 auto 7px;border-radius:999px;${markerStyle}"></div>
          <p style="margin:0 0 4px;font-size:11px;line-height:14px;font-weight:700;color:${labelColor};text-align:center;">${escapeHtml(step.label)}</p>
          <p style="margin:0;font-size:10px;line-height:13px;color:#a79e94;text-align:center;">${escapeHtml(step.caption)}</p>
        </td>
      `;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 20px;">
      <tr>
        <td height="1" bgcolor="#29242d" style="height:1px;padding:0;background-color:#29242d;font-size:1px;line-height:1px;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding:20px 0 0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#111016" style="border-collapse:separate;border-spacing:0;background-color:#111016;border:1px solid #2b2630;border-radius:8px;">
            <tr>
              <td style="padding:18px 18px 14px;">
                <p style="margin:0 0 4px;font-size:16px;line-height:20px;font-weight:700;color:#f2ede3;">
                  Order status
                </p>
                <p style="margin:0 0 16px;font-size:12px;line-height:16px;color:#a79e94;">
                  Current status: ${escapeHtml(statusEmailCopy[order.status].label)}
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    ${stepCells}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export async function sendOrderConfirmationEmail(order: Order) {
  try {
    const renderedEmail = await renderRegisteredEmailTemplate({
      emailType: "Order placed",
      preheader: `We have received order ${order.orderNumber}.`,
      subject: `Order confirmation ${order.orderNumber}`,
      template: orderEmailRegistry.orderConfirmation,
      htmlValues: {
        orderItemsHtml: renderOrderItemRows(order),
      },
      values: {
        customerFirstName: order.customer.firstName,
        deliveryAddress: formatDeliveryAddress(order),
        deliveryWindow: "Local delivery details to be confirmed",
        itemCount: String(getTotalItemCount(order)),
        itemSummary: formatItemSummary(order),
        orderLink: resolveStorefrontUrl(`/orders/${order.id}`),
        orderReference: order.orderNumber,
        orderStatus: formatStatus(order.status),
        orderTotal: formatCurrency(order.total),
      },
    });

    return await sendEmail({
      ...renderedEmail,
      to: order.customer.email,
    });
  } catch (error) {
    console.error("Failed to send order confirmation email", error);

    return {
      reason: "Order confirmation email failed",
      status: "skipped" as const,
    };
  }
}

export async function sendOrderStatusUpdateEmail(
  order: Order,
  previousStatus: OrderStatus,
) {
  if (order.status === previousStatus) {
    return {
      reason: "Order status did not change",
      status: "skipped" as const,
    };
  }

  const statusCopy = statusEmailCopy[order.status];

  try {
    const renderedEmail = await renderRegisteredEmailTemplate({
      emailType: "Order update",
      preheader: `Order ${order.orderNumber} is now ${statusCopy.label}.`,
      subject: `Order status update ${order.orderNumber}`,
      template: orderEmailRegistry.orderStatusUpdate,
      htmlValues: {
        orderItemsHtml: renderOrderItemRows(order),
        statusProgressHtml: renderStatusProgressHtml(order),
      },
      values: {
        currentStatus: statusCopy.label,
        deliveryWindow: "Local delivery details to be confirmed",
        itemCount: String(getTotalItemCount(order)),
        itemSummary: formatItemSummary(order),
        orderLink: resolveStorefrontUrl(`/orders/${order.id}`),
        orderReference: order.orderNumber,
        orderTotal: formatCurrency(order.total),
        statusHeading: statusCopy.heading,
        statusIntro: statusCopy.intro,
      },
    });

    return await sendEmail({
      ...renderedEmail,
      to: order.customer.email,
    });
  } catch (error) {
    console.error("Failed to send order status update email", error);

    return {
      reason: "Order status update email failed",
      status: "skipped" as const,
    };
  }
}
