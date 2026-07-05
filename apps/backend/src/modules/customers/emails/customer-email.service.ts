import type { Customer } from "@otbt/types";

import { sendEmail } from "../../email/email.service.js";
import { renderRegisteredEmailTemplate } from "../../email/email.templates.js";
import { customerEmailRegistry } from "./email.registry.js";

function resolveStorefrontUrl(pathname: string) {
  const storefrontOrigin =
    process.env.STOREFRONT_ORIGIN ??
    (process.env.NGINX_PORT ? `http://localhost:${process.env.NGINX_PORT}` : undefined);

  return storefrontOrigin ? `${storefrontOrigin}${pathname}` : pathname;
}

export async function sendCustomerRegistrationEmail(customer: Customer) {
  try {
    const renderedEmail = await renderRegisteredEmailTemplate({
      emailType: "Customer account",
      preheader: "Your Order of the Black Thorn customer account is ready.",
      subject: "Your account is ready",
      template: customerEmailRegistry.accountRegistration,
      values: {
        customerEmail: customer.email,
        customerFirstName: customer.firstName,
        signInLink: resolveStorefrontUrl("/login"),
      },
    });

    return await sendEmail({
      ...renderedEmail,
      to: customer.email,
    });
  } catch (error) {
    console.error("Failed to send customer registration email", error);

    return {
      reason: "Customer registration email failed",
      status: "skipped" as const,
    };
  }
}
