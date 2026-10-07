import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhiteLabelCustomizer } from '../components/WhiteLabelCustomizer';
import { SAMPLE_SCHOOLS } from '../data/sampleDistrictData';
import { TenantContextService, tenantContextService } from '../services/tenantContextService';

const firstSchool = SAMPLE_SCHOOLS[0];

const changeColor = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

describe('WhiteLabelCustomizer', () => {
  beforeEach(() => {
    localStorage.clear();
    TenantContextService.resetAll();
    document.documentElement.removeAttribute('style');
  });

  it('renders the studio heading, school picker, and preview-mode badge', () => {
    render(<WhiteLabelCustomizer />);

    expect(screen.getByText('Brand This School Tenant')).toBeInTheDocument();
    expect(screen.getByText('White-Label Studio')).toBeInTheDocument();
    expect(screen.getByText('Preview mode: no session role bound')).toBeInTheDocument();
    expect(
      screen.getAllByText(`${firstSchool.subdomain}.gradeglow.com`)
    ).toHaveLength(2);

    const picker = screen.getByLabelText('Select school');
    expect(picker).toHaveValue(firstSchool.id);
    expect(screen.getAllByRole('option')).toHaveLength(SAMPLE_SCHOOLS.length);
  });

  it('live-applies primary and accent colors to the preview and document root', () => {
    render(<WhiteLabelCustomizer />);

    changeColor('Primary brand color', '#123456');
    changeColor('Accent brand color', '#654321');

    expect(screen.getAllByText('#123456').length).toBeGreaterThan(0);
    expect(screen.getByTestId('css-var-list')).toHaveTextContent('--tenant-primary: #123456');
    expect(screen.getByTestId('css-var-list')).toHaveTextContent('--tenant-accent: #654321');
    expect(document.documentElement.style.getPropertyValue('--tenant-primary')).toBe('#123456');
    expect(document.documentElement.style.getPropertyValue('--tenant-accent')).toBe('#654321');
  });

  it('updates the welcome message copy and its character counter', () => {
    render(<WhiteLabelCustomizer />);

    fireEvent.change(screen.getByLabelText('Welcome message'), {
      target: { value: 'Karibu Highland!' },
    });

    expect(screen.getByTestId('welcome-message')).toHaveTextContent('Karibu Highland!');
    expect(screen.getByText('16/240')).toBeInTheDocument();
  });

  it('reports availability for a fresh vanity subdomain', () => {
    render(<WhiteLabelCustomizer />);

    fireEvent.change(screen.getByLabelText('Vanity subdomain'), {
      target: { value: 'HIGHLANDPREP' },
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Subdomain "highlandprep" is available.'
    );
    expect(screen.getAllByText('highlandprep.gradeglow.com')).toHaveLength(2);
  });

  it('flags a vanity subdomain that is already taken', () => {
    render(<WhiteLabelCustomizer />);

    fireEvent.change(screen.getByLabelText('Vanity subdomain'), {
      target: { value: 'stmarys' },
    });

    expect(screen.getByRole('status')).toHaveTextContent('Subdomain "stmarys" is already taken.');
  });

  it('rejects an invalid vanity subdomain inline', () => {
    render(<WhiteLabelCustomizer />);

    fireEvent.change(screen.getByLabelText('Vanity subdomain'), {
      target: { value: '-bad-' },
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Use letters, numbers, and hyphens (must start and end with a letter or number).'
    );
    expect(screen.getByRole('status')).toHaveClass('text-rose-600');
  });

  it('persists an edited theme and subdomain to the tenant registry on save', () => {
    render(<WhiteLabelCustomizer />);

    changeColor('Primary brand color', '#0f172a');
    fireEvent.change(screen.getByLabelText('Welcome message'), {
      target: { value: 'Nia Tekeleza!' },
    });
    fireEvent.change(screen.getByLabelText('Vanity subdomain'), {
      target: { value: 'highlandprep' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save & Apply/i }));

    const saved = tenantContextService.resolveTheme(firstSchool.id);
    expect(saved.primaryColor).toBe('#0f172a');
    expect(saved.welcomeMessage).toBe('Nia Tekeleza!');
    expect(tenantContextService.getRegistryEntry(firstSchool.id)?.subdomain).toBe(
      'highlandprep'
    );
    expect(screen.getByText(/^Saved /)).toBeInTheDocument();
    expect(
      tenantContextService.isSubdomainAvailable('highland', firstSchool.id)
    ).toBe(true);
  });

  it('does not persist anything when the chosen subdomain is taken', () => {
    render(<WhiteLabelCustomizer />);

    const before = tenantContextService.resolveTheme(firstSchool.id);
    changeColor('Primary brand color', '#111111');
    fireEvent.change(screen.getByLabelText('Vanity subdomain'), {
      target: { value: 'stmarys' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save & Apply/i }));

    expect(tenantContextService.resolveTheme(firstSchool.id)).toEqual(before);
    expect(tenantContextService.getRegistryEntry(firstSchool.id)?.subdomain).toBe(
      firstSchool.subdomain
    );
    expect(screen.queryByText(/^Saved /)).not.toBeInTheDocument();
  });

  it('resets branding back to the school sample defaults', () => {
    render(<WhiteLabelCustomizer />);

    changeColor('Primary brand color', '#ff0000');
    fireEvent.change(screen.getByLabelText('Welcome message'), {
      target: { value: 'Temporary copy' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reset to Default/i }));

    expect(screen.getByTestId('welcome-message')).toHaveTextContent(
      firstSchool.theme.welcomeMessage
    );
    expect(tenantContextService.resolveTheme(firstSchool.id)).toEqual(firstSchool.theme);
    expect(document.documentElement.style.getPropertyValue('--tenant-primary')).toBe(
      firstSchool.theme.primaryColor
    );
    expect(screen.getByLabelText('Primary brand color')).toHaveValue(
      firstSchool.theme.primaryColor
    );
  });

  it('blocks saving when the bound role lacks branding rights', () => {
    TenantContextService.setMembershipRole(firstSchool.id, 'teacher', 'mem-1');
    render(<WhiteLabelCustomizer />);

    expect(screen.getByText('Role teacher: branding rights required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save & Apply/i })).toBeDisabled();
  });

  it('permits saving for a role with branding rights', () => {
    TenantContextService.setMembershipRole(firstSchool.id, 'school_admin', 'mem-2');
    render(<WhiteLabelCustomizer />);

    expect(screen.getByText('Role school_admin: branding rights granted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save & Apply/i })).toBeEnabled();
  });

  it('switches the draft theme and subdomain when another school is selected', () => {
    const secondSchool = SAMPLE_SCHOOLS[1];
    render(<WhiteLabelCustomizer />);

    fireEvent.change(screen.getByLabelText('Select school'), {
      target: { value: secondSchool.id },
    });

    expect(screen.getAllByText(`${secondSchool.subdomain}.gradeglow.com`)).toHaveLength(2);
    expect(screen.getByLabelText('Select school')).toHaveValue(secondSchool.id);
    expect(screen.getByLabelText('Primary brand color')).toHaveValue(secondSchool.theme.primaryColor);
    expect(document.documentElement.style.getPropertyValue('--tenant-primary')).toBe(
      secondSchool.theme.primaryColor
    );
  });

  it('rejects a non-image crest upload with an alert', () => {
    render(<WhiteLabelCustomizer />);

    const file = new File(['plain text'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('School crest / logo'), {
      target: { files: [file] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Crest must be an image file (PNG, SVG, or JPEG).'
    );
    expect(screen.queryAllByAltText('Crest preview')).toHaveLength(0);
  });

  it('rejects a crest larger than 2 MB with an alert', () => {
    render(<WhiteLabelCustomizer />);

    const huge = new File([new ArrayBuffer(3 * 1024 * 1024)], 'huge.png', {
      type: 'image/png',
    });
    fireEvent.change(screen.getByLabelText('School crest / logo'), {
      target: { files: [huge] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Crest image must be smaller than 2 MB.');
  });

  it('previews a valid crest image after reading the file', async () => {
    render(<WhiteLabelCustomizer />);

    const file = new File(['fake-png-bytes'], 'crest.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('School crest / logo'), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getAllByAltText('Crest preview').length).toBe(2);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const previews = screen.getAllByAltText('Crest preview') as HTMLImageElement[];
    previews.forEach((image) => expect(image.src).toContain('data:image/png'));
  });
});
