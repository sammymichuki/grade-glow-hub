import {
  AcademicYear,
  Campus,
  GradeLevel,
  MemberRole,
  School,
  SchoolFilterOptions,
  SchoolHierarchy,
  SchoolSortKey,
  Section,
  SortOrder,
} from '../types/tenant';
import {
  SAMPLE_ACADEMIC_YEARS,
  SAMPLE_CAMPUSES,
  SAMPLE_GRADE_LEVELS,
  SAMPLE_MEMBERS,
  SAMPLE_SCHOOLS,
  SAMPLE_SECTIONS,
  TREND_YEAR_LABELS,
} from '../data/sampleDistrictData';

export interface DistrictKpis {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalCampuses: number;
  avgScore: number;
  completionRate: number;
  attendanceRate: number;
  totalRevenueKes: number;
}

export interface DistrictTrendPoint {
  year: string;
  enrollment: number;
  avgScore: number;
}

export interface SchoolRowDatum {
  school: School;
  enrollment: number;
  avgScore: number;
  completionRate: number;
  attendanceRate: number;
  revenueMkes: number;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

export class DistrictAnalyticsService {
  static getDistrictKpis(schools: School[] = SAMPLE_SCHOOLS): DistrictKpis {
    if (schools.length === 0) {
      return {
        totalSchools: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalCampuses: 0,
        avgScore: 0,
        completionRate: 0,
        attendanceRate: 0,
        totalRevenueKes: 0,
      };
    }

    const totalStudents = schools.reduce((sum, school) => sum + school.metrics.enrollment, 0);
    const totalTeachers = schools.reduce((sum, school) => sum + school.metrics.teacherCount, 0);
    const weighted = (pick: (school: School) => number): number =>
      schools.reduce((sum, school) => sum + pick(school) * school.metrics.enrollment, 0) /
      Math.max(totalStudents, 1);

    return {
      totalSchools: schools.length,
      totalStudents,
      totalTeachers,
      totalCampuses: schools.reduce(
        (sum, school) => sum + SAMPLE_CAMPUSES.filter((c) => c.schoolId === school.id).length,
        0
      ),
      avgScore: round1(weighted((school) => school.metrics.avgScore)),
      completionRate: round1(weighted((school) => school.metrics.completionRate)),
      attendanceRate: round1(weighted((school) => school.metrics.attendanceRate)),
      totalRevenueKes: schools.reduce((sum, school) => sum + school.metrics.revenueKes, 0),
    };
  }

  static listRegions(schools: School[] = SAMPLE_SCHOOLS): string[] {
    return [...new Set(schools.map((school) => school.region))].sort((a, b) => a.localeCompare(b));
  }

  static filterSchools(schools: School[], options: SchoolFilterOptions = {}): School[] {
    let list = [...schools];

    if (options.searchTerm && options.searchTerm.trim().length > 0) {
      const query = options.searchTerm.trim().toLowerCase();
      list = list.filter(
        (school) =>
          school.name.toLowerCase().includes(query) ||
          school.region.toLowerCase().includes(query) ||
          school.subdomain.toLowerCase().includes(query)
      );
    }

    if (options.region && options.region !== 'all') {
      list = list.filter((school) => school.region === options.region);
    }

    if (options.sortBy) {
      const order: SortOrder = options.sortOrder === 'desc' ? 'desc' : 'asc';
      const direction = order === 'desc' ? -1 : 1;
      list.sort((a, b) => {
        switch (options.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name) * direction;
          case 'enrollment':
            return (a.metrics.enrollment - b.metrics.enrollment) * direction;
          case 'avgScore':
            return (a.metrics.avgScore - b.metrics.avgScore) * direction;
          case 'completionRate':
            return (a.metrics.completionRate - b.metrics.completionRate) * direction;
          case 'attendanceRate':
            return (a.metrics.attendanceRate - b.metrics.attendanceRate) * direction;
          case 'revenueKes':
            return (a.metrics.revenueKes - b.metrics.revenueKes) * direction;
          default:
            return 0;
        }
      });
    }

    return list;
  }

  static getDistrictTrend(schools: School[] = SAMPLE_SCHOOLS): DistrictTrendPoint[] {
    const length = Math.min(
      ...schools.map((school) => school.metrics.enrollmentHistory.length),
      TREND_YEAR_LABELS.length
    );
    const points: DistrictTrendPoint[] = [];
    for (let index = 0; index < length; index += 1) {
      const enrollment = schools.reduce(
        (sum, school) => sum + (school.metrics.enrollmentHistory[index] ?? 0),
        0
      );
      const weightedScore =
        schools.reduce(
          (sum, school) =>
            sum + (school.metrics.scoreHistory[index] ?? 0) * school.metrics.enrollment,
          0
        ) / Math.max(enrollment, 1);
      points.push({
        year: TREND_YEAR_LABELS[index],
        enrollment,
        avgScore: round1(weightedScore),
      });
    }
    return points;
  }

  static getSchoolComparison(schools: School[] = SAMPLE_SCHOOLS): SchoolRowDatum[] {
    return schools.map((school) => ({
      school,
      enrollment: school.metrics.enrollment,
      avgScore: school.metrics.avgScore,
      completionRate: school.metrics.completionRate,
      attendanceRate: school.metrics.attendanceRate,
      revenueMkes: Math.round((school.metrics.revenueKes / 1_000_000) * 10) / 10,
    }));
  }

  static getSchoolHierarchy(schoolId: string): SchoolHierarchy | null {
    const school = SAMPLE_SCHOOLS.find((candidate) => candidate.id === schoolId);
    if (!school) return null;

    const academicYear: AcademicYear | null =
      SAMPLE_ACADEMIC_YEARS.find((year) => year.schoolId === schoolId && year.isCurrent) ?? null;

    const campuses: Campus[] = SAMPLE_CAMPUSES.filter((campus) => campus.schoolId === schoolId);
    const memberCounts: Record<MemberRole, number> = {
      district_admin: 0,
      school_admin: 0,
      teacher: 0,
      ta: 0,
      student: 0,
      parent: 0,
    };
    for (const member of SAMPLE_MEMBERS) {
      if (member.tenantId === schoolId) memberCounts[member.role] += 1;
    }

    return {
      school,
      academicYear,
      memberCounts,
      campuses: campuses.map((campus) => {
        const grades: GradeLevel[] = SAMPLE_GRADE_LEVELS.filter(
          (grade) => grade.campusId === campus.id
        );
        return {
          campus,
          grades: grades
            .slice()
            .sort((a, b) => a.level - b.level)
            .map((grade) => ({
              grade,
              sections: SAMPLE_SECTIONS.filter((section) => section.gradeLevelId === grade.id),
            })),
        };
      }),
    };
  }

  static countSections(schoolId: string): number {
    const hierarchy = this.getSchoolHierarchy(schoolId);
    if (!hierarchy) return 0;
    return hierarchy.campuses.reduce(
      (sum, campus) => sum + campus.grades.reduce((g, grade) => g + grade.sections.length, 0),
      0
    );
  }

  static findSections(sections: Section[] = SAMPLE_SECTIONS, gradeLevelId?: string): Section[] {
    if (!gradeLevelId) return [...sections];
    return sections.filter((section) => section.gradeLevelId === gradeLevelId);
  }
}

export const districtAnalyticsService = DistrictAnalyticsService;
