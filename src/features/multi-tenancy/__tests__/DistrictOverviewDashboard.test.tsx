import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DistrictOverviewDashboard } from '../components/DistrictOverviewDashboard';
import { SAMPLE_SCHOOLS } from '../data/sampleDistrictData';
import { districtAnalyticsService } from '../services/districtAnalyticsService';

const kpis = () => districtAnalyticsService.getDistrictKpis(SAMPLE_SCHOOLS);

const shownCount = (shown: number): void => {
  expect(
    screen.getByText(new RegExp(`${shown} of ${SAMPLE_SCHOOLS.length} schools shown`), {
      selector: 'p',
    })
  ).toBeInTheDocument();
};

describe('DistrictOverviewDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the district heading and all six KPI cards', () => {
    render(<DistrictOverviewDashboard />);

    expect(
      screen.getByText(`${SAMPLE_SCHOOLS.length} Schools, One Command Center`)
    ).toBeInTheDocument();
    expect(screen.getByText('Aggregated District Telemetry')).toBeInTheDocument();

    const expected = kpis();
    expect(screen.getByText('Total Schools')).toBeInTheDocument();
    expect(screen.getByText(String(expected.totalSchools))).toBeInTheDocument();
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText(expected.totalStudents.toLocaleString('en-US'))).toBeInTheDocument();
    expect(screen.getByText('District Teachers')).toBeInTheDocument();
    expect(screen.getByText(expected.totalTeachers.toLocaleString('en-US'))).toBeInTheDocument();
    expect(screen.getByText('District Avg Score')).toBeInTheDocument();
    expect(screen.getByText(`${expected.avgScore.toFixed(1)}%`)).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Attendance Rate')).toBeInTheDocument();
  });

  it('lists every sample school in the performance register', () => {
    render(<DistrictOverviewDashboard />);

    shownCount(SAMPLE_SCHOOLS.length);
    SAMPLE_SCHOOLS.forEach((school) => {
      expect(screen.getByText(school.name)).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: /View .*$/ })).toHaveLength(
      SAMPLE_SCHOOLS.length
    );
  });

  it('renders both chart panels with their headings', () => {
    render(<DistrictOverviewDashboard />);

    expect(screen.getByText('Per-School Comparison')).toBeInTheDocument();
    expect(screen.getByText('District Trends')).toBeInTheDocument();
    expect(screen.getByTestId('chart-comparison')).toBeInTheDocument();
    expect(screen.getByTestId('chart-trends')).toBeInTheDocument();
  });

  it('narrows the register when a search term is typed', () => {
    render(<DistrictOverviewDashboard />);

    fireEvent.change(screen.getByLabelText('Search schools'), {
      target: { value: 'highland' },
    });

    shownCount(1);
    expect(screen.getByText('Highland Academy Nairobi')).toBeInTheDocument();
    expect(screen.queryByText('Tahmeed International School')).not.toBeInTheDocument();
  });

  it('shows an empty state when no school matches the search', () => {
    render(<DistrictOverviewDashboard />);

    fireEvent.change(screen.getByLabelText('Search schools'), {
      target: { value: 'zzz-no-match' },
    });

    expect(screen.getByText('No schools match your filters.')).toBeInTheDocument();
    shownCount(0);
  });

  it('filters rows by region through the select control', () => {
    render(<DistrictOverviewDashboard />);

    expect(screen.getAllByRole('row')).toHaveLength(11);

    fireEvent.change(screen.getByLabelText('Filter by region'), {
      target: { value: 'Nyanza' },
    });

    shownCount(1);
    expect(screen.getByText('Lakeview International Kisumu')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filter by region'), {
      target: { value: 'all' },
    });
    shownCount(10);
  });

  it('toggles ascending and descending order from the name column header', () => {
    render(<DistrictOverviewDashboard />);

    const nameHeader = screen.getByText('School').closest('th');
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    const sortByName = screen.getByRole('button', { name: 'Sort by school name' });
    fireEvent.click(sortByName);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    const firstDataRow = screen.getAllByRole('row')[1];
    expect(within(firstDataRow).getByText('Acacia Grove Montessori')).toBeInTheDocument();

    fireEvent.click(sortByName);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

    const enrollmentHeader = screen.getByText('Enrollment').closest('th');
    expect(enrollmentHeader).toHaveAttribute('aria-sort', 'none');
    fireEvent.click(screen.getByRole('button', { name: 'Sort by enrollment' }));
    expect(enrollmentHeader).toHaveAttribute('aria-sort', 'descending');
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  });

  it('drills down into a school hierarchy and closes it again', () => {
    render(<DistrictOverviewDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'View Highland Academy Nairobi' }));

    const drilldown = screen.getByTestId('school-drilldown');
    expect(within(drilldown).getByText('Highland Academy Nairobi')).toBeInTheDocument();
    expect(within(drilldown).getByText('highland.gradeglow.com')).toBeInTheDocument();
    expect(within(drilldown).getByText('Students')).toBeInTheDocument();
    expect(within(drilldown).getByText('School Admins')).toBeInTheDocument();
    expect(within(drilldown).getAllByText(/campus/i).length).toBeGreaterThan(0);
    expect(within(drilldown).getAllByText(/grade cohorts/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Close school details' }));
    expect(screen.queryByTestId('school-drilldown')).not.toBeInTheDocument();
  });

  it('switches the drill-down when a second school row is selected', () => {
    render(<DistrictOverviewDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'View Highland Academy Nairobi' }));
    fireEvent.click(screen.getByRole('button', { name: "View St. Mary's Mombasa Girls" }));

    const drilldown = screen.getByTestId('school-drilldown');
    expect(within(drilldown).getByText("St. Mary's Mombasa Girls")).toBeInTheDocument();
    expect(within(drilldown).queryByText('Highland Academy Nairobi')).not.toBeInTheDocument();
  });

  it('shows every region option derived from the sample data', () => {
    render(<DistrictOverviewDashboard />);

    const regionSelect = screen.getByLabelText('Filter by region');
    const options = within(regionSelect).getAllByRole('option');

    expect(options[0]).toHaveTextContent('All regions');
    expect(options).toHaveLength(districtAnalyticsService.listRegions().length + 1);
    districtAnalyticsService.listRegions().forEach((region) => {
      expect(within(regionSelect).getByRole('option', { name: region })).toBeInTheDocument();
    });
  });
});
