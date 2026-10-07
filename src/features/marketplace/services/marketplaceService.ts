import {
  CreatorAnalytics,
  CreatorListing,
  CreatorListingSchema,
  CreatorSalesAggregate,
  ListingStatus,
  PayoutScheduleEntry,
  ReviewStatus,
} from '../types/marketplace';
import {
  PayoutService,
  RevenueSale,
  splitRevenue,
} from '@/features/billing/services/payoutService';
import { SAMPLE_CREATORS, SAMPLE_PAYOUT_RECORDS } from '@/features/billing/data/sampleBillingData';
import { PayoutRecord } from '@/features/billing/types/billing';

const LISTINGS_STORAGE_KEY = 'grade_glow_marketplace_listings';

export const SAMPLE_LISTINGS: CreatorListing[] = [
  {
    id: 'lst-crt-wanjiku-001',
    creatorId: 'crt-wanjiku',
    title: 'KCSE Mathematics Revision Kit — Form 4',
    type: 'revision_kit',
    summary:
      'Covers linear programming, calculus, probability and 40 timed mocks.',
    priceMinor: 750_000,
    currency: 'KES',
    unitsSold: 214,
    grossMinor: 160_500_000,
    netMinor: 128_400_000,
    status: 'published',
    reviewStatus: 'approved',
    tags: ['mathematics', 'kcse', 'form4'],
    thumbnailUrl: null,
    createdAt: '2026-03-10T08:00:00.000Z',
    publishedAt: '2026-03-15T09:30:00.000Z',
    updatedAt: '2026-09-28T08:00:00.000Z',
  },
  {
    id: 'lst-crt-otieno-001',
    creatorId: 'crt-otieno',
    title: 'KCSE Physics Video Course',
    type: 'video_course',
    summary: 'Concept-driven explanations with lab demos & revision sheets.',
    priceMinor: 250_000,
    currency: 'KES',
    unitsSold: 148,
    grossMinor: 37_000_000,
    netMinor: 29_600_000,
    status: 'published',
    reviewStatus: 'approved',
    tags: ['physics', 'kcse', 'video'],
    thumbnailUrl: null,
    createdAt: '2026-04-21T09:00:00.000Z',
    publishedAt: '2026-05-04T12:00:00.000Z',
    updatedAt: '2026-09-20T06:00:00.000Z',
  },
  {
    id: 'lst-crt-amara-001',
    creatorId: 'crt-amara',
    title: 'English Composition Blueprint',
    type: 'revision_kit',
    summary: 'Essay structures, summary rules and 30 exam-standard tasks.',
    priceMinor: 1_500_000,
    currency: 'NGN',
    unitsSold: 36,
    grossMinor: 54_000_000,
    netMinor: 43_200_000,
    status: 'published',
    reviewStatus: 'approved',
    tags: ['english', 'waec', 'composition'],
    thumbnailUrl: null,
    createdAt: '2026-06-16T07:00:00.000Z',
    publishedAt: '2026-06-29T07:00:00.000Z',
    updatedAt: '2026-09-18T17:00:00.000Z',
  },
  {
    id: 'lst-crt-sofia-001',
    creatorId: 'crt-sofia',
    title: 'European ESL Mini-Course',
    type: 'video_course',
    summary: 'A2–B1 speaking, listening and grammar in 12 modules.',
    priceMinor: 15_000,
    currency: 'EUR',
    unitsSold: 92,
    grossMinor: 1_380_000,
    netMinor: 1_104_000,
    status: 'published',
    reviewStatus: 'approved',
    tags: ['esl', 'europe', 'speaking'],
    thumbnailUrl: null,
    createdAt: '2026-07-07T10:00:00.000Z',
    publishedAt: '2026-07-09T10:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
  },
  {
    id: 'lst-crt-arjun-001',
    creatorId: 'crt-arjun',
    title: 'JEE Main Physics Rapid Revision',
    type: 'revision_kit',
    summary: 'High-yield formulas, MCQs with solutions, error-tracking sheets.',
    priceMinor: 100_000,
    currency: 'INR',
    unitsSold: 68,
    grossMinor: 6_800_000,
    netMinor: 5_440_000,
    status: 'unpublished',
    reviewStatus: 'submitted',
    tags: ['physics', 'jee', 'mcq'],
    thumbnailUrl: null,
    createdAt: '2026-09-15T13:00:00.000Z',
    publishedAt: null,
    updatedAt: '2026-09-30T21:00:00.000Z',
  },
  {
    id: 'lst-crt-thabo-001',
    creatorId: 'crt-thabo',
    title: 'Grade 12 Life Sciences Video Pathways',
    type: 'video_course',
    summary: 'Homeostasis, genetics and past-paper walkthroughs.',
    priceMinor: 60_000,
    currency: 'ZAR',
    unitsSold: 54,
    grossMinor: 3_240_000,
    netMinor: 2_592_000,
    status: 'published',
    reviewStatus: 'approved',
    tags: ['biology', 'matric', 'video'],
    thumbnailUrl: null,
    createdAt: '2026-08-01T07:30:00.000Z',
    publishedAt: '2026-08-12T07:30:00.000Z',
    updatedAt: '2026-09-27T07:30:00.000Z',
  },
];

function randomHex(len: number): string {
  const alphabet = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * 16)];
  return out;
}

export class MarketplaceService {
  private static listings: CreatorListing[] | null = null;

  static resetToDefaults(): void {
    this.listings = SAMPLE_LISTINGS.map((listing) => ({ ...listing }));
    this.persist();
  }

  private static load(): CreatorListing[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(LISTINGS_STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const valid: CreatorListing[] = [];
            for (const item of parsed) {
              const result = CreatorListingSchema.safeParse(item);
              if (result.success) valid.push(result.data);
            }
            if (valid.length > 0) return valid;
          }
        }
      }
    } catch {
      // ignore
    }
    return SAMPLE_LISTINGS.map((listing) => ({ ...listing }));
  }

  private static persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(this.listings ?? []));
      }
    } catch {
      // ignore
    }
  }

  private static ensureLoaded(): CreatorListing[] {
    if (this.listings === null) this.listings = this.load();
    return this.listings;
  }

  static getListings(filters?: {
    creatorId?: string;
    status?: ListingStatus;
    type?: string;
  }): CreatorListing[] {
    let list = [...this.ensureLoaded()];
    if (filters?.creatorId) list = list.filter((item) => item.creatorId === filters.creatorId);
    if (filters?.status) list = list.filter((item) => item.status === filters.status);
    if (filters?.type) list = list.filter((item) => item.type === filters.type);
    return list;
  }

  static getListing(id: string): CreatorListing | undefined {
    return this.ensureLoaded().find((item) => item.id === id);
  }

  static publishListing(id: string): CreatorListing {
    const listings = this.ensureLoaded();
    const index = listings.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Listing ${id} not found.`);
    const now = new Date().toISOString();
    listings[index] = {
      ...listings[index],
      status: 'published',
      reviewStatus: 'approved',
      publishedAt: listings[index].publishedAt ?? now,
      updatedAt: now,
    };
    this.persist();
    return { ...listings[index] };
  }

  static unpublishListing(id: string): CreatorListing {
    const listings = this.ensureLoaded();
    const index = listings.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Listing ${id} not found.`);
    listings[index] = {
      ...listings[index],
      status: 'unpublished',
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return { ...listings[index] };
  }

  static recordSale(
    listingId: string,
    quantity: number,
    soldAt: string
  ): { listing: CreatorListing; sale: RevenueSale } {
    const listings = this.ensureLoaded();
    const index = listings.findIndex((item) => item.id === idCheck(listingId));
    if (index === -1) throw new Error(`Listing ${listingId} not found.`);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive integer.');
    }
    const listing = listings[index];
    const grossDelta = listing.priceMinor * quantity;
    const split = splitRevenue(grossDelta);
    const updated: CreatorListing = {
      ...listing,
      unitsSold: listing.unitsSold + quantity,
      grossMinor: listing.grossMinor + grossDelta,
      netMinor: listing.netMinor + split.creatorMinor,
      updatedAt: soldAt,
    };
    listings[index] = updated;
    this.persist();

    const sale: RevenueSale = {
      saleId: `sale_${listing.id}_${randomHex(6)}`,
      creatorId: listing.creatorId,
      listingId: listing.id,
      grossMinor: grossDelta,
      currency: listing.currency,
      soldAt,
    };
    return { listing: { ...updated }, sale };
  }

  static getSalesAggregates(creatorId: string, periodStart: string, periodEnd: string): CreatorSalesAggregate {
    const listings = this.getListings({ creatorId });
    let totalGross = 0;
    let totalNet = 0;
    let totalUnits = 0;
    const breakdown = listings.map((listing) => {
      const unitsSoldInWindow = Math.max(0, Math.floor(listing.unitsSold * 0.4));
      const gross = listing.priceMinor * unitsSoldInWindow;
      const split = splitRevenue(gross);
      totalGross += gross;
      totalNet += split.creatorMinor;
      totalUnits += unitsSoldInWindow;
      return {
        listingId: listing.id,
        title: listing.title,
        unitsSold: unitsSoldInWindow,
        grossMinor: gross,
        netMinor: split.creatorMinor,
      };
    });
    const currency = listings[0]?.currency ?? PayoutService.getCreatorProfile(creatorId)?.baseCurrency ?? 'KES';
    return {
      creatorId,
      periodStart,
      periodEnd,
      currency,
      totalGrossMinor: totalGross,
      totalNetMinor: totalNet,
      totalUnits,
      listingBreakdown: breakdown,
    };
  }

  static getAnalytics(creatorId: string): CreatorAnalytics {
    const listings = this.getListings({ creatorId }).filter((item) => item.status === 'published');
    const totalUnitsSold = listings.reduce((sum, item) => sum + item.unitsSold, 0);
    const totalGrossMinor = listings.reduce((sum, item) => sum + item.grossMinor, 0);
    const totalNetMinor = listings.reduce((sum, item) => sum + item.netMinor, 0);
    const publishedListings = listings.length;
    const ratings = [4.9, 4.8, 4.7, 5.0].slice(0, publishedListings);
    const ratingAverage = ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : 0;
    const reviewCount = Math.max(0, totalUnitsSold - Math.floor(totalUnitsSold * 0.8));

    const monthlyRevenue = [
      { month: '2026-06', grossMinor: 0, netMinor: 0, units: 0 },
      { month: '2026-07', grossMinor: Math.floor(totalGrossMinor * 0.12), netMinor: Math.floor(totalNetMinor * 0.12), units: Math.floor(totalUnitsSold * 0.12) },
      { month: '2026-08', grossMinor: Math.floor(totalGrossMinor * 0.18), netMinor: Math.floor(totalNetMinor * 0.18), units: Math.floor(totalUnitsSold * 0.18) },
      { month: '2026-09', grossMinor: Math.floor(totalGrossMinor * 0.24), netMinor: Math.floor(totalNetMinor * 0.24), units: Math.floor(totalUnitsSold * 0.24) },
    ];

    const topProducts = [...listings]
      .sort((a, b) => b.grossMinor - a.grossMinor)
      .slice(0, 3)
      .map((listing) => ({
        listingId: listing.id,
        title: listing.title,
        unitsSold: listing.unitsSold,
        grossMinor: listing.grossMinor,
        netMinor: listing.netMinor,
        ratingAverage: ratings[listings.indexOf(listing)] ?? 4.8,
      }));

    return {
      creatorId,
      totalGrossMinor,
      totalNetMinor,
      totalUnitsSold,
      publishedListings,
      ratingAverage,
      reviewCount,
      monthlyRevenue,
      topProducts,
    };
  }

  static getPayoutSchedule(creatorId: string): PayoutScheduleEntry[] {
    const records = PayoutService.getLedger(creatorId).map((r: PayoutRecord) => ({
      id: `sch_${r.id}`,
      creatorId: r.creatorId,
      window: 'monthly' as const,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      currency: r.currency,
      status: r.status as PayoutScheduleEntry['status'],
      scheduledFor: r.scheduledFor,
      paidAt: r.paidAt,
      recordId: r.id,
      grossMinor: r.grossMinor,
      netMinor: r.creatorNetMinor,
      unitsSold: Math.max(0, Math.floor(r.grossMinor / 25_000)),
    }));
    return records.length > 0
      ? records
      : [
          {
            id: 'sch_sample_none',
            creatorId,
            window: 'monthly',
            periodStart: '2026-10-01T00:00:00.000Z',
            periodEnd: '2026-11-01T00:00:00.000Z',
            currency: PayoutService.getCreatorProfile(creatorId)?.baseCurrency ?? 'KES',
            status: 'pending',
            scheduledFor: '2026-11-05T09:00:00.000Z',
            paidAt: null,
            recordId: '',
            grossMinor: 0,
            netMinor: 0,
            unitsSold: 0,
          },
        ];
  }

  static createListing(input: {
    creatorId: string;
    title: string;
    type: 'revision_kit' | 'video_course';
    summary: string;
    priceMinor: number;
    currency: CreatorListing['currency'];
    tags: string[];
    thumbnailUrl?: string | null;
  }): CreatorListing {
    const listings = this.ensureLoaded();
    const now = new Date().toISOString();
    const listing: CreatorListing = {
      id: `lst_${input.creatorId}_${Date.now().toString(36)}_${randomHex(4)}`,
      creatorId: input.creatorId,
      title: input.title.trim(),
      type: input.type,
      summary: input.summary.trim(),
      priceMinor: input.priceMinor,
      currency: input.currency,
      unitsSold: 0,
      grossMinor: 0,
      netMinor: 0,
      status: 'unpublished',
      reviewStatus: 'draft',
      tags: input.tags.filter((tag) => tag.trim().length > 0),
      thumbnailUrl: input.thumbnailUrl ?? null,
      createdAt: now,
      publishedAt: null,
      updatedAt: now,
    };
    const result = CreatorListingSchema.safeParse(listing);
    if (!result.success) {
      throw new Error(`Invalid marketplace listing: ${result.error.issues[0]?.message}`);
    }
    listings.unshift(result.data);
    this.persist();
    return { ...result.data };
  }

  static getTaxReport(creatorId: string, year: number): ReturnType<typeof PayoutService.buildTaxReport> {
    return PayoutService.buildTaxReport(creatorId, year);
  }
}

function idCheck(id: string): string {
  return id;
}

MarketplaceService.resetToDefaults();
