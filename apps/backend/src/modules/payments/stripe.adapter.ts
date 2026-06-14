import Stripe from "stripe";
import { PaymentValidationError } from "./payment.errors.js";
import { env } from "../../config/env.js";
import { PaymentProvider } from "./payment.interface.service.js";

const stripe = new Stripe(env.stripeSecretKey);

export class StripePaymentAdapter implements PaymentProvider {

  private getPaymentReference(
    paymentIntent: string | { id: string } | null,
  ) {
    if (!paymentIntent) {
      return null;
    }
  
    return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
  }


  async createCheckoutSession(input: {
    cancelUrl: string;
    customerEmail: string;
    items: { lineTotal: number; name: string; quantity: number }[];
    orderId: string;
    successUrl: string;
  }) {
    const session = await stripe.checkout.sessions.create({
      cancel_url: input.cancelUrl,
      client_reference_id: input.orderId,
      customer_email: input.customerEmail,
      line_items: input.items.map((item) => ({
        price_data: {
          currency: "aud",
          product_data: { name: item.name },
          unit_amount: Math.round((item.lineTotal / item.quantity) * 100),
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId: input.orderId,
      },
      mode: "payment",
      payment_method_types: ["card"],
      success_url: input.successUrl,
    });

    if (!session.url) {
      throw new PaymentValidationError("Unable to create checkout session");
    }
    return { sessionId: session.id, redirectUrl: session.url };
  }

  async verifyCheckoutSession(input: {
    expectedTotal: number;
    orderId: string;
    sessionId: string;
  }) {
    const session = await stripe.checkout.sessions.retrieve(input.sessionId);
    const expectedAmount = Math.round(input.expectedTotal * 100);
  
    if (
      session.payment_status !== "paid" ||
      session.client_reference_id !== input.orderId ||
      session.amount_total !== expectedAmount ||
      session.currency !== "aud"
    ) {
      throw new PaymentValidationError("Payment could not be verified");
    }

    const paymentReference = this.getPaymentReference(session.payment_intent);
    if (!paymentReference) {
      throw new PaymentValidationError("Payment reference is missing");
    }
  
    return {
      amount: session.amount_total! / 100,
      currency: session.currency!,
      paymentReference: paymentReference,
      providerSessionId: session.id,
    };
  }
  
}