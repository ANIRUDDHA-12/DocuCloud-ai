import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Uploader from './Uploader';
import { useAuth } from '../context/AuthContext';

// Mock the Auth Context
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Supabase storage
vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        createSignedUrl: vi.fn(),
      })),
    },
  },
}));

describe('Uploader Edge Cases (Phase 5 PDF Support)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ session: { access_token: 'fake-token' }, user: { id: 'user-123' } });
  });

  it('rejects unsupported file types (e.g., .txt files)', async () => {
    render(<Uploader onSuccess={vi.fn()} />);
    
    // Simulate drop or change event with a text file
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const input = screen.getByTestId('uploader-input'); // We will add data-testid="uploader-input" to the input
    
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Only images.*or PDFs are supported/i)).toBeInTheDocument();
    });
  });

  it('rejects files larger than 10MB', async () => {
    render(<Uploader onSuccess={vi.fn()} />);
    
    // Simulate a 11MB file
    const file = new File([''], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });

    const input = screen.getByTestId('uploader-input');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/less than 10MB/i)).toBeInTheDocument();
    });
  });

  it('accepts application/pdf files and transitions to uploading', async () => {
    render(<Uploader onSuccess={vi.fn()} />);
    
    // Simulate a valid PDF
    const file = new File(['dummy-pdf'], 'invoice.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

    const input = screen.getByTestId('uploader-input');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Uploading securely/i)).toBeInTheDocument();
    });
  });
});
