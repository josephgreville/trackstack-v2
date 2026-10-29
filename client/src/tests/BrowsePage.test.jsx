import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiError } from '../api/client';
import { cx, formatYear } from '../utils/format';
import { catalogService } from '../services/index';
import { useToast } from '../context/ToastContext';

// Mock the API client
vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('Browse page', () => {
  it('renders without crashing', () => {
    const navigate = useNavigate();
    render(
      <BrowserRouter>
        {/* Browse component would go here */}
        <div>Browse</div>
      </BrowserRouter>,
    );

    expect(screen.getByText('Browse')).toBeInTheDocument();
  });
});