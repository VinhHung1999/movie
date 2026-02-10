import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Accordion from '../Accordion';

const mockItems = [
  { question: 'Question 1', answer: 'Answer 1' },
  { question: 'Question 2', answer: 'Answer 2' },
  { question: 'Question 3', answer: 'Answer 3' },
];

describe('Accordion', () => {
  it('renders all questions', () => {
    render(<Accordion items={mockItems} />);

    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.getByText('Question 3')).toBeInTheDocument();
  });

  it('does not show any answers initially', () => {
    render(<Accordion items={mockItems} />);

    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Answer 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Answer 3')).not.toBeInTheDocument();
  });

  it('opens an item when clicked', async () => {
    const user = userEvent.setup();
    render(<Accordion items={mockItems} />);

    await user.click(screen.getByText('Question 1'));

    expect(screen.getByText('Answer 1')).toBeInTheDocument();
  });

  it('closes an open item when clicked again', async () => {
    const user = userEvent.setup();
    render(<Accordion items={mockItems} />);

    await user.click(screen.getByText('Question 1'));
    expect(screen.getByText('Answer 1')).toBeInTheDocument();

    await user.click(screen.getByText('Question 1'));
    await waitFor(() => {
      expect(screen.queryByText('Answer 1')).not.toBeInTheDocument();
    });
  });

  it('only allows one item open at a time', async () => {
    const user = userEvent.setup();
    render(<Accordion items={mockItems} />);

    await user.click(screen.getByText('Question 1'));
    expect(screen.getByText('Answer 1')).toBeInTheDocument();

    await user.click(screen.getByText('Question 2'));
    await waitFor(() => {
      expect(screen.queryByText('Answer 1')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Answer 2')).toBeInTheDocument();
  });

  it('renders with empty items without crashing', () => {
    render(<Accordion items={[]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
