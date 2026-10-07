import { z } from 'zod';

export const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const MemberRoleSchema = z.enum([
  'district_admin',
  'school_admin',
  'teacher',
  'ta',
  'student',
  'parent',
]);
export type MemberRole = z.infer<typeof MemberRoleSchema>;

export const TenantPermissionSchema = z.enum([
  'district:read',
  'school:read',
  'branding:write',
  'sis:sync',
  'roster:read',
  'roster:write',
  'grades:read',
  'grades:write',
]);
export type TenantPermission = z.infer<typeof TenantPermissionSchema>;

export const ROLE_PERMISSIONS: Record<MemberRole, TenantPermission[]> = {
  district_admin: [
    'district:read',
    'school:read',
    'branding:write',
    'sis:sync',
    'roster:read',
    'roster:write',
    'grades:read',
    'grades:write',
  ],
  school_admin: [
    'school:read',
    'branding:write',
    'sis:sync',
    'roster:read',
    'roster:write',
    'grades:read',
    'grades:write',
  ],
  teacher: ['school:read', 'roster:read', 'grades:read', 'grades:write'],
  ta: ['school:read', 'roster:read', 'grades:read'],
  student: ['school:read', 'grades:read'],
  parent: ['school:read', 'grades:read'],
};

export const TenantThemeSchema = z.object({
  primaryColor: z.string().regex(HEX_COLOR_REGEX, 'Primary color must be a hex value'),
  accentColor: z.string().regex(HEX_COLOR_REGEX, 'Accent color must be a hex value'),
  welcomeMessage: z.string().max(240, 'Welcome message must be 240 characters or fewer'),
  logoDataUrl: z.string().optional(),
});
export type TenantTheme = z.infer<typeof TenantThemeSchema>;

export const DEFAULT_TENANT_THEME: TenantTheme = {
  primaryColor: '#4f46e5',
  accentColor: '#f59e0b',
  welcomeMessage: 'Welcome to your school portal on Grade Glow Hub.',
};

export const OrganizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  platformDomain: z.string().min(1),
  contactEmail: z.string().email(),
  region: z.string().min(1),
  createdAt: z.string().min(1),
  defaultTheme: TenantThemeSchema,
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const SchoolMetricsSchema = z.object({
  enrollment: z.number().int().nonnegative(),
  teacherCount: z.number().int().nonnegative(),
  avgScore: z.number().min(0).max(100),
  completionRate: z.number().min(0).max(100),
  attendanceRate: z.number().min(0).max(100),
  revenueKes: z.number().nonnegative(),
  enrollmentHistory: z.array(z.number().int().nonnegative()),
  scoreHistory: z.array(z.number().min(0).max(100)),
});
export type SchoolMetrics = z.infer<typeof SchoolMetricsSchema>;

export const SchoolSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  subdomain: z.string().min(1),
  motto: z.string().min(1),
  theme: TenantThemeSchema,
  metrics: SchoolMetricsSchema,
  createdAt: z.string().min(1),
});
export type School = z.infer<typeof SchoolSchema>;

export const CampusSchema = z.object({
  id: z.string().min(1),
  schoolId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  isMain: z.boolean(),
});
export type Campus = z.infer<typeof CampusSchema>;

export const AcademicYearSchema = z.object({
  id: z.string().min(1),
  schoolId: z.string().min(1),
  label: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isCurrent: z.boolean(),
});
export type AcademicYear = z.infer<typeof AcademicYearSchema>;

export const GradeLevelSchema = z.object({
  id: z.string().min(1),
  campusId: z.string().min(1),
  academicYearId: z.string().min(1),
  level: z.number().int().min(1).max(12),
  name: z.string().min(1),
});
export type GradeLevel = z.infer<typeof GradeLevelSchema>;

export const SectionSchema = z.object({
  id: z.string().min(1),
  gradeLevelId: z.string().min(1),
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  homeroomTeacherId: z.string().optional(),
});
export type Section = z.infer<typeof SectionSchema>;

export const TenantMemberSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: MemberRoleSchema,
  campusId: z.string().optional(),
  sectionIds: z.array(z.string()),
  guardianOfMemberId: z.string().optional(),
  joinedAt: z.string().min(1),
});
export type TenantMember = z.infer<typeof TenantMemberSchema>;

export const TenantMembershipSchema = z.object({
  memberId: z.string().min(1),
  tenantId: z.string().min(1),
  role: MemberRoleSchema,
});
export type TenantMembership = z.infer<typeof TenantMembershipSchema>;

export const TenantContextSchema = z.object({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  subdomain: z.string(),
  hostname: z.string(),
  registrableDomain: z.string(),
  theme: TenantThemeSchema,
  activeAcademicYearId: z.string().nullable(),
  membership: TenantMembershipSchema.nullable(),
  resolvedAt: z.string(),
});
export type TenantContext = z.infer<typeof TenantContextSchema>;

export const TenantRegistryEntrySchema = z.object({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  subdomain: z.string().min(1),
  displayName: z.string().min(1),
  theme: TenantThemeSchema,
});
export type TenantRegistryEntry = z.infer<typeof TenantRegistryEntrySchema>;

export interface SchoolHierarchy {
  school: School;
  academicYear: AcademicYear | null;
  campuses: Array<{
    campus: Campus;
    grades: Array<{
      grade: GradeLevel;
      sections: Section[];
    }>;
  }>;
  memberCounts: Record<MemberRole, number>;
}

export type SchoolSortKey =
  | 'name'
  | 'enrollment'
  | 'avgScore'
  | 'completionRate'
  | 'attendanceRate'
  | 'revenueKes';

export type SortOrder = 'asc' | 'desc';

export interface SchoolFilterOptions {
  searchTerm?: string;
  region?: string;
  sortBy?: SchoolSortKey;
  sortOrder?: SortOrder;
}
