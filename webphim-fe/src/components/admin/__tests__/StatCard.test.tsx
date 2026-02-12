import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import StatCard from '../StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Users" value={42} icon={Users} color="#3B82F6" />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<StatCard label="Content" value={10} subtitle="5 Movies, 5 Series" icon={Users} color="#22C55E" />);
    expect(screen.getByText('5 Movies, 5 Series')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    const { container } = render(<StatCard label="Views" value="1,000" icon={Users} color="#A855F7" />);
    expect(container.querySelectorAll('p')).toHaveLength(2); // label + value only
  });
});
