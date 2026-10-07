import { z } from 'zod';

// ------------------------------------------------------------------ //
// OneRoster 1.2 contracts
// ------------------------------------------------------------------ //

export const ONE_ROSTER_RESOURCES = [
  'orgs',
  'classes',
  'courses',
  'users',
  'memberships',
  'academicSessions',
] as const;
export type OneRosterResource = (typeof ONE_ROSTER_RESOURCES)[number];

export type OneRosterStatus = 'active' | 'tobedeleted';
export const ONE_ROSTER_STATUSES = ['active', 'tobedeleted'] as const;

export type OneRosterOrgRow = {
  sourcedId: string;
  status: OneRosterStatus;
  dateLastModified: string;
  name: string;
  type: string;
  identifier?: string;
  parentSourcedId?: string;
};

export type OneRosterClassRow = {
  sourcedId: string;
  status: OneRosterStatus;
  dateLastModified: string;
  title: string;
  classCode?: string;
  schoolSourcedId?: string;
  courseSourcedId?: string;
  termSourcedIds?: string;
  grade?: string;
  subject?: string;
  classPeriods?: string;
  teachers?: string;
};

export type OneRosterCourseRow = {
  sourcedId: string;
  status: OneRosterStatus;
  dateLastModified: string;
  title: string;
  courseCode?: string;
  subject?: string;
  orgSourcedId?: string;
  grade?: string;
};

export type OneRosterUserRow = {
  sourcedId: string;
  status: OneRosterStatus;
  dateLastModified: string;
  givenName: string;
  familyName: string;
  role: string;
  username?: string;
  email?: string;
  orgSourcedId?: string;
  grades?: string;
};

export type OneRosterMembershipRow = {
  sourcedId: string;
  status: OneRosterStatus;
  dateLastModified: string;
  userSourcedId: string;
  classSourcedId: string;
  role: string;
  dateStart?: string;
  dateEnd?: string;
};

export type OneRosterAcademicSessionRow = {
  sourcedId: string;
  status: OneRosterStatus;
  dateLastModified: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  parentSourcedId?: string;
};

export type SyncableRow = {
  sourcedId: string;
  status: OneRosterStatus;
  dateLastModified: string;
};

export const OneRosterBaseSchema = z.object({
  sourcedId: z.string().min(1),
  status: z.enum(ONE_ROSTER_STATUSES),
  dateLastModified: z.string().min(1),
});

export const OneRosterOrgSchema = OneRosterBaseSchema.extend({
  name: z.string().min(1),
  type: z.string().min(1),
  identifier: z.string(),
  parentSourcedId: z.string(),
});

export const OneRosterClassSchema = OneRosterBaseSchema.extend({
  title: z.string().min(1),
  classCode: z.string(),
  schoolSourcedId: z.string(),
  courseSourcedId: z.string(),
  termSourcedIds: z.string(),
  grade: z.string(),
  subject: z.string(),
  classPeriods: z.string(),
  teachers: z.string(),
});

export const OneRosterCourseSchema = OneRosterBaseSchema.extend({
  title: z.string().min(1),
  courseCode: z.string(),
  subject: z.string(),
  orgSourcedId: z.string(),
  grade: z.string(),
});

export const OneRosterUserSchema = OneRosterBaseSchema.extend({
  givenName: z.string().min(1),
  familyName: z.string().min(1),
  role: z.string().min(1),
  username: z.string(),
  email: z.string(),
  orgSourcedId: z.string(),
  grades: z.string(),
});

export const OneRosterMembershipSchema = OneRosterBaseSchema.extend({
  userSourcedId: z.string().min(1),
  classSourcedId: z.string().min(1),
  role: z.string().min(1),
  dateStart: z.string(),
  dateEnd: z.string(),
});

export const OneRosterAcademicSessionSchema = OneRosterBaseSchema.extend({
  title: z.string().min(1),
  type: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  parentSourcedId: z.string(),
});

export const ONE_ROSTER_SCHEMAS: Record<OneRosterResource, z.ZodTypeAny> = {
  orgs: OneRosterOrgSchema,
  classes: OneRosterClassSchema,
  courses: OneRosterCourseSchema,
  users: OneRosterUserSchema,
  memberships: OneRosterMembershipSchema,
  academicSessions: OneRosterAcademicSessionSchema,
};

export interface SyncPlan<T extends SyncableRow> {
  resource: OneRosterResource;
  added: T[];
  changed: T[];
  removed: T[];
  unchangedCount: number;
  generatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface OneRosterFilterOptions {
  search?: string;
  status?: string;
  role?: string;
  type?: string;
}

export interface DeltaQueryOptions {
  limit?: number;
  offset?: number;
}

// ------------------------------------------------------------------ //
// LTI 1.3 contracts
// ------------------------------------------------------------------ //

export interface JwtHeader {
  alg: string;
  typ?: string;
  kid?: string;
}

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  nbf?: number;
  nonce?: string;
  [claim: string]: unknown;
}

export interface JwtVerifyOptions {
  issuer?: string;
  audience?: string;
  clockSkewSeconds?: number;
  now?: number;
}

export interface JwtVerificationResult {
  valid: boolean;
  payload: JwtPayload | null;
  errors: string[];
}

export interface OidcLoginParams {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  targetLinkUri: string;
  loginHint?: string;
  deploymentId?: string;
  ltiMessageHint?: string;
}

export interface OidcLoginStart {
  state: string;
  nonce: string;
  authRequestUrl: string;
  issuedAt: number;
  ttlSeconds: number;
}

export interface OidcStateValidation {
  valid: boolean;
  errors: string[];
}

export const AgsLineItemClaimSchema = z.object({
  scoreMaximum: z.number().positive(),
  label: z.string().min(1),
  resourceId: z.string().optional(),
  tag: z.string().optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
});
export type AgsLineItemClaim = z.infer<typeof AgsLineItemClaimSchema>;

export const DeepLinkContentItemSchema = z.object({
  type: z.enum(['ltiResourceLink', 'link', 'file', 'html', 'image']),
  url: z.string().url().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
  lineItem: AgsLineItemClaimSchema.optional(),
  icon: z.object({ url: z.string().url() }).optional(),
  iframe: z
    .object({ width: z.number().int().positive().optional(), height: z.number().int().positive().optional() })
    .optional(),
});
export type DeepLinkContentItem = z.infer<typeof DeepLinkContentItemSchema>;

export interface DeepLinkingResponseParams {
  clientId: string;
  platformIssuer: string;
  deploymentId: string;
  returnUrl: string;
  nonce: string;
  data?: string;
  contentItems: DeepLinkContentItem[];
  issuedAt?: number;
  expiresInSeconds?: number;
}

export type ActivityProgress = 'Initialized' | 'InProgress' | 'Submitted' | 'Completed';
export type GradingProgress = 'NotReady' | 'Failed' | 'Pending' | 'PendingManual' | 'Ready' | 'Exempt';

export const AgsScoreSchema = z.object({
  userId: z.string().min(1),
  scoreGiven: z.number().min(0),
  scoreMaximum: z.number().positive(),
  activityProgress: z.enum(['Initialized', 'InProgress', 'Submitted', 'Completed']),
  gradingProgress: z.enum([
    'NotReady',
    'Failed',
    'Pending',
    'PendingManual',
    'Ready',
    'Exempt',
  ]),
  timestamp: z.string().datetime(),
  comment: z.string().optional(),
});
export type AgsScore = z.infer<typeof AgsScoreSchema>;

export const LTI_CLAIM_PREFIX = 'https://purl.imsglobal.org/spec/lti/claim/';
export const LTI_DL_CLAIM_PREFIX = 'https://purl.imsglobal.org/spec/lti-dl/claim/';
export const AGS_SCOPE_LINEITEM = 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem';
export const AGS_SCOPE_RESULT =
  'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly';
export const AGS_SCOPE_SCORE =
  'https://purl.imsglobal.org/spec/lti-ags/scope/score';

// ------------------------------------------------------------------ //
// SIS connector dashboard contracts
// ------------------------------------------------------------------ //

export type SisConnectorId =
  | 'onerooster'
  | 'google-classroom'
  | 'microsoft-sds'
  | 'clever-classlink'
  | 'lti13';

export type SisConnectionStatus = 'connected' | 'needs-auth' | 'error' | 'syncing';

export interface SisCredentialField {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
}

export interface SisConnector {
  id: SisConnectorId;
  name: string;
  vendor: string;
  description: string;
  status: SisConnectionStatus;
  lastSyncAt: string | null;
  credentialFields: SisCredentialField[];
  credentials: Record<string, string>;
  statusMessage?: string;
}

export interface SyncHistoryEntry {
  id: string;
  connectorId: SisConnectorId;
  connectorName: string;
  timestamp: string;
  message: string;
  added?: number;
  changed?: number;
  removed?: number;
}
