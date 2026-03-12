import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExtractionTable from './ExtractionTable';

describe('ExtractionTable Edge Cases', () => {
  const edgeCaseDocs = [
    {
      id: '1',
      created_at: new Date().toISOString(),
      vendor: null, // Edge case: null text field
      category: null, 
      total_amount: null, // Edge case: null number
      raw_json: {}, // Processed
      file_url: 'test.jpg'
    },
    {
      id: '2',
      created_at: new Date().toISOString(),
      vendor: 'Acme, Inc.', // Edge case: comma in CSV
      category: 'Software "SaaS"', // Edge case: quotes in CSV
      total_amount: 0, // Edge case: falsy zero
      raw_json: null, // Failed
      file_url: 'test2.jpg'
    }
  ];

  it('gracefully renders null amounts and strings', () => {
    render(<ExtractionTable documents={edgeCaseDocs} loading={false} error={null} />);
    
    // Vendor is null should map to Unknown italic tag fallback
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    
    // Category is null maps to Uncategorized badge
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    
    // Null amount maps to em-dash fallback in UI
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('filters documents correctly ignoring null fields without crashing', () => {
    render(<ExtractionTable documents={edgeCaseDocs} loading={false} error={null} />);
    
    const searchInput = screen.getByPlaceholderText(/Search vendor or category/i);
    
    // Search for "Acme", the null row should filter out gracefully
    fireEvent.change(searchInput, { target: { value: 'Acme' } });
    expect(screen.getByText('Acme, Inc.')).toBeInTheDocument();
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();

    // Reset and search for a bogus string to trigger empty state gracefully
    fireEvent.change(searchInput, { target: { value: 'zzzzzz' } });
    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
  });
});
