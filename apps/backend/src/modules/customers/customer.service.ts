import type { Customer, CustomerUpdate } from "@otbt/types";
import { isValidObjectId } from "mongoose";

import { HttpError } from "../../middleware/error-handler.js";
import { sendEmail } from "../email/email.service.js";
import { renderRegisteredEmailTemplate } from "../email/email.templates.js";
import { CustomerModel, type CustomerDocument } from "./customer.model.js";
import { customerEmailRegistry } from "./emails/email.registry.js";
import {
  hashCustomerPassword,
  verifyCustomerPassword,
} from "./customer.passwords.js";

type CustomerRecord = CustomerDocument & {
  _id: { toString(): string };
};

interface CustomerRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

function serializeCustomer(customer: CustomerRecord): Customer {
  return {
    id: customer._id.toString(),
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    status: customer.status,
    accessLevel: customer.accessLevel,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

function resolveStorefrontUrl(pathname: string) {
  const storefrontOrigin =
    process.env.STOREFRONT_ORIGIN ??
    (process.env.NGINX_PORT ? `http://localhost:${process.env.NGINX_PORT}` : undefined);

  return storefrontOrigin ? `${storefrontOrigin}${pathname}` : pathname;
}

async function sendCustomerRegistrationEmail(customer: Customer) {
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

export async function registerCustomer(
  customerRegistration: CustomerRegistration,
): Promise<Customer> {
  const normalizedEmail = customerRegistration.email.trim().toLowerCase();
  const existingCustomer = await CustomerModel.findOne({
    email: normalizedEmail,
  }).exec();

  if (existingCustomer) {
    throw new HttpError(409, "Customer email already registered");
  }

  const customer = await CustomerModel.create({
    firstName: customerRegistration.firstName.trim(),
    lastName: customerRegistration.lastName.trim(),
    email: normalizedEmail,
    passwordHash: await hashCustomerPassword(customerRegistration.password),
  });
  const registeredCustomer = serializeCustomer(customer);

  await sendCustomerRegistrationEmail(registeredCustomer);

  return registeredCustomer;
}

export async function findCustomerByCredentials(
  email: string,
  password: string,
): Promise<Customer | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const customer = await CustomerModel.findOne({ email: normalizedEmail }).exec();
  const validPassword = customer
    ? await verifyCustomerPassword(password, customer.passwordHash)
    : false;

  return customer && validPassword ? serializeCustomer(customer) : null;
}

export async function findCustomerById(
  customerId: string,
): Promise<Customer | null> {
  const customer = await CustomerModel.findById(customerId).exec();

  return customer ? serializeCustomer(customer) : null;
}

export async function listCustomers(): Promise<Customer[]> {
  const customers = await CustomerModel.find().sort({ createdAt: -1 }).exec();

  return customers.map(serializeCustomer);
}

export async function getCustomer(customerId: string): Promise<Customer | null> {
  if (!isValidObjectId(customerId)) {
    return null;
  }

  const customer = await CustomerModel.findById(customerId).exec();

  return customer ? serializeCustomer(customer) : null;
}

export async function updateCustomer(
  customerId: string,
  customerUpdate: CustomerUpdate,
): Promise<Customer | null> {
  if (!isValidObjectId(customerId)) {
    return null;
  }

  const update: CustomerUpdate = {};

  if (customerUpdate.firstName !== undefined) {
    update.firstName = customerUpdate.firstName.trim();
  }

  if (customerUpdate.lastName !== undefined) {
    update.lastName = customerUpdate.lastName.trim();
  }

  if (customerUpdate.email !== undefined) {
    update.email = customerUpdate.email.trim().toLowerCase();
  }

  if (customerUpdate.status !== undefined) {
    update.status = customerUpdate.status;
  }

  if (customerUpdate.accessLevel !== undefined) {
    update.accessLevel = customerUpdate.accessLevel;
  }

  const customer = await CustomerModel.findByIdAndUpdate(customerId, update, {
    new: true,
    runValidators: true,
  }).exec();

  return customer ? serializeCustomer(customer) : null;
}
