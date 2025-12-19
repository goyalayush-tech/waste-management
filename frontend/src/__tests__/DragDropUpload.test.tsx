import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { message } from 'antd';
import DragDropUpload from '../components/Upload/DragDropUpload';

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      error: vi.fn(),
      success: vi.fn(),
      info: vi.fn(),
    },
  };
});

// Mock the eprClient
vi.mock('@/services/api', () => ({
  eprClient: () => ({
    uploadDocument: vi.fn().mockResolvedValue({
      documentId: 'test-doc-123',
      status: 'uploaded',
    }),
  }),
}));

describe('DragDropUpload', () => {
  const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
  const mockPdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the upload component', () => {
      render(<DragDropUpload />);
      expect(screen.getByText(/Drag and drop files here/i)).toBeInTheDocument();
    });

    it('should show camera button when enabled', () => {
      render(<DragDropUpload enableCamera={true} />);
      expect(screen.getByLabelText(/camera/i)).toBeInTheDocument();
    });

    it('should show bulk upload button when enabled', () => {
      render(<DragDropUpload enableBulkUpload={true} />);
      expect(screen.getByLabelText(/folder/i)).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('should accept valid image files for waste-images type', () => {
      render(<DragDropUpload uploadType="waste-images" />);
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      
      // Simulate file selection
      fireEvent.change(input, { target: { files: [mockFile] } });
      
      // Should not show error for valid image
      expect(message.error).not.toHaveBeenCalled();
    });

    it('should reject non-image files for waste-images type', () => {
      render(<DragDropUpload uploadType="waste-images" />);
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      
      fireEvent.change(input, { target: { files: [mockPdfFile] } });
      
      expect(message.error).toHaveBeenCalledWith(
        'You can only upload image files for waste verification!'
      );
    });

    it('should accept both images and PDFs for epr-documents type', () => {
      render(<DragDropUpload uploadType="epr-documents" />);
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      
      // Test image file
      fireEvent.change(input, { target: { files: [mockFile] } });
      expect(message.error).not.toHaveBeenCalled();
      
      // Test PDF file
      fireEvent.change(input, { target: { files: [mockPdfFile] } });
      expect(message.error).not.toHaveBeenCalled();
    });

    it('should validate file size limits', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      render(<DragDropUpload maxSize={10} />);
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      
      fireEvent.change(input, { target: { files: [largeFile] } });
      
      expect(message.error).toHaveBeenCalledWith('File must be smaller than 10MB!');
    });

    it('should validate file count limits', () => {
      const files = Array.from({ length: 11 }, (_, i) => 
        new File(['content'], `file${i}.jpg`, { type: 'image/jpeg' })
      );
      
      render(<DragDropUpload maxFiles={10} />);
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      
      fireEvent.change(input, { target: { files } });
      
      expect(message.error).toHaveBeenCalledWith('You can only upload up to 10 files!');
    });
  });

  describe('Upload Functionality', () => {
    it('should handle file uploads correctly', async () => {
      const onUploadComplete = vi.fn();
      render(
        <DragDropUpload 
          uploadType="epr-documents"
          onUploadComplete={onUploadComplete}
        />
      );
      
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      fireEvent.change(input, { target: { files: [mockFile] } });
      
      // Wait for upload to complete
      await waitFor(() => {
        expect(onUploadComplete).toHaveBeenCalled();
      });
    });

    it('should show upload progress', async () => {
      render(<DragDropUpload uploadType="epr-documents" />);
      
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      fireEvent.change(input, { target: { files: [mockFile] } });
      
      // Should show progress indicator
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should handle upload errors gracefully', async () => {
      const onUploadError = vi.fn();
      render(
        <DragDropUpload 
          uploadType="epr-documents"
          onUploadError={onUploadError}
        />
      );
      
      // Mock a failed upload
      vi.mocked(require('@/services/api').eprClient().uploadDocument)
        .mockRejectedValueOnce(new Error('Upload failed'));
      
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      fireEvent.change(input, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(onUploadError).toHaveBeenCalled();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag enter events', () => {
      render(<DragDropUpload />);
      const dropZone = screen.getByText(/Drag and drop files here/i);
      
      fireEvent.dragEnter(dropZone);
      expect(dropZone).toHaveClass('ant-upload-drag-hover');
    });

    it('should handle drag leave events', () => {
      render(<DragDropUpload />);
      const dropZone = screen.getByText(/Drag and drop files here/i);
      
      fireEvent.dragEnter(dropZone);
      fireEvent.dragLeave(dropZone);
      
      // Should remove hover class
      expect(dropZone).not.toHaveClass('ant-upload-drag-hover');
    });

    it('should handle drop events', () => {
      const onFilesChange = vi.fn();
      render(<DragDropUpload onFilesChange={onFilesChange} />);
      const dropZone = screen.getByText(/Drag and drop files here/i);
      
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [mockFile] },
      });
      
      fireEvent(dropZone, dropEvent);
      expect(onFilesChange).toHaveBeenCalled();
    });
  });

  describe('File Management', () => {
    it('should allow file removal', () => {
      render(<DragDropUpload />);
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      
      // Add a file
      fireEvent.change(input, { target: { files: [mockFile] } });
      
      // Find and click remove button
      const removeButton = screen.getByLabelText(/delete/i);
      fireEvent.click(removeButton);
      
      // File should be removed
      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
    });

    it('should show file preview for images', () => {
      render(<DragDropUpload />);
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      
      fireEvent.change(input, { target: { files: [mockFile] } });
      
      // Should show image preview
      expect(screen.getByAltText('test.jpg')).toBeInTheDocument();
    });

    it('should show file icon for non-image files', () => {
      render(<DragDropUpload uploadType="epr-documents" />);
      const input = screen.getByTestId('upload-input') || screen.getByRole('button');
      
      fireEvent.change(input, { target: { files: [mockPdfFile] } });
      
      // Should show PDF icon
      expect(screen.getByLabelText(/file-pdf/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DragDropUpload />);
      
      expect(screen.getByLabelText(/upload/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<DragDropUpload />);
      const uploadButton = screen.getByRole('button');
      
      uploadButton.focus();
      expect(uploadButton).toHaveFocus();
      
      fireEvent.keyDown(uploadButton, { key: 'Enter' });
      // Should trigger file selection
    });
  });
}); 