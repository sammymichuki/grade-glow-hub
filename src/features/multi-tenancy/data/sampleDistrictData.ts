import {
  AcademicYear,
  Campus,
  DEFAULT_TENANT_THEME,
  GradeLevel,
  MemberRole,
  Organization,
  School,
  Section,
  TenantMember,
} from '../types/tenant';

export const TREND_YEAR_LABELS = ['2022', '2023', '2024', '2025', '2026'];

export const DISTRICT_ORGANIZATION: Organization = {
  id: 'org-ke-highlands',
  name: 'Kenya Highlands Learning District',
  slug: 'kenya-highlands',
  platformDomain: 'gradeglow.com',
  contactEmail: 'ict@highlands.ac.ke',
  region: 'National',
  createdAt: '2021-01-11',
  defaultTheme: DEFAULT_TENANT_THEME,
};

interface SchoolSeed {
  id: string;
  name: string;
  region: string;
  subdomain: string;
  motto: string;
  primaryColor: string;
  accentColor: string;
  campuses: Array<{ name: string; address: string; isMain: boolean }>;
  gradeLevels: number[];
  sectionsPerGrade: number;
  enrollment: number;
  teacherCount: number;
  avgScore: number;
  completionRate: number;
  attendanceRate: number;
  revenueKes: number;
  enrollmentHistory: number[];
  scoreHistory: number[];
}

const SCHOOL_SEEDS: SchoolSeed[] = [
  {
    id: 'sch-highland',
    name: 'Highland Academy Nairobi',
    region: 'Nairobi',
    subdomain: 'highland',
    motto: 'Excellence Above the Clouds',
    primaryColor: '#4f46e5',
    accentColor: '#f59e0b',
    campuses: [
      { name: 'Karen North Campus', address: 'Off Bogani East Road, Karen, Nairobi', isMain: true },
      { name: 'Karen South Annex', address: 'Marula Lane, Nairobi', isMain: false },
    ],
    gradeLevels: [4, 5, 6, 7, 8],
    sectionsPerGrade: 2,
    enrollment: 1842,
    teacherCount: 86,
    avgScore: 78.4,
    completionRate: 91.2,
    attendanceRate: 94.1,
    revenueKes: 148_500_000,
    enrollmentHistory: [1420, 1535, 1648, 1744, 1842],
    scoreHistory: [71.2, 73.5, 75.1, 77.0, 78.4],
  },
  {
    id: 'sch-stmarys',
    name: "St. Mary's Mombasa Girls",
    region: 'Coast',
    subdomain: 'stmarys',
    motto: 'Faith, Discipline, Scholarship',
    primaryColor: '#be123c',
    accentColor: '#0ea5e9',
    campuses: [
      { name: 'Nyali Main Campus', address: 'Links Road, Nyali, Mombasa', isMain: true },
      { name: 'Likoni Annex', address: 'Mtongwe Road, Likoni, Mombasa', isMain: false },
    ],
    gradeLevels: [4, 5, 6, 7, 8],
    sectionsPerGrade: 2,
    enrollment: 1326,
    teacherCount: 64,
    avgScore: 74.9,
    completionRate: 88.7,
    attendanceRate: 92.6,
    revenueKes: 96_200_000,
    enrollmentHistory: [1105, 1168, 1224, 1279, 1326],
    scoreHistory: [68.9, 70.4, 72.2, 73.6, 74.9],
  },
  {
    id: 'sch-lakeview',
    name: 'Lakeview International Kisumu',
    region: 'Nyanza',
    subdomain: 'lakeview',
    motto: 'Learning Without Borders',
    primaryColor: '#0f766e',
    accentColor: '#f97316',
    campuses: [
      { name: 'Milimani Campus', address: 'Milimani Estate, Kisumu', isMain: true },
    ],
    gradeLevels: [4, 5, 6, 7, 8],
    sectionsPerGrade: 2,
    enrollment: 984,
    teacherCount: 51,
    avgScore: 72.6,
    completionRate: 86.4,
    attendanceRate: 90.8,
    revenueKes: 71_400_000,
    enrollmentHistory: [742, 806, 871, 928, 984],
    scoreHistory: [66.1, 68.0, 69.7, 71.3, 72.6],
  },
  {
    id: 'sch-nakuruhills',
    name: 'Nakuru Hills Boys High',
    region: 'Rift Valley',
    subdomain: 'nakuruhills',
    motto: 'Strength Through Knowledge',
    primaryColor: '#1d4ed8',
    accentColor: '#eab308',
    campuses: [
      { name: 'Pipeline Main Campus', address: 'Pipeline Road, Nakuru', isMain: true },
      { name: 'Section 58 Annex', address: 'Section 58, Nakuru', isMain: false },
    ],
    gradeLevels: [4, 5, 6, 7, 8],
    sectionsPerGrade: 2,
    enrollment: 1574,
    teacherCount: 72,
    avgScore: 76.8,
    completionRate: 90.1,
    attendanceRate: 93.5,
    revenueKes: 118_900_000,
    enrollmentHistory: [1288, 1356, 1432, 1504, 1574],
    scoreHistory: [70.4, 72.1, 73.9, 75.4, 76.8],
  },
  {
    id: 'sch-acaciagrove',
    name: 'Acacia Grove Montessori',
    region: 'Central',
    subdomain: 'acaciagrove',
    motto: 'Follow the Child, Grow the Grove',
    primaryColor: '#15803d',
    accentColor: '#a855f7',
    campuses: [
      { name: 'Ruiru Campus', address: 'Garden Estate Lane, Ruiru', isMain: true },
    ],
    gradeLevels: [4, 5, 6, 7, 8],
    sectionsPerGrade: 2,
    enrollment: 642,
    teacherCount: 38,
    avgScore: 81.3,
    completionRate: 94.8,
    attendanceRate: 96.2,
    revenueKes: 58_600_000,
    enrollmentHistory: [468, 512, 556, 601, 642],
    scoreHistory: [75.0, 76.8, 78.4, 80.1, 81.3],
  },
  {
    id: 'sch-karibocoast',
    name: 'Karibu Coast Academy',
    region: 'Coast',
    subdomain: 'karibocoast',
    motto: 'Every Coastline Child Counts',
    primaryColor: '#0369a1',
    accentColor: '#facc15',
    campuses: [
      { name: 'Diani Campus', address: 'Diani Beach Road, Ukunda', isMain: true },
      { name: 'Msambweni Annex', address: 'Msambweni Town', isMain: false },
    ],
    gradeLevels: [4, 5, 6, 7, 8],
    sectionsPerGrade: 2,
    enrollment: 876,
    teacherCount: 44,
    avgScore: 69.7,
    completionRate: 82.5,
    attendanceRate: 88.4,
    revenueKes: 54_300_000,
    enrollmentHistory: [704, 748, 792, 836, 876],
    scoreHistory: [63.2, 65.0, 66.8, 68.3, 69.7],
  },
  {
    id: 'sch-mountkenya',
    name: 'Mount Kenya STEM School',
    region: 'Central',
    subdomain: 'mountkenya',
    motto: 'Engineer Tomorrow Today',
    primaryColor: '#7c3aed',
    accentColor: '#22d3ee',
    campuses: [
      { name: 'Chogoria Campus', address: 'Chogoria Town, Tharaka-Nithi', isMain: true },
      { name: 'Meru Town Campus', address: 'Mwanganju Road, Meru', isMain: false },
    ],
    gradeLevels: [4, 5, 6, 7, 8],
    sectionsPerGrade: 2,
    enrollment: 1148,
    teacherCount: 59,
    avgScore: 80.1,
    completionRate: 93.6,
    attendanceRate: 95.0,
    revenueKes: 92_700_000,
    enrollmentHistory: [842, 916, 988, 1067, 1148],
    scoreHistory: [72.6, 74.8, 76.9, 78.6, 80.1],
  },
  {
    id: 'sch-eldoret',
    name: 'Eldoret Victory Academy',
    region: 'Rift Valley',
    subdomain: 'eldoret',
    motto: 'Run the Race, Win the Course',
    primaryColor: '#b91c1c',
    accentColor: '#14b8a6',
    campuses: [
      { name: 'Elgon View Campus', address: 'Elgon View Estate, Eldoret', isMain: true },
    ],
    gradeLevels: [4, 5, 6, 7, 8],
    sectionsPerGrade: 2,
    enrollment: 1024,
    teacherCount: 48,
    avgScore: 73.2,
    completionRate: 87.9,
    attendanceRate: 91.4,
    revenueKes: 68_900_000,
    enrollmentHistory: [812, 866, 918, 972, 1024],
    scoreHistory: [66.8, 68.5, 70.2, 71.9, 73.2],
  },
  {
    id: 'sch-uhuru',
    name: 'Uhuru Boulevard Primary',
    region: 'Nairobi',
    subdomain: 'uhuru',
    motto: 'Freedom Through Learning',
    primaryColor: '#0891b2',
    accentColor: '#f43f5e',
    campuses: [
      { name: 'Pumwani Campus', address: 'Boulevard Way, Nairobi', isMain: true },
      { name: 'Kasarani Annex', address: 'Riverbank Road, Kasarani', isMain: false },
    ],
    gradeLevels: [4, 5, 6, 7, 8],
    sectionsPerGrade: 2,
    enrollment: 1496,
    teacherCount: 67,
    avgScore: 68.4,
    completionRate: 84.2,
    attendanceRate: 89.7,
    revenueKes: 84_100_000,
    enrollmentHistory: [1244, 1312, 1378, 1442, 1496],
    scoreHistory: [61.9, 63.7, 65.4, 67.1, 68.4],
  },
  {
    id: 'sch-tahmeed',
    name: 'Tahmeed International School',
    region: 'Nairobi',
    subdomain: 'tahmeed',
    motto: 'Character Before Credentials',
    primaryColor: '#4338ca',
    accentColor: '#fb923c',
    campuses: [
      { name: 'Utawala Campus', address: 'Inner Ring Road, Utawala, Nairobi', isMain: true },
      { name: 'Embakasi Annex', address: 'Mombasa Road, Embakasi', isMain: false },
    ],
    gradeLevels: [4, 5, 6, 7, 8],
    sectionsPerGrade: 2,
    enrollment: 1218,
    teacherCount: 57,
    avgScore: 75.6,
    completionRate: 89.4,
    attendanceRate: 92.9,
    revenueKes: 89_400_000,
    enrollmentHistory: [964, 1032, 1096, 1157, 1218],
    scoreHistory: [69.2, 71.0, 72.7, 74.2, 75.6],
  },
];

const FIRST_NAMES = [
  'Amina', 'Brian', 'Cherono', 'David', 'Esther', 'Fahad', 'Grace', 'Hassan',
  'Imani', 'Juma', 'Kagendo', 'Linet', 'Mercy', 'Njoroge', 'Otieno', 'Purity',
  'Quincy', 'Ruth', 'Sifuna', 'Telma', 'Usman', 'Victor', 'Wanjiku', 'Xavier',
  'Yvonne', 'Zawadi', 'Baraka', 'Chebet', 'Dennis', 'Faith',
];

const LAST_NAMES = [
  'Kimani', 'Otieno', 'Wanjiru', 'Mwangi', 'Chebet', 'Ochieng', 'Njoroge', 'Achieng',
  'Kiptoo', 'Wairimu', 'Maina', 'Adhiambo', 'Mutiso', 'Kamau', 'Barasa', 'Nyambura',
  'Omondi', 'Githinji', 'Chelangat', 'Muriithi', 'Wafula', 'Jelagat', 'Ndungu', 'Ouma',
];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

const buildDistrict = (): {
  schools: School[];
  campuses: Campus[];
  academicYears: AcademicYear[];
  gradeLevels: GradeLevel[];
  sections: Section[];
  members: TenantMember[];
} => {
  const schools: School[] = [];
  const campuses: Campus[] = [];
  const academicYears: AcademicYear[] = [];
  const gradeLevels: GradeLevel[] = [];
  const sections: Section[] = [];
  const members: TenantMember[] = [];

  let nameCursor = 0;
  let memberSeq = 0;

  const nextName = (): string => {
    const first = FIRST_NAMES[nameCursor % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(nameCursor / FIRST_NAMES.length) % LAST_NAMES.length];
    nameCursor += 1;
    return `${first} ${last}`;
  };

  const pushMember = (
    tenantId: string,
    role: MemberRole,
    name: string,
    email: string,
    extra: Partial<TenantMember> = {}
  ): TenantMember => {
    memberSeq += 1;
    const member: TenantMember = {
      id: `mem-${memberSeq}`,
      tenantId,
      userId: `usr-${memberSeq}`,
      name,
      email,
      role,
      sectionIds: [],
      joinedAt: '2026-01-05',
      ...extra,
    };
    members.push(member);
    return member;
  };

  for (const seed of SCHOOL_SEEDS) {
    const createdAt = '2021-09-06';
    schools.push({
      id: seed.id,
      organizationId: DISTRICT_ORGANIZATION.id,
      name: seed.name,
      region: seed.region,
      subdomain: seed.subdomain,
      motto: seed.motto,
      theme: {
        primaryColor: seed.primaryColor,
        accentColor: seed.accentColor,
        welcomeMessage: `Karibu ${seed.name} — where every learner glows.`,
      },
      metrics: {
        enrollment: seed.enrollment,
        teacherCount: seed.teacherCount,
        avgScore: seed.avgScore,
        completionRate: seed.completionRate,
        attendanceRate: seed.attendanceRate,
        revenueKes: seed.revenueKes,
        enrollmentHistory: [...seed.enrollmentHistory],
        scoreHistory: [...seed.scoreHistory],
      },
      createdAt,
    });

    const currentYear: AcademicYear = {
      id: `ay-${seed.id}-2026`,
      schoolId: seed.id,
      label: '2026',
      startDate: '2026-01-05',
      endDate: '2026-12-11',
      isCurrent: true,
    };
    academicYears.push(currentYear);

    const schoolCampuses: Campus[] = seed.campuses.map((campusSeed, campusIndex) => {
      const campus: Campus = {
        id: `cmp-${seed.id}-${campusIndex + 1}`,
        schoolId: seed.id,
        name: campusSeed.name,
        address: campusSeed.address,
        isMain: campusSeed.isMain,
      };
      campuses.push(campus);
      return campus;
    });

    const schoolAdminName = nextName();
    pushMember(
      seed.id,
      'school_admin',
      schoolAdminName,
      `${slugify(schoolAdminName)}@${seed.subdomain}.gradeglow.com`,
      { campusId: schoolCampuses[0].id }
    );

    for (let taIndex = 0; taIndex < 2; taIndex += 1) {
      const taName = nextName();
      pushMember(seed.id, 'ta', taName, `${slugify(taName)}@${seed.subdomain}.gradeglow.com`, {
        campusId: schoolCampuses[0].id,
      });
    }

    for (const campus of schoolCampuses) {
      for (const level of seed.gradeLevels) {
        const grade: GradeLevel = {
          id: `grd-${campus.id}-g${level}`,
          campusId: campus.id,
          academicYearId: currentYear.id,
          level,
          name: `Grade ${level}`,
        };
        gradeLevels.push(grade);

        for (let sectionIndex = 0; sectionIndex < seed.sectionsPerGrade; sectionIndex += 1) {
          const sectionName = `${level}${String.fromCharCode(65 + sectionIndex)}`;
          const teacherName = nextName();
          const teacher = pushMember(
            seed.id,
            'teacher',
            teacherName,
            `${slugify(teacherName)}@${seed.subdomain}.gradeglow.com`,
            { campusId: campus.id }
          );

          const section: Section = {
            id: `sec-${grade.id}-${sectionName}`,
            gradeLevelId: grade.id,
            name: sectionName,
            capacity: 40,
            homeroomTeacherId: teacher.id,
          };
          sections.push(section);
          teacher.sectionIds.push(section.id);

          for (let studentIndex = 0; studentIndex < 6; studentIndex += 1) {
            const studentName = nextName();
            const studentSlug = slugify(studentName);
            const student = pushMember(
              seed.id,
              'student',
              studentName,
              `st.${studentSlug}.${sectionName}@students.${seed.subdomain}.gradeglow.com`,
              { campusId: campus.id }
            );
            student.sectionIds.push(section.id);

            const guardianName = nextName();
            pushMember(
              seed.id,
              'parent',
              guardianName,
              `${slugify(guardianName)}.${studentSlug}@guardians.${seed.subdomain}.gradeglow.com`,
              { guardianOfMemberId: student.id }
            );
          }
        }
      }
    }
  }

  return { schools, campuses, academicYears, gradeLevels, sections, members };
};

const district = buildDistrict();

export const SAMPLE_SCHOOLS: School[] = district.schools;
export const SAMPLE_CAMPUSES: Campus[] = district.campuses;
export const SAMPLE_ACADEMIC_YEARS: AcademicYear[] = district.academicYears;
export const SAMPLE_GRADE_LEVELS: GradeLevel[] = district.gradeLevels;
export const SAMPLE_SECTIONS: Section[] = district.sections;
export const SAMPLE_MEMBERS: TenantMember[] = district.members;
