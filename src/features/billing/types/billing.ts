import { z } from 'zod';

export type CurrencyCode = 'KES' | 'USD' | 'GBP' | 'EUR' | 'NGN' | 'GHS' | 'ZAR' | 'INR';

export type PaymentProvider = 'stripe' | 'paypal' | 'mpesa' | 'flutterwave';

export type PaymentStatus = 'created' | 'processing' | 'succeeded' | 'failed' | 'expired';

export type BillingPeriod = 'monthly' | 'annual';

export type PlanAudience = 'b2c_family' | 'b2b_school';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void';

export type PayoutMethod = 'mpesa' | 'stripe' | 'bank_transfer';

export type PayoutStatus = 'pending' | 'scheduled' | 'processing' | 'paid' | 'failed';

export type RegionCode =
  | 'east_africa'
  | 'west_africa'
  | 'southern_africa'
  | 'south_asia'
  | 'europe'
  | 'north_america';

export type EnterpriseLicenseStatus = 'active' | 'suspended' | 'expired';

export interface CurrencySpec {
  code: CurrencyCode;
  symbol: string;
  /** Number of decimal digits in the minor unit (e.g. 2 for KES cents). */
  minorUnitDigits: number;
  /** BCP-47 locale used for locale-aware grouping in formatMoney. */
  locale: string;
  label: string;
}

export interface ProviderCapability {
  provider: PaymentProvider;
  label: string;
  currencies: CurrencyCode[];
  /** Which settlement region the provider is primarily designed for. */
  regions: RegionCode[];
  supportsIdempotency: boolean;
  supportsWebhooks: boolean;
  /** Smallest amount accepted per currency, expressed in minor units. */
  minAmountMinor: Partial<Record<CurrencyCode, number>>;
}

export interface PricingPlan {
  id: string;
  name: string;
  audience: PlanAudience;
  period: BillingPeriod | 'per_seat_annual';
  /** Every catalog price is anchored in USD cents; UI converts live. */
  basePriceMinor: number;
  /** Seats/children covered by this plan (B2C family size or B2B quoted seats). */
  coveredUnits: number;
  region?: RegionCode;
  features: string[];
  isMostPopular?: boolean;
  /** Purchasing-power-parity reduction versus the North-American list price, in basis points. */
  pppDiscountBp?: number;
}

export interface Subscription {
  id: string;
  planId: string;
  customerId: string;
  status: SubscriptionStatus;
  period: BillingPeriod;
  priceMinor: number;
  currency: CurrencyCode;
  seats: number;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface EnterpriseLicense {
  id: string;
  organizationName: string;
  region: RegionCode;
  seats: number;
  perSeatPriceMinor: number;
  currency: CurrencyCode;
  totalAnnualMinor: number;
  poNumber: string | null;
  paymentTermsDays: number;
  issuedAt: string;
  expiresAt: string;
  status: EnterpriseLicenseStatus;
}

export interface PaymentIntent {
  id: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amountMinor: number;
  currency: CurrencyCode;
  idempotencyKey: string;
  description: string;
  /** Stripe client secret / PayPal order id / M-Pesa CheckoutRequestID / Flutterwave tx_ref. */
  providerReference: string;
  createdAt: string;
  updatedAt: string;
  failureReason: string | null;
  metadata: Record<string, string>;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPriceMinor: number;
  amountMinor: number;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  status: InvoiceStatus;
  currency: CurrencyCode;
  lines: InvoiceLine[];
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  paymentProvider: PaymentProvider | null;
  relatedIntentId: string | null;
}

export interface CreatorPayoutProfile {
  id: string;
  displayName: string;
  handle: string;
  country: string;
  region: RegionCode;
  baseCurrency: CurrencyCode;
  payoutMethod: PayoutMethod;
  minPayoutMinor: number;
  withholdingRateBp: number;
  verified: boolean;
}

export const CurrencyCodeSchema = z.enum([
  'KES',
  'USD',
  'GBP',
  'EUR',
  'NGN',
  'GHS',
  'ZAR',
  'INR',
]);

export const PaymentProviderSchema = z.enum(['stripe', 'paypal', 'mpesa', 'flutterwave']);

export const PaymentStatusSchema = z.enum([
  'created',
  'processing',
  'succeeded',
  'failed',
  'expired',
]);

export const RegionCodeSchema = z.enum([
  'east_africa',
  'west_africa',
  'southern_africa',
  'south_asia',
  'europe',
  'north_america',
]);

export const PayoutMethodSchema = z.enum(['mpesa', 'stripe', 'bank_transfer']);

export const PayoutStatusSchema = z.enum([
  'pending',
  'scheduled',
  'processing',
  'paid',
  'failed',
]);

export const PaymentIntentSchema = z.object({
  id: z.string().min(1),
  provider: PaymentProviderSchema,
  status: PaymentStatusSchema,
  amountMinor: z.number().int().positive(),
  currency: CurrencyCodeSchema,
  idempotencyKey: z.string().min(8),
  description: z.string().min(1),
  providerReference: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  failureReason: z.string().nullable(),
  metadata: z.record(z.string()),
});

export const StripePaymentIntentRequestSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  description: z.string().min(1),
  automatic_payment_methods: z.object({ enabled: z.literal(true) }),
  metadata: z.record(z.string()),
  headers: z.object({
    'Idempotency-Key': z.string().min(8),
    'Content-Type': z.literal('application/json'),
    Authorization: z.string().startsWith('Bearer '),
  }),
});

export const PayPalAmountSchema = z.object({
  currency_code: z.string().length(3),
  value: z.string().regex(/^\d+\.\d{2}$/, 'PayPal amounts are decimal strings with two places'),
});

export const PayPalCreateOrderRequestSchema = z.object({
  intent: z.literal('CAPTURE'),
  purchase_units: z
    .array(
      z.object({
        description: z.string().min(1),
        amount: PayPalAmountSchema,
      })
    )
    .min(1),
  application_context: z.object({
    brand_name: z.string().min(1),
    locale: z.string().min(2),
    user_action: z.literal('PAY_NOW'),
  }),
});

export const MpesaStkPushRequestSchema = z.object({
  BusinessShortCode: z.string().regex(/^\d{5,7}$/),
  Password: z.string().min(8),
  Timestamp: z.string().regex(/^\d{14}$/),
  Amount: z.number().int().positive(),
  PartyA: z.string().regex(/^254\d{9}$/),
  PartyB: z.string().regex(/^\d{5,7}$/),
  PhoneNumber: z.string().regex(/^254\d{9}$/),
  CallBackURL: z.string().url(),
  AccountReference: z.string().min(1).max(12),
  TransactionDesc: z.string().min(1).max(13),
});

export const MpesaStkQueryRequestSchema = z.object({
  BusinessShortCode: z.string().regex(/^\d{5,7}$/),
  Password: z.string().min(8),
  Timestamp: z.string().regex(/^\d{14}$/),
  CheckoutRequestID: z.string().min(1),
});

export const FlutterwaveChargeRequestSchema = z.object({
  tx_ref: z.string().min(6),
  amount: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.string().length(3),
  customer: z.object({
    email: z.string().email(),
  }),
  payment_options: z.string().min(3),
  meta: z.record(z.string()),
});

export const SaleSplitSchema = z.object({
  grossMinor: z.number().int().nonnegative(),
  creatorMinor: z.number().int().nonnegative(),
  platformMinor: z.number().int().nonnegative(),
});

export const PayoutRecordSchema = z.object({
  id: z.string().min(1),
  creatorId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  currency: CurrencyCodeSchema,
  grossMinor: z.number().int().nonnegative(),
  commissionMinor: z.number().int().nonnegative(),
  creatorNetMinor: z.number().int().nonnegative(),
  feeMinor: z.number().int().nonnegative(),
  withholdingMinor: z.number().int().nonnegative(),
  disbursementMinor: z.number().int().nonnegative(),
  method: PayoutMethodSchema,
  status: PayoutStatusSchema,
  scheduledFor: z.string().min(1),
  paidAt: z.string().nullable(),
  reference: z.string().nullable(),
});

export type PayoutRecord = z.infer<typeof PayoutRecordSchema>;

export const TaxReportLineSchema = z.object({
  month: z.number().int().min(1).max(12),
  grossMinor: z.number().int().nonnegative(),
  commissionMinor: z.number().int().nonnegative(),
  feeMinor: z.number().int().nonnegative(),
  withholdingMinor: z.number().int().nonnegative(),
  netPaidMinor: z.number().int().nonnegative(),
});

export const TaxReportSchema = z.object({
  creatorId: z.string().min(1),
  year: z.number().int().min(2000),
  currency: CurrencyCodeSchema,
  months: z.array(TaxReportLineSchema).length(12),
  totals: TaxReportLineSchema.omit({ month: true }),
});

export type TaxReport = z.infer<typeof TaxReportSchema>;
export type TaxReportLine = z.infer<typeof TaxReportLineSchema>;
