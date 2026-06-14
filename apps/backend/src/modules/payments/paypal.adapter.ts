import { PaymentProvider} from "./payment.interface.service.js";
import { PaymentValidationError } from "./payment.errors.js";
import { env } from "../../config/env.js";

const paypalKey = env.paypalSecretKey;
const paypalClientId = env.paypalClientId;

export class PayPalAdapter implements PaymentProvider {

    async createCheckoutSession(input: {
    cancelUrl: string;
    customerEmail: string;
    items: { lineTotal: number; name: string; quantity: number }[];
    orderId: string;
    successUrl: string;
  }) {
    const session = {
      id: "dummy-session-id",
      url: "https://www.paypal.com/checkoutnow?token=dummy-session-id",
    };

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
    const session = {
        amount: 0,
        currency: "aud",
        paymentReference: "dummy-payment-reference", 
        providerSessionId: "dummy-provider-session-id"
    }

    return {
      amount: session.amount,
      currency: session.currency,
      paymentReference: session.paymentReference,
      providerSessionId: session.providerSessionId,
    };
  }
}
