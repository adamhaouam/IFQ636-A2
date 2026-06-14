export interface CheckoutSessionInput {
    cancelUrl: string;
    customerEmail: string;
    items: { lineTotal: number; name: string; quantity: number }[];
    orderId: string;
    successUrl: string;
}

export interface CheckoutSessionResult {
    sessionId: string;
    redirectUrl: string;
}

export interface VerifySessionInput {
    expectedTotal: number;
    orderId: string;
    sessionId: string;
}

export interface VerifiedCheckoutSession {
    amount: number;
    currency: string;
    paymentReference: string | null;  // e.g. Stripe's payment_intent id, PayPal's capture id
    providerSessionId: string;
}

export interface PaymentProvider {
    createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;
    verifyCheckoutSession(input: VerifySessionInput): Promise<VerifiedCheckoutSession>;
    //getPaymentReference?
}

