import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DragDropUpload from '../DragDropUpload';

describe('DragDropUpload - Basic Tests', () => {
  it('renders without crashing', () => {
    render(<DragDropUpload />);
    expect(screen.getByText('Upload Waste Images')).toBeInTheDocument();
  });

  it('shows correct title for waste images', () => {
    render(<DragDropUpload uploadType="waste-images" />);
    expect(screen.getByText('Upload Waste Images')).toBeInTheDocument();
  });

  it('shows correct title for EPR documents', () => {
    render(<DragDropUpload uploadType="epr-documents" />);
    expect(screen.getByText('Upload EPR Documents')).toBeInTheDocument();
  });
});