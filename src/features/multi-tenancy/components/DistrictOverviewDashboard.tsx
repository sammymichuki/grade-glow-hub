import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Building2,
  CalendarCheck2,
  GraduationCap,
  Search,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { SchoolSortKey, SortOrder } from '../types/tenant';
import { SAMPLE_SCHOOLS } from '../data/sampleDistrictData';
import { districtAnalyticsService } from '../services/districtAnalyticsService';
import { Badge } from '@/components/ui/badge';

interface KpiCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}

const SORT_LABELS: Record<SchoolSortKey, string> = {
  name: 'school name',
  enrollment: 'enrollment',
  avgScore: 'average score',
  completionRate: 'completion rate',
  attendanceRate: 'attendance rate',
  revenueKes: 'revenue',
};

export const DistrictOverviewDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [region, setRegion] = useState('all');
  const [sortKey, setSortKey] = useState<SchoolSortKey>('enrollment');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  const regions = useMemo(() => districtAnalyticsService.listRegions(), []);

  const filteredSchools = useMemo(
    () =>
      districtAnalyticsService.filterSchools(SAMPLE_SCHOOLS, {
        searchTerm,
        region,
        sortBy: sortKey,
        sortOrder,
      }),
    [searchTerm, region, sortKey, sortOrder]
  );

  const kpis = useMemo(() => districtAnalyticsService.getDistrictKpis(filteredSchools), [filteredSchools]);
  const trend = useMemo(() => districtAnalyticsService.getDistrictTrend(filteredSchools), [filteredSchools]);
  const comparison = useMemo(
    () => districtAnalyticsService.getSchoolComparison(filteredSchools),
    [filteredSchools]
  );
  const hierarchy = useMemo(
    () => (selectedSchoolId ? districtAnalyticsService.getSchoolHierarchy(selectedSchoolId) : null),
    [selectedSchoolId]
  );

  const cards: KpiCard[] = [
    {
      label: 'Total Schools',
      value: kpis.totalSchools.toLocaleString('en-US'),
      icon: <Building2 className="w-4 h-4" />,
      accent: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'Total Students',
      value: kpis.totalStudents.toLocaleString('en-US'),
      icon: <GraduationCap className="w-4 h-4" />,
      accent: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'District Teachers',
      value: kpis.totalTeachers.toLocaleString('en-US'),
      icon: <Users className="w-4 h-4" />,
      accent: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'District Avg Score',
      value: `${kpis.avgScore.toFixed(1)}%`,
      icon: <TrendingUp className="w-4 h-4" />,
      accent: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Completion Rate',
      value: `${kpis.completionRate.toFixed(1)}%`,
      icon: <CalendarCheck2 className="w-4 h-4" />,
      accent: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Attendance Rate',
      value: `${kpis.attendanceRate.toFixed(1)}%`,
      icon: <CalendarCheck2 className="w-4 h-4" />,
      accent: 'bg-rose-50 text-rose-700',
    },
  ];

  const handleSort = (key: SchoolSortKey): void => {
    if (key === sortKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'name' ? 'asc' : 'desc');
    }
  };

  const sortIndicator = (key: SchoolSortKey): string =>
    sortKey === key ? (sortOrder === 'asc' ? '▲' : '▼') : '';

  const renderSortableHeader = (key: SchoolSortKey, label: string): React.ReactNode => (
    <button
      type="button"
      onClick={() => handleSort(key)}
      className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-indigo-700"
      aria-label={`Sort by ${SORT_LABELS[key]}`}
    >
      {label}
      <span aria-hidden="true" className="text-[9px] text-indigo-600">
        {sortIndicator(key)}
      </span>
    </button>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 px-2 sm:px-0" data-testid="district-overview">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-education-primary">
            Aggregated District Telemetry
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
            {SAMPLE_SCHOOLS.length} Schools, One Command Center
          </h2>
          <p className="text-sm text-gray-500">
            Live enrollment, performance, and attendance roll-ups across every tenant school.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search schools..."
              aria-label="Search schools"
              className="pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white w-44 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            aria-label="Filter by region"
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">All regions</option>
            {regions.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-2"
          >
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold ${card.accent}`}>
              {card.icon}
              <span>{card.label}</span>
            </div>
            <p className="text-xl font-black text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Per-School Comparison</h3>
            <p className="text-xs text-gray-500">Enrollment vs. average score for each visible school.</p>
          </div>
          <div className="h-72" data-testid="chart-comparison">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 8, right: 8, left: -12, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="school.name" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                <YAxis yAxisId="enroll" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="score" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Bar yAxisId="enroll" dataKey="enrollment" name="Enrollment" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="score" dataKey="avgScore" name="Avg Score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">District Trends</h3>
            <p className="text-xs text-gray-500">Enrollment growth and performance trajectory, 2022–2026.</p>
          </div>
          <div className="h-72" data-testid="chart-trends">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="enroll" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="score" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  yAxisId="enroll"
                  type="monotone"
                  dataKey="enrollment"
                  name="Enrollment"
                  stroke="#4f46e5"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="score"
                  type="monotone"
                  dataKey="avgScore"
                  name="Avg Score"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">School Performance Register</h3>
            <p className="text-xs text-gray-500">
              {filteredSchools.length} of {SAMPLE_SCHOOLS.length} schools shown — select a row to drill down.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3" aria-sort={sortKey === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  {renderSortableHeader('name', 'School')}
                </th>
                <th scope="col" className="px-4 py-3" aria-sort={sortKey === 'enrollment' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  {renderSortableHeader('enrollment', 'Enrollment')}
                </th>
                <th scope="col" className="px-4 py-3" aria-sort={sortKey === 'avgScore' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  {renderSortableHeader('avgScore', 'Avg Score')}
                </th>
                <th scope="col" className="px-4 py-3" aria-sort={sortKey === 'completionRate' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  {renderSortableHeader('completionRate', 'Completion')}
                </th>
                <th scope="col" className="px-4 py-3" aria-sort={sortKey === 'attendanceRate' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  {renderSortableHeader('attendanceRate', 'Attendance')}
                </th>
                <th scope="col" className="px-4 py-3" aria-sort={sortKey === 'revenueKes' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  {renderSortableHeader('revenueKes', 'Revenue (KES M)')}
                </th>
                <th scope="col" className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">
                  Drill-down
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSchools.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No schools match your filters.
                  </td>
                </tr>
              )}
              {filteredSchools.map((school) => (
                <tr key={school.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{school.name}</p>
                    <p className="text-[11px] text-gray-500">{school.region}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {school.metrics.enrollment.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">{school.metrics.avgScore.toFixed(1)}%</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{school.metrics.completionRate.toFixed(1)}%</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{school.metrics.attendanceRate.toFixed(1)}%</td>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {(school.metrics.revenueKes / 1_000_000).toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSchoolId(school.id)}
                      aria-label={`View ${school.name}`}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700"
                    >
                      View structure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hierarchy && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm space-y-4" data-testid="school-drilldown">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-gray-900">{hierarchy.school.name}</h3>
                <Badge variant="outline" className="text-[10px]">
                  {hierarchy.school.subdomain}.gradeglow.com
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700">
                  {hierarchy.school.region}
                </Badge>
              </div>
              <p className="text-xs italic text-gray-500">“{hierarchy.school.motto}”</p>
              {hierarchy.academicYear && (
                <p className="text-xs text-gray-500">
                  Active academic year: {hierarchy.academicYear.label} ({hierarchy.academicYear.startDate} →{' '}
                  {hierarchy.academicYear.endDate})
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedSchoolId(null)}
              aria-label="Close school details"
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
            {(
              [
                ['Students', hierarchy.memberCounts.student],
                ['Teachers', hierarchy.memberCounts.teacher],
                ['Teaching Assistants', hierarchy.memberCounts.ta],
                ['Parents', hierarchy.memberCounts.parent],
                ['School Admins', hierarchy.memberCounts.school_admin],
              ] as Array<[string, number]>
            ).map(([label, count]) => (
              <div key={label} className="bg-gray-50 rounded-xl py-2.5 px-2 border border-gray-100">
                <p className="text-lg font-black text-gray-900">{count}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {hierarchy.campuses.map(({ campus, grades }) => (
              <div key={campus.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {campus.name}
                      {campus.isMain && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-700 font-bold">
                          Main campus
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{campus.address}</p>
                  </div>
                  <span className="text-[11px] text-gray-500">{grades.length} grade cohorts</span>
                </div>
                <div className="space-y-2">
                  {grades.map(({ grade, sections }) => (
                    <div key={grade.id} className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                        {grade.name}
                      </span>
                      {sections.map((section) => (
                        <span
                          key={section.id}
                          className="text-[11px] text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg"
                        >
                          {section.name}
                          <span className="text-gray-400"> · cap {section.capacity}</span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
