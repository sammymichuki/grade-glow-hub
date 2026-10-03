import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboard } from '../components/AdminDashboard';
import { UserManagementTab } from '../components/UserManagementTab';
import { CourseOversightTab } from '../components/CourseOversightTab';
import { SystemHealthTab } from '../components/SystemHealthTab';
import { PlatformSettingsTab } from '../components/PlatformSettingsTab';
import { AdminService } from '../services/adminService';

beforeEach(() => {
  AdminService.resetToDefault();
});

describe('AdminDashboard', () => {
  it('renders the institutional control center header', () => {
    render(<AdminDashboard />);

    expect(screen.getByText('GradeGlow Institutional Academy Control Center')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Administration')).toBeInTheDocument();
    expect(screen.getByText('RBAC Admin Authority')).toBeInTheDocument();
  });

  it('renders every governance tab trigger', () => {
    render(<AdminDashboard />);

    expect(screen.getByRole('tab', { name: /Overview/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /User Accounts \(14\)/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Course Oversight \(7\)/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /System Health/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Platform Policies/ })).toBeInTheDocument();
  });

  it('surfaces the maintenance mode badge only when maintenance is engaged', () => {
    const { unmount } = render(<AdminDashboard />);
    expect(screen.queryByText('Maintenance Mode')).not.toBeInTheDocument();
    unmount();

    AdminService.updateSettings({ maintenanceMode: true });
    render(<AdminDashboard />);
    expect(screen.getByText('Maintenance Mode')).toBeInTheDocument();
  });

  it('shows platform KPI values on the overview tab', () => {
    render(<AdminDashboard />);

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Curriculum Courses')).toBeInTheDocument();
    expect(screen.getByText('Total Enrollments')).toBeInTheDocument();
    expect(screen.getByText('System Availability')).toBeInTheDocument();
    expect(screen.getByText('1,287')).toBeInTheDocument();
  });

  it('navigates from the overview tab to course oversight', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminDashboard />);

    await user.click(screen.getByRole('button', { name: /Manage All Courses & Subjects/ }));

    expect(screen.getByRole('tab', { name: /Course Oversight/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('Curriculum Catalog & Course Oversight')).toBeInTheDocument();
  });

  it('navigates from the overview tab to system health diagnostics', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminDashboard />);

    await user.click(screen.getByRole('button', { name: /Open Full Diagnostics/ }));

    expect(screen.getByText('Institutional Security & Audit Trail')).toBeInTheDocument();
  });

  it('switches to the user management tab', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminDashboard />);

    await user.click(screen.getByRole('tab', { name: /User Accounts/ }));

    expect(screen.getByText('User Accounts & Access Directory')).toBeInTheDocument();
  });

  it('switches to the platform policies tab', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminDashboard />);

    await user.click(screen.getByRole('tab', { name: /Platform Policies/ }));

    expect(screen.getByText('Institutional Identity & Contact')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Platform Policies/ })).toBeInTheDocument();
  });
});

describe('UserManagementTab', () => {
  const renderTab = () =>
    render(<UserManagementTab users={AdminService.getUsers()} onUsersChange={() => {}} />);

  it('renders role cohort counts derived from the registry', () => {
    renderTab();

    // Several labels also appear as <option> text in the filter selects.
    expect(screen.getAllByText('Students').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Instructors').length).toBeGreaterThan(0);
    expect(screen.getByText('Teaching Assistants')).toBeInTheDocument();
    expect(screen.getByText('System Admins')).toBeInTheDocument();
  });

  it('lists every account in the directory', () => {
    renderTab();

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Dr. Robert Vance')).toBeInTheDocument();
    expect(screen.getByText('Eleanor Vance')).toBeInTheDocument();
  });

  it('filters the directory with the search input', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.type(screen.getByPlaceholderText(/Search by name, email, or department/), 'Amina');

    expect(screen.getByText('Amina Kimani')).toBeInTheDocument();
    expect(screen.queryByText('Marcus Vance')).not.toBeInTheDocument();
  });

  it('shows an empty state when no account matches the search', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.type(screen.getByPlaceholderText(/Search by name, email, or department/), 'zzzz');

    expect(screen.getByText('No accounts matched the search criteria.')).toBeInTheDocument();
  });

  it('filters accounts by role', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.selectOptions(screen.getByLabelText('Filter by Role'), 'ta');

    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Clara Oswald')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('filters accounts by status', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.selectOptions(screen.getByLabelText('Filter by Status'), 'suspended');

    expect(screen.getByText('Tariq Hassan')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('updates an account role through the inline role selector', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.selectOptions(screen.getByLabelText('Change role for Marcus Vance'), 'ta');

    expect(AdminService.getUsers({ searchTerm: 'Marcus Vance' })[0].role).toBe('ta');
  });

  it('toggles an account status when its badge is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    const badge = screen.getAllByText('active').find((el) => el.textContent === 'active');
    expect(badge).toBeDefined();
    await user.click(badge!);

    expect(AdminService.getUsers().some((u) => u.status === 'suspended')).toBe(true);
  });

  it('opens the add user dialog and registers a new account', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.click(screen.getByRole('button', { name: /Add User/ }));
    expect(screen.getByText('Add New Institutional Account')).toBeInTheDocument();

    // fireEvent keeps the long field values to a single change event each.
    fireEvent.change(screen.getByPlaceholderText('e.g. Dr. Jordan Bell'), {
      target: { value: 'Dr. Jordan Bell' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. jordan.bell@institution.edu'), {
      target: { value: 'jordan.bell@institution.edu' },
    });
    await user.click(screen.getByRole('button', { name: /Save User/ }));

    expect(AdminService.getUsers({ searchTerm: 'Jordan Bell' })).toHaveLength(1);
  });

  it('deletes an account after confirmation', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.click(screen.getByRole('button', { name: 'Delete Jane Doe' }));
    expect(screen.getByText('Delete User Account?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Account' }));

    expect(AdminService.getUsers({ searchTerm: 'Jane Doe' })).toHaveLength(0);
  });
});

describe('CourseOversightTab', () => {
  const renderTab = () =>
    render(<CourseOversightTab courses={AdminService.getCourses()} onCoursesChange={() => {}} />);

  it('renders catalog summary counts', () => {
    renderTab();

    expect(screen.getByText('Total Courses')).toBeInTheDocument();
    expect(screen.getAllByText('Published').length).toBeGreaterThan(0);
    expect(screen.getByText('Draft / Pending')).toBeInTheDocument();
    expect(screen.getByText('Active Enrollees')).toBeInTheDocument();
  });

  it('lists courses with their lead instructors', () => {
    renderTab();

    expect(screen.getByText('Mathematics Fundamentals')).toBeInTheDocument();
    // Evelyn Reed is the lead instructor on two catalogued courses.
    expect(screen.getAllByText('Dr. Evelyn Reed')).toHaveLength(2);
    expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
  });

  it('filters the catalog by subject', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.selectOptions(screen.getByLabelText('Filter by Subject'), 'Science');

    expect(screen.getByText('Biology: Cells & Systems')).toBeInTheDocument();
    expect(screen.getByText('Chemistry Basics')).toBeInTheDocument();
    expect(screen.queryByText('World Geography')).not.toBeInTheDocument();
  });

  it('filters the catalog by publication status', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.selectOptions(screen.getByLabelText('Filter by Course Status'), 'archived');

    expect(screen.getByText('Classical Literature & Poetry')).toBeInTheDocument();
    expect(screen.queryByText('World Geography')).not.toBeInTheDocument();
  });

  it('searches the catalog by title', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.type(screen.getByPlaceholderText(/Search course title, subject, or instructor/), 'Biology');

    expect(screen.getByText('Biology: Cells & Systems')).toBeInTheDocument();
    expect(screen.queryByText('Essay Writing Skills')).not.toBeInTheDocument();
  });

  it('shows an empty state when no course matches the filters', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.type(screen.getByPlaceholderText(/Search course title, subject, or instructor/), 'zzzz');

    expect(screen.getByText('No courses match the current filter criteria.')).toBeInTheDocument();
  });

  it('changes a course publication status', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.selectOptions(
      screen.getByLabelText('Change status for World Geography'),
      'archived'
    );

    expect(AdminService.getCourses({ searchTerm: 'World Geography' })[0].status).toBe('archived');
  });

  it('creates a new course from the modal', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.click(screen.getByRole('button', { name: /Create Course/ }));
    fireEvent.change(screen.getByPlaceholderText('e.g. Environmental Science & Ecology'), {
      target: { value: 'Astronomy Basics' },
    });
    await user.click(screen.getByRole('button', { name: /Save Course/ }));

    expect(AdminService.getCourses({ searchTerm: 'Astronomy Basics' })).toHaveLength(1);
  });

  it('deletes a course after confirmation', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.click(screen.getByRole('button', { name: 'Delete World Geography' }));
    expect(screen.getByText('Delete Course Section?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Course' }));

    expect(AdminService.getCourses({ searchTerm: 'World Geography' })).toHaveLength(0);
  });
});

describe('SystemHealthTab', () => {
  const renderTab = () =>
    render(<SystemHealthTab auditLogs={AdminService.getAuditLogs()} onAuditLogsChange={() => {}} />);

  it('renders infrastructure telemetry panels', () => {
    renderTab();

    expect(screen.getByText('Offline Cache')).toBeInTheDocument();
    expect(screen.getByText('Sync Queue')).toBeInTheDocument();
    expect(screen.getByText('Telemetry Events')).toBeInTheDocument();
    expect(screen.getByText('System Uptime')).toBeInTheDocument();
    expect(screen.getByText('99.98%')).toBeInTheDocument();
  });

  it('renders the audit trail with seeded entries', () => {
    renderTab();

    expect(screen.getByText('Institutional Security & Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('SECURITY_ALERT')).toBeInTheDocument();
    expect(screen.getByText('AUTH_FAILED_LIMIT')).toBeInTheDocument();
  });

  it('filters audit logs by category', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.selectOptions(screen.getByLabelText('Filter by Category'), 'security');

    expect(screen.getByText('SECURITY_ALERT')).toBeInTheDocument();
    expect(screen.queryByText('COURSE_PUBLISHED')).not.toBeInTheDocument();
  });

  it('filters audit logs by severity', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.selectOptions(screen.getByLabelText('Filter by Severity'), 'critical');

    expect(screen.getByText('SECURITY_ALERT')).toBeInTheDocument();
    expect(screen.queryByText('DATABASE_SYNC')).not.toBeInTheDocument();
  });

  it('searches the audit trail by actor', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.type(
      screen.getByPlaceholderText(/Search audit trail by actor, action, target, or details/),
      'Zhang'
    );

    expect(screen.getByText('GRADE_CURVE_APPLIED')).toBeInTheDocument();
    expect(screen.queryByText('SECURITY_ALERT')).not.toBeInTheDocument();
  });

  it('exposes maintenance and recovery actions', () => {
    renderTab();

    expect(screen.getByRole('button', { name: /Sync Cloud Queue/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Purge Offline Cache/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear Telemetry/ })).toBeInTheDocument();
  });

  it('opens the detail dialog for a selected audit entry', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    const row = screen.getByText('SECURITY_ALERT').closest('tr');
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Inspect' }));

    expect(screen.getByText('Audit Event Details')).toBeInTheDocument();
    expect(screen.getByText('audit-004')).toBeInTheDocument();
    expect(
      screen.getByText('Account suspended following academic integrity review on exam #2.')
    ).toBeInTheDocument();
  });
});

describe('PlatformSettingsTab', () => {
  const renderTab = () =>
    render(<PlatformSettingsTab settings={AdminService.getSettings()} onSettingsChange={() => {}} />);

  it('renders every platform policy card', () => {
    renderTab();

    expect(screen.getByText('Institutional Identity & Contact')).toBeInTheDocument();
    expect(screen.getByText('Security & Access Policies')).toBeInTheDocument();
    expect(screen.getByText('Assessment & Grading Governance')).toBeInTheDocument();
    expect(screen.getByText('Offline Sync Tuning')).toBeInTheDocument();
  });

  it('reflects the current institutional settings', () => {
    renderTab();

    expect(screen.getByDisplayValue('GradeGlow Institutional Academy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin@gradeglow.edu')).toBeInTheDocument();
  });

  it('reveals the maintenance warning once maintenance mode is toggled on', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    expect(screen.queryByText('Maintenance Mode Is Active')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Toggle Maintenance Mode'));

    expect(screen.getByText('Maintenance Mode Is Active')).toBeInTheDocument();
  });

  it('persists edited settings through the save action', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    const nameInput = screen.getByDisplayValue('GradeGlow Institutional Academy');
    await user.clear(nameInput);
    await user.type(nameInput, 'Nairobi Learning Hub');
    await user.click(screen.getByRole('button', { name: /Save Platform Policies/ }));

    expect(AdminService.getSettings().institutionName).toBe('Nairobi Learning Hub');
  });

  it('persists numeric policy changes', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    const attemptsInput = screen.getByDisplayValue('3');
    await user.clear(attemptsInput);
    await user.type(attemptsInput, '5');
    await user.click(screen.getByRole('button', { name: /Save Platform Policies/ }));

    expect(AdminService.getSettings().maxQuizAttempts).toBe(5);
  });

  it('updates the default platform language', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.selectOptions(screen.getByLabelText('Default Language'), 'sw');
    await user.click(screen.getByRole('button', { name: /Save Platform Policies/ }));

    expect(AdminService.getSettings().defaultLanguage).toBe('sw');
  });

  it('restores factory defaults after confirmation', async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();

    await user.click(screen.getByLabelText('Toggle Maintenance Mode'));
    await user.click(screen.getByRole('button', { name: /Restore Factory Defaults/ }));
    await user.click(screen.getByRole('button', { name: 'Reset All Settings' }));

    expect(AdminService.getSettings().maintenanceMode).toBe(false);
  });
});
