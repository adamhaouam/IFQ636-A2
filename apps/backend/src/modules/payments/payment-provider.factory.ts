import { PaymentProvider } from "../payments/payment.interface.service.js";
import { StripePaymentAdapter } from "../payments/stripe.adapter.js";
//import { PayPalPaymentAdapter } from "../payments/paypal.adapter.js";

export function getPaymentProvider(method: "stripe" | "paypal"): PaymentProvider {
  switch (method) {
    case "stripe": return new StripePaymentAdapter();
    case "paypal": return new StripePaymentAdapter();
    //case "paypal": return new PayPalPaymentAdapter();
    default: throw new Error(`Unsupported payment method: ${method}`);
  }
}