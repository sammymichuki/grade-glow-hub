import {
  CreatorPayoutProfile,
  CurrencyCode,
  PayoutMethod,
  PayoutRecord,
  PayoutRecordSchema,
  PayoutStatus,
  TaxReport,
  TaxReportLine,
} from '../types/billing';
import { convertMinorUnits, formatMoney } from './paymentGatewayService';
import { SAMPLE_CREATORS, SAMPLE_PAYOUT_RECORDS } from '../data/sampleBillingData';

export const CREATOR_SHARE_BP = 8_000;
export const PLATFORM_SHARE_BP = 10_000 - CREATOR_SHARE_BP;

export interface RevenueSale {
  saleId: string;
  creatorId: string;
  listingId: string;
  grossMinor: number;
  currency: CurrencyCode;
  soldAt: string;
}

export interface RevenueSplit {
  grossMinor: number;
  creatorMinor: number;
  platformMinor: number;
}

/**
 * 80/20 revenue split in integer minor units. The creator share floors so the
 * platform absorbs sub-unit rounding; creator + platform always sums to gross.
 */
export function splitRevenue(grossMinor: number, creatorShareBp: number = CREATOR_SHARE_BP): RevenueSplit {
  if (!Number.isInteger(grossMinor) || grossMinor < 0) {
    throw new Error(`Gross amount must be a non-negative integer of minor units, received ${grossMinor}.`);
  }
  if (creatorShareBp < 0 || creatorShareBp > 10_000) {
    throw new Error('Creator share must be between 0 and 10000 basis points.');
  }
  const creatorMinor = Math.floor((grossMinor * creatorShareBp) / 10_000);
  return {
    grossMinor,
    creatorMinor,
    platformMinor: grossMinor - creatorMinor,
  };
}

export interface MethodFeeSchedule {
  label: string;
  fixedUsdMinor: number;
  bps: number;
}

export const PAYOUT_METHOD_FEES: Record<PayoutMethod, MethodFeeSchedule> = {
  mpesa: { label: 'M-Pesa B2C disbursement', fixedUsdMinor: 50, bps: 50 },
  stripe: { label: 'Stripe Instant Payout', fixedUsdMinor: 30, bps: 290 },
  bank_transfer: { label: 'SWIFT / local bank transfer', fixedUsdMinor: 500, bps: 0 },
};

/**
 * Disbursement fee = PPP-converted fixed cost + basis-point variable cost.
 * The variable part rounds up so the platform never under-recovers fees.
 */
export function computePayoutFee(method: PayoutMethod, amountMinor: number, currency: CurrencyCode): number {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error('Fee base must be a non-negative integer of minor units.');
  }
  const schedule = PAYOUT_METHOD_FEES[method];
  const fixed = convertMinorUnits(schedule.fixedUsdMinor, 'USD', currency);
  const variable = Math.ceil((amountMinor * schedule.bps) / 10_000);
  return fixed + variable;
}

/** Withholding tax with round-half-up integer math on the creator share. */
export function computeWithholding(amountMinor: number, rateBp: number): number {
  if (rateBp < 0 || rateBp > 10_000) throw new Error('Withholding rate must be 0–10000 bp.');
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error('Withholding base must be a non-negative integer of minor units.');
  }
  return Math.floor((amountMinor * rateBp + 5_000) / 10_000);
}

export const DEFAULT_MIN_PAYOUT_MINOR: Record<CurrencyCode, number> = {
  KES: 100_000,
  USD: 1_000,
  GBP: 1_000,
  EUR: 1_000,
  NGN: 500_000,
  GHS: 10_000,
  ZAR: 20_000,
  INR: 100_000,
};

const PAYOUT_TRANSITIONS: Readonly<Record<PayoutStatus, readonly PayoutStatus[]>> = Object.freeze({
  pending: Object.freeze(['scheduled', 'failed'] as const),
  scheduled: Object.freeze(['processing', 'paid', 'failed'] as const),
  processing: Object.freeze(['paid', 'failed'] as const),
  paid: Object.freeze([] as const),
  failed: Object.freeze(['scheduled'] as const),
});

export function canTransitionPayout(from: PayoutStatus, to: PayoutStatus): boolean {
  return PAYOUT_TRANSITIONS[from].includes(to);
}

export function assertPayoutTransition(from: PayoutStatus, to: PayoutStatus): void {
  if (!canTransitionPayout(from, to)) {
    throw new Error(`Invalid payout status transition: ${from} -> ${to}.`);
  }
}

export interface PayoutBatchInput {
  creatorId: string;
  sales: RevenueSale[];
  periodStart: string;
  periodEnd: string;
  payoutCurrency: CurrencyCode;
  method: PayoutMethod;
  minPayoutMinor?: number;
  withholdingRateBp?: number;
}

export interface PayoutBatchOutcome {
  record: PayoutRecord;
  belowThreshold: boolean;
}

function salesInRange(sales: RevenueSale[], creatorId: string, periodStart: string, periodEnd: string): RevenueSale[] {
  return sales.filter(
    (sale) =>
      sale.creatorId === creatorId &&
      sale.soldAt >= periodStart &&
      sale.soldAt < periodEnd
  );
}

/**
 * Aggregates a creator's sales over a period, applies the 80/20 split per sale,
 * deducts method fees + withholding, converts to the disbursement currency and
 * applies the minimum-payout threshold.
 */
export function buildPayoutBatch(input: PayoutBatchInput): PayoutBatchOutcome {
  const relevant = salesInRange(input.sales, input.creatorId, input.periodStart, input.periodEnd);
  const minPayout = input.minPayoutMinor ?? DEFAULT_MIN_PAYOUT_MINOR[input.payoutCurrency];
  const withholdingRateBp = input.withholdingRateBp ?? 0;

  let gross = 0;
  let creator = 0;
  for (const sale of relevant) {
    const convertedGross = convertMinorUnits(sale.grossMinor, sale.currency, input.payoutCurrency);
    const split = splitRevenue(convertedGross);
    gross += split.grossMinor;
    creator += split.creatorMinor;
  }
  const platform = gross - creator;

  const fee = computePayoutFee(input.method, creator, input.payoutCurrency);
  const withholding = computeWithholding(creator, withholdingRateBp);
  const cappedFee = Math.min(fee, creator);
  const cappedWithholding = Math.min(withholding, creator - cappedFee);
  const disbursement = creator - cappedFee - cappedWithholding;
  const belowThreshold = disbursement < minPayout;

  const record: PayoutRecord = {
    id: `po_${input.creatorId}_${input.periodStart.slice(0, 7)}_${input.method}`,
    creatorId: input.creatorId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    currency: input.payoutCurrency,
    grossMinor: gross,
    commissionMinor: platform,
    creatorNetMinor: creator,
    feeMinor: cappedFee,
    withholdingMinor: cappedWithholding,
    disbursementMinor: disbursement,
    method: input.method,
    status: belowThreshold ? 'pending' : 'scheduled',
    scheduledFor: input.periodEnd,
    paidAt: null,
    reference: null,
  };

  const parsed = PayoutRecordSchema.safeParse(record);
  if (!parsed.success) {
    throw new Error(`Payout batch failed validation: ${parsed.error.issues[0]?.message}`);
  }
  if (parsed.data.creatorNetMinor + parsed.data.commissionMinor !== parsed.data.grossMinor) {
    throw new Error('Payout split invariant violated: creator + platform must equal gross.');
  }

  return { record: parsed.data, belowThreshold };
}

export interface PayoutSummary {
  creatorId: string;
  recordCount: number;
  scheduledMinor: number;
  paidMinor: number;
  pendingMinor: number;
  owedMinor: number;
  currency: CurrencyCode | null;
}

const LEDGER_STORAGE_KEY = 'grade_glow_payout_ledger';
const CREATORS_STORAGE_KEY = 'grade_glow_creator_payout_profiles';

export class PayoutService {
  private static ledger: PayoutRecord[] | null = null;
  private static creators: CreatorPayoutProfile[] | null = null;

  static resetToDefaults(): void {
    this.ledger = SAMPLE_PAYOUT_RECORDS.map((record) => ({ ...record }));
    this.creators = SAMPLE_CREATORS.map((creator) => ({ ...creator }));
    this.persistLedger();
    this.persistCreators();
  }

  private static loadLedger(): PayoutRecord[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const valid: PayoutRecord[] = [];
            for (const item of parsed) {
              const result = PayoutRecordSchema.safeParse(item);
              if (result.success) valid.push(result.data);
            }
            if (valid.length > 0 || parsed.length === 0) return valid;
          }
        }
      }
    } catch {
      // fall through to fixtures
    }
    return SAMPLE_PAYOUT_RECORDS.map((record) => ({ ...record }));
  }

  private static loadCreators(): CreatorPayoutProfile[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(CREATORS_STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed as CreatorPayoutProfile[];
        }
      }
    } catch {
      // fall through to fixtures
    }
    return SAMPLE_CREATORS.map((creator) => ({ ...creator }));
  }

  private static persistLedger(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(this.ledger ?? []));
      }
    } catch {
      // storage unavailable
    }
  }

  private static persistCreators(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(this.creators ?? []));
      }
    } catch {
      // storage unavailable
    }
  }

  private static ensureLedger(): PayoutRecord[] {
    if (this.ledger === null) this.ledger = this.loadLedger();
    return this.ledger;
  }

  private static ensureCreators(): CreatorPayoutProfile[] {
    if (this.creators === null) this.creators = this.loadCreators();
    return this.creators;
  }

  static getCreatorProfiles(): CreatorPayoutProfile[] {
    return this.ensureCreators().map((creator) => ({ ...creator }));
  }

  static getCreatorProfile(creatorId: string): CreatorPayoutProfile | undefined {
    const creator = this.ensureCreators().find((entry) => entry.id === creatorId);
    return creator ? { ...creator } : undefined;
  }

  static updateCreatorSettings(
    creatorId: string,
    settings: Partial<Pick<CreatorPayoutProfile, 'minPayoutMinor' | 'payoutMethod' | 'withholdingRateBp'>>
  ): CreatorPayoutProfile {
    const creators = this.ensureCreators();
    const index = creators.findIndex((entry) => entry.id === creatorId);
    if (index === -1) throw new Error(`Creator ${creatorId} not found.`);
    if (settings.minPayoutMinor !== undefined) {
      if (!Number.isInteger(settings.minPayoutMinor) || settings.minPayoutMinor < 0) {
        throw new Error('Minimum payout must be a non-negative integer in minor units.');
      }
    }
    if (settings.withholdingRateBp !== undefined && (settings.withholdingRateBp < 0 || settings.withholdingRateBp > 10_000)) {
      throw new Error('Withholding rate must be 0–10000 basis points.');
    }
    creators[index] = { ...creators[index], ...settings };
    this.persistCreators();
    return { ...creators[index] };
  }

  static getLedger(creatorId?: string): PayoutRecord[] {
    const records = this.ensureLedger();
    const filtered = creatorId ? records.filter((record) => record.creatorId === creatorId) : records;
    return filtered.map((record) => ({ ...record }));
  }

  /** Records a batch once per creator + period; repeated calls replay the ledger entry. */
  static recordPayoutBatch(input: PayoutBatchInput): PayoutRecord {
    const ledger = this.ensureLedger();
    const existing = ledger.find(
      (record) =>
        record.creatorId === input.creatorId &&
        record.periodStart === input.periodStart &&
        record.periodEnd === input.periodEnd
    );
    if (existing) return { ...existing };

    const outcome = buildPayoutBatch(input);
    ledger.unshift(outcome.record);
    this.persistLedger();
    return { ...outcome.record };
  }

  static scheduleMonthlyPayouts(
    sales: RevenueSale[],
    options: { year: number; month: number }
  ): PayoutRecord[] {
    const monthIndex = options.month - 1;
    if (!Number.isInteger(options.month) || monthIndex < 0 || monthIndex > 11) {
      throw new Error('Month must be 1–12.');
    }
    const periodStart = new Date(Date.UTC(options.year, monthIndex, 1)).toISOString();
    const periodEnd = new Date(Date.UTC(options.year, monthIndex + 1, 1)).toISOString();

    const creatorIds = Array.from(
      new Set(
        sales
          .filter((sale) => sale.soldAt >= periodStart && sale.soldAt < periodEnd)
          .map((sale) => sale.creatorId)
      )
    );

    const records: PayoutRecord[] = [];
    for (const creatorId of creatorIds) {
      const profile = this.getCreatorProfile(creatorId);
      records.push(
        this.recordPayoutBatch({
          creatorId,
          sales,
          periodStart,
          periodEnd,
          payoutCurrency: profile?.baseCurrency ?? 'KES',
          method: profile?.payoutMethod ?? 'mpesa',
          minPayoutMinor: profile?.minPayoutMinor,
          withholdingRateBp: profile?.withholdingRateBp,
        })
      );
    }
    return records;
  }

  static advanceStatus(id: string, next: PayoutStatus, reference?: string): PayoutRecord {
    const ledger = this.ensureLedger();
    const index = ledger.findIndex((record) => record.id === id);
    if (index === -1) throw new Error(`Payout ${id} not found.`);
    const current = ledger[index];
    assertPayoutTransition(current.status, next);
    const updated: PayoutRecord = {
      ...current,
      status: next,
      paidAt: next === 'paid' ? new Date().toISOString() : current.paidAt,
      reference: reference ?? current.reference,
    };
    ledger[index] = updated;
    this.persistLedger();
    return { ...updated };
  }

  static markPaid(id: string, reference?: string): PayoutRecord {
    let current = this.getLedger().find((entry) => entry.id === id);
    if (!current) throw new Error(`Payout ${id} not found.`);
    if (current.status === 'failed') current = this.advanceStatus(id, 'scheduled');
    if (current.status === 'pending') current = this.advanceStatus(id, 'scheduled');
    if (current.status === 'scheduled') current = this.advanceStatus(id, 'processing');
    if (current.status === 'processing') {
      current = this.advanceStatus(id, 'paid', reference ?? `REF-${id.toUpperCase()}`);
    }
    return { ...current };
  }

  static summarize(creatorId: string): PayoutSummary {
    const records = this.getLedger(creatorId);
    const sum = (statuses: PayoutStatus[]) =>
      records
        .filter((record) => statuses.includes(record.status))
        .reduce((total, record) => total + record.disbursementMinor, 0);
    return {
      creatorId,
      recordCount: records.length,
      scheduledMinor: sum(['scheduled', 'processing']),
      paidMinor: sum(['paid']),
      pendingMinor: sum(['pending', 'failed']),
      owedMinor: records
        .filter((record) => record.status !== 'paid')
        .reduce((total, record) => total + record.disbursementMinor, 0),
      currency: records[0]?.currency ?? null,
    };
  }

  static buildTaxReport(creatorId: string, year: number, sales?: RevenueSale[]): TaxReport {
    const profile = this.getCreatorProfile(creatorId);
    const currency = profile?.baseCurrency ?? 'KES';
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year + 1}-01-01`;

    const creatorSales = (sales ?? []).filter(
      (sale) => sale.creatorId === creatorId && sale.soldAt >= yearStart && sale.soldAt < yearEnd
    );
    const creatorPayouts = this.getLedger(creatorId).filter(
      (record) => record.periodStart >= yearStart && record.periodStart < yearEnd
    );

    const months: TaxReportLine[] = [];
    for (let month = 1; month <= 12; month++) {
      const monthSales = creatorSales.filter((sale) => Number(sale.soldAt.slice(5, 7)) === month);
      const monthPayouts = creatorPayouts.filter((record) =>
        record.periodStart.startsWith(`${year}-${String(month).padStart(2, '0')}`)
      );

      let gross = 0;
      let commission = 0;
      for (const sale of monthSales) {
        const converted = convertMinorUnits(sale.grossMinor, sale.currency, currency);
        const split = splitRevenue(converted);
        gross += split.grossMinor;
        commission += split.platformMinor;
      }
      const fee = monthPayouts.reduce((total, record) => total + record.feeMinor, 0);
      const withholding = monthPayouts.reduce((total, record) => total + record.withholdingMinor, 0);
      const netPaid = monthPayouts
        .filter((record) => record.status === 'paid')
        .reduce((total, record) => total + record.disbursementMinor, 0);

      months.push({
        month,
        grossMinor: gross,
        commissionMinor: commission,
        feeMinor: fee,
        withholdingMinor: withholding,
        netPaidMinor: netPaid,
      });
    }

    const totals: Omit<TaxReportLine, 'month'> = {
      grossMinor: months.reduce((t, m) => t + m.grossMinor, 0),
      commissionMinor: months.reduce((t, m) => t + m.commissionMinor, 0),
      feeMinor: months.reduce((t, m) => t + m.feeMinor, 0),
      withholdingMinor: months.reduce((t, m) => t + m.withholdingMinor, 0),
      netPaidMinor: months.reduce((t, m) => t + m.netPaidMinor, 0),
    };

    return { creatorId, year, currency, months, totals };
  }
}

export function describeMoney(amountMinor: number, currency: CurrencyCode): string {
  return formatMoney(amountMinor, currency);
}
