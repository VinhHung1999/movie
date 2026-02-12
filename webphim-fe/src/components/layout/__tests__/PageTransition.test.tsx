import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageTransition from '../PageTransition';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/home'),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid="motion-div" data-initial={JSON.stringify(props.initial)} data-animate={JSON.stringify(props.animate)}>
        {children}
      </div>
    ),
  },
}));

describe('PageTransition', () => {
  it('renders children inside motion.div', () => {
    render(
      <PageTransition>
        <div data-testid="child">Hello</div>
      </PageTransition>
    );

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('passes hidden/enter variants', () => {
    render(
      <PageTransition>
        <p>Content</p>
      </PageTransition>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveAttribute('data-initial', '"hidden"');
    expect(motionDiv).toHaveAttribute('data-animate', '"enter"');
  });
});
