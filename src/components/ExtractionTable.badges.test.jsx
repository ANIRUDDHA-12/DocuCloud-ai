import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExtractionTable from './ExtractionTable';

describe('ExtractionTable Phase 6 UI Badges', () => {
  const mockDocs = [
    {
      id: '1',
      created_at: new Date().toISOString(),
      vendor: 'High Confidence',
      category: 'Software',
      total_amount: 100,
      raw_json: {}, // parsed payload
      confidence_score: 95, // Above 85 threshold
      file_url: 'test1.pdf'
    },
    {
      id: '2',
      created_at: new Date().toISOString(),
      vendor: 'Low Confidence',
      category: 'Hardware',
      total_amount: 50,
      raw_json: {}, // parsed payload
      confidence_score: 60, // Below 85 threshold
      file_url: 'test2.pdf'
    },
    {
      id: '3',
      created_at: new Date().toISOString(),
      vendor: 'Failed Extraction',
      category: 'Unknown',
      total_amount: null,
      raw_json: null, // failed payload
      confidence_score: null,
      file_url: 'test3.pdf'
    }
  ];

  it('renders Processed (Green) for confidence > 85', () => {
    render(<ExtractionTable documents={mockDocs} loading={false} error={null} />);
    expect(screen.getByText('● Processed')).toBeInTheDocument();
  });

  it('renders Needs Review (Orange) for confidence <= 85', () => {
    render(<ExtractionTable documents={mockDocs} loading={false} error={null} />);
    expect(screen.getByText('⚠ Needs Review')).toBeInTheDocument();
  });

  it('renders Failed Payload (Red) when raw_json is explicitly null', () => {
    render(<ExtractionTable documents={mockDocs} loading={false} error={null} />);
    expect(screen.getByText('Failed Payload')).toBeInTheDocument();
  });
});
