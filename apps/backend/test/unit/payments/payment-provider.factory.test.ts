import { expect } from "chai";

import { getPaymentProvider } from "../../../src/modules/payments/payment-provider.factory.js";
import { StripePaymentAdapter } from "../../../src/modules/payments/stripe.adapter.js";
import { PayPalPaymentAdapter } from "../../../src/modules/payments/paypal.adapter.js";

describe("payment provider factory", () => {
  it("creates a Stripe payment adapter", () => {
    const provider = getPaymentProvider("stripe");

    expect(provider).to.be.instanceOf(StripePaymentAdapter);
  });

  it("creates a PayPal payment adapter", () => {
    const provider = getPaymentProvider("paypal");

    expect(provider).to.be.instanceOf(PayPalPaymentAdapter);
  });

  it("rejects unsupported payment methods", () => {
    expect(() => getPaymentProvider("bitcoin" as never)).to.throw(
      "Unsupported payment method: bitcoin",
    );
  });
});
