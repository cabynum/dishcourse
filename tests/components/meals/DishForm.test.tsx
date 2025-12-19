/**
 * DishForm Component Tests
 *
 * Tests for the dish creation/editing form.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DishForm } from '@/components/meals/DishForm';

describe('DishForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders name input', () => {
      render(<DishForm {...defaultProps} />);

      expect(screen.getByLabelText('Dish Name')).toBeInTheDocument();
    });

    it('renders type selector with all options', () => {
      render(<DishForm {...defaultProps} />);

      expect(screen.getByRole('radio', { name: 'Entree' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Side Dish' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Other' })).toBeInTheDocument();
    });

    it('renders submit button with default label', () => {
      render(<DishForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<DishForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('uses custom submit label when provided', () => {
      render(<DishForm {...defaultProps} submitLabel="Update Dish" />);

      expect(screen.getByRole('button', { name: 'Update Dish' })).toBeInTheDocument();
    });

    it('autofocuses the name input', () => {
      render(<DishForm {...defaultProps} />);

      expect(screen.getByLabelText('Dish Name')).toHaveFocus();
    });
  });

  describe('initial values', () => {
    it('starts with empty name by default', () => {
      render(<DishForm {...defaultProps} />);

      expect(screen.getByLabelText('Dish Name')).toHaveValue('');
    });

    it('starts with entree type by default', () => {
      render(<DishForm {...defaultProps} />);

      expect(screen.getByRole('radio', { name: 'Entree' })).toHaveAttribute('aria-checked', 'true');
    });

    it('uses provided initial name', () => {
      render(
        <DishForm
          {...defaultProps}
          initialValues={{ name: 'Grilled Chicken' }}
        />
      );

      expect(screen.getByLabelText('Dish Name')).toHaveValue('Grilled Chicken');
    });

    it('uses provided initial type', () => {
      render(
        <DishForm
          {...defaultProps}
          initialValues={{ type: 'side' }}
        />
      );

      expect(screen.getByRole('radio', { name: 'Side Dish' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('form interaction', () => {
    it('updates name when typing', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} />);

      const input = screen.getByLabelText('Dish Name');
      await user.type(input, 'Pasta');

      expect(input).toHaveValue('Pasta');
    });

    it('updates type when selecting', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} />);

      await user.click(screen.getByRole('radio', { name: 'Other' }));

      expect(screen.getByRole('radio', { name: 'Other' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('validation', () => {
    it('shows error when submitting with empty name', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('shows error when submitting with whitespace-only name', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} />);

      await user.type(screen.getByLabelText('Dish Name'), '   ');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('shows error on blur if name is empty', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} />);

      const input = screen.getByLabelText('Dish Name');
      await user.click(input);
      await user.tab(); // Blur the input

      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('clears error when valid name is entered', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} />);

      // Trigger error
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText('Name is required')).toBeInTheDocument();

      // Enter valid name
      await user.type(screen.getByLabelText('Dish Name'), 'Pasta');

      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });

    it('shows error for name over 100 characters', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} />);

      const longName = 'a'.repeat(101);
      await user.type(screen.getByLabelText('Dish Name'), longName);
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(screen.getByText('Name must be 100 characters or less')).toBeInTheDocument();
    });

    it('does not call onSubmit when validation fails', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} onSubmit={handleSubmit} />);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('shows error for duplicate dish name', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} existingNames={['Tacos', 'Pizza']} />);

      await user.type(screen.getByLabelText('Dish Name'), 'Tacos');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(screen.getByText('You already have a dish called "Tacos"')).toBeInTheDocument();
    });

    it('detects duplicates case-insensitively', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} existingNames={['Tacos']} />);

      await user.type(screen.getByLabelText('Dish Name'), 'TACOS');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(screen.getByText('You already have a dish called "TACOS"')).toBeInTheDocument();
    });

    it('does not call onSubmit when duplicate is detected', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} onSubmit={handleSubmit} existingNames={['Tacos']} />);

      await user.type(screen.getByLabelText('Dish Name'), 'Tacos');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('clears duplicate error when name changes to unique value', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} existingNames={['Tacos']} />);

      // Trigger duplicate error
      await user.type(screen.getByLabelText('Dish Name'), 'Tacos');
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText('You already have a dish called "Tacos"')).toBeInTheDocument();

      // Change to unique name
      await user.clear(screen.getByLabelText('Dish Name'));
      await user.type(screen.getByLabelText('Dish Name'), 'Burritos');

      expect(screen.queryByText(/You already have a dish/)).not.toBeInTheDocument();
    });

    it('allows submission when existingNames is empty', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} onSubmit={handleSubmit} existingNames={[]} />);

      await user.type(screen.getByLabelText('Dish Name'), 'Tacos');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(handleSubmit).toHaveBeenCalledWith({ name: 'Tacos', type: 'entree' });
    });
  });

  describe('submission', () => {
    it('calls onSubmit with trimmed name and type', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} onSubmit={handleSubmit} />);

      await user.type(screen.getByLabelText('Dish Name'), '  Pasta  ');
      await user.click(screen.getByRole('radio', { name: 'Side Dish' }));
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'Pasta',
        type: 'side',
      });
    });

    it('calls onSubmit with default type if not changed', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} onSubmit={handleSubmit} />);

      await user.type(screen.getByLabelText('Dish Name'), 'Chicken');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'Chicken',
        type: 'entree',
      });
    });
  });

  describe('cancel', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const handleCancel = vi.fn();
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} onCancel={handleCancel} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit when cancel is clicked', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} onSubmit={handleSubmit} />);

      await user.type(screen.getByLabelText('Dish Name'), 'Pasta');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('submitting state', () => {
    it('shows loading state on submit button when isSubmitting', () => {
      render(<DishForm {...defaultProps} isSubmitting />);

      const submitButton = screen.getByRole('button', { name: /Save/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });

    it('disables cancel button when isSubmitting', () => {
      render(<DishForm {...defaultProps} isSubmitting />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('disables type selector when isSubmitting', () => {
      render(<DishForm {...defaultProps} isSubmitting />);

      expect(screen.getByRole('radio', { name: 'Entree' })).toBeDisabled();
      expect(screen.getByRole('radio', { name: 'Side Dish' })).toBeDisabled();
      expect(screen.getByRole('radio', { name: 'Other' })).toBeDisabled();
    });
  });

  describe('form element', () => {
    it('prevents default form submission', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();

      render(<DishForm {...defaultProps} onSubmit={handleSubmit} />);

      await user.type(screen.getByLabelText('Dish Name'), 'Pasta');
      await user.keyboard('{Enter}');

      // onSubmit should be called, meaning we handled the form submission
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('shows error with role="alert"', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    });

    it('links error to input via aria-describedby', async () => {
      const user = userEvent.setup();
      render(<DishForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: 'Save' }));

      const input = screen.getByLabelText('Dish Name');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
    });
  });
});

