import { z } from 'zod';
import { CurrencyCode, PayoutRecord, TaxReport } from '@/features/billing/types/billing';

export type ListingType = 'revision_kit' | 'video_course';

export type ReviewStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type ListingStatus = 'unpublished' | 'published' | 'archived';

export type PayoutWindow = 'monthly';

export interface CreatorListing {
  id: string;
  creatorId: string;
  title: string;
  type: ListingType;
  summary: string;
  priceMinor: number;
  currency: CurrencyCode;
  unitsSold: number;
  grossMinor: number;
  netMinor: number;
  status: ListingStatus;
  reviewStatus: ReviewStatus;
  tags: string[];
  thumbnailUrl: string | null;
  createdAt: string;
  publishedAt: string | null;
  updatedAt: string;
}

export interface CreatorSalesAggregate {
  creatorId: string;
  periodStart: string;
  periodEnd: string;
  currency: CurrencyCode;
  totalGrossMinor: number;
  totalNetMinor: number;
  totalUnits: number;
  listingBreakdown: Array<{
    listingId: string;
    title: string;
    unitsSold: number;
    grossMinor: number;
    netMinor: number;
  }>;
}

export interface CreatorAnalytics {
  creatorId: string;
  totalGrossMinor: number;
  totalNetMinor: number;
  totalUnitsSold: number;
  publishedListings: number;
  ratingAverage: number;
  reviewCount: number;
  monthlyRevenue: Array<{
    month: string;
    grossMinor: number;
    netMinor: number;
    units: number;
  }>;
  topProducts: Array<{
    listingId: string;
    title: string;
    unitsSold: number;
    grossMinor: number;
    netMinor: number;
    ratingAverage: number;
  }>;
}

export interface PayoutScheduleEntry {
  id: string;
  creatorId: string;
  window: PayoutWindow;
  periodStart: string;
  periodEnd: string;
  currency: CurrencyCode;
  status: 'scheduled' | 'paid' | 'pending' | 'failed';
  scheduledFor: string;
  paidAt: string | null;
  recordId: string;
  grossMinor: number;
  netMinor: number;
  unitsSold: number;
}

export const ListingTypeSchema = z.enum(['revision_kit', 'video_course']);

export const ListingStatusSchema = z.enum(['unpublished', 'published', 'archived']);

export const ReviewStatusSchema = z.enum(['draft', 'submitted', 'approved', 'rejected']);

export const CreatorListingSchema = z.object({
  id: z.string().min(1),
  creatorId: z.string().min(1),
  title: z.string().min(3),
  type: ListingTypeSchema,
  summary: z.string().min(10),
  priceMinor: z.number().int().positive(),
  currency: z.enum(['KES', 'USD', 'GBP', 'EUR', 'NGN', 'GHS', 'ZAR', 'INR']),
  unitsSold: z.number().int().nonnegative(),
  grossMinor: z.number().int().nonnegative(),
  netMinor: z.number().int().nonnegative(),
  status: ListingStatusSchema,
  reviewStatus: ReviewStatusSchema,
  tags: z.array(z.string()),
  thumbnailUrl: z.string().url().nullable(),
  createdAt: z.string().min(1),
  publishedAt: z.string().nullable(),
  updatedAt: z.string().min(1),
});
