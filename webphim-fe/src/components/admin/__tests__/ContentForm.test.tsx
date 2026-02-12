import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SWRConfig } from 'swr';
import ContentForm from '../ContentForm';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/content/new',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { success: true, data: { id: 'new-1' } } }),
    put: vi.fn().mockResolvedValue({ data: { success: true, data: { id: 'c1' } } }),
  },
}));

const mockGenres = [
  { id: 'g1', name: 'Action', slug: 'action' },
  { id: 'g2', name: 'Drama', slug: 'drama' },
];

function renderForm(mode: 'create' | 'edit' = 'create') {
  return render(
    <SWRConfig value={{
      provider: () => new Map(),
      fetcher: (url: string) => {
        if (url === '/genres') return Promise.resolve({ success: true, data: mockGenres });
        return Promise.resolve({ success: true, data: null });
      },
    }}>
      <ContentForm mode={mode} contentId={mode === 'edit' ? 'c1' : undefined} />
    </SWRConfig>,
  );
}

describe('ContentForm', () => {
  it('renders create mode title', () => {
    renderForm('create');
    expect(screen.getByText('Add Content')).toBeInTheDocument();
  });

  it('renders edit mode title', () => {
    renderForm('edit');
    expect(screen.getByText('Edit Content')).toBeInTheDocument();
  });

  it('renders type radio buttons', () => {
    renderForm();
    expect(screen.getByLabelText('Movie')).toBeInTheDocument();
    expect(screen.getByLabelText('Series')).toBeInTheDocument();
  });

  it('renders title and description fields', () => {
    renderForm();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
  });

  it('renders year and maturity rating fields', () => {
    renderForm();
    expect(screen.getByLabelText(/Release Year/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Maturity Rating/)).toBeInTheDocument();
  });

  it('shows duration field for Movie type', () => {
    renderForm();
    expect(screen.getByLabelText(/Duration/)).toBeInTheDocument();
  });

  it('hides duration field for Series type', () => {
    renderForm();
    fireEvent.click(screen.getByLabelText('Series'));
    expect(screen.queryByLabelText(/Duration/)).not.toBeInTheDocument();
  });

  it('renders genre checkboxes', async () => {
    renderForm();
    expect(await screen.findByLabelText('Action')).toBeInTheDocument();
    expect(await screen.findByLabelText('Drama')).toBeInTheDocument();
  });

  it('renders cancel button that navigates back', () => {
    renderForm();
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockPush).toHaveBeenCalledWith('/admin/content');
  });

  it('disables submit when title is empty', () => {
    renderForm();
    const btn = screen.getByText('Create');
    expect(btn).toBeDisabled();
  });
});
