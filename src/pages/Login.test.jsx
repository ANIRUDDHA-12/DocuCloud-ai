import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { describe, it, expect, vi } from 'vitest';

// Mock the AuthContext so we don't need a real Supabase connection for UI testing
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ session: null }),
}));

describe('Login Component Edge Cases', () => {
  it('renders the 50/50 split layout containers correctly without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Verify outer container is present and has the flexible boundaries we just patched
    const outerWrapper = container.firstChild;
    expect(outerWrapper).toHaveClass('flex-1', 'flex', 'w-full', 'h-full', 'bg-white');

    // Verify left and right panels exist
    const leftPanel = container.querySelector('.hidden.lg\\:flex.w-1\\/2');
    const rightPanel = container.querySelector('.w-full.lg\\:w-1\\/2');

    expect(leftPanel).toBeInTheDocument();
    expect(rightPanel).toBeInTheDocument();
  });

  it('renders standard auth input fields', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
});
