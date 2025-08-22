import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DragDropUpload from '../DragDropUpload';

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

// Import the mocked message for assertions
import { message } from 'antd';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock URL.createObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
  value: vi.fn(() => 'mocked-url'),
  writable: true,
});

// Mock window.open
Object.defineProperty(global.window, 'open', {
  value: vi.fn(),
  writable: true,
});

describe('DragDropUpload - Comprehensive Tests', () => {
  const createMockFile = (name: string, type: string, size: number = 1024): File => {
    const file = new File(['mock content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders with default props', () => {
      render(<DragDropUpload />);
      expect(screen.getByText('Upload Waste Images')).toBeInTheDocument();
      expect(screen.getByText('Click or drag files to this area to upload')).toBeInTheDocument();
    });

    it('renders for EPR documents', () => {
      render(<DragDropUpload uploadType="epr-documents" />);
      expect(screen.getByText('Upload EPR Documents')).toBeInTheDocument();
    });

    it('shows camera button when enabled', () => {
      render(<DragDropUpload enableCamera={true} />);
      expect(screen.getByText('Capture from Camera')).toBeInTheDocument();
    });

    it('shows bulk upload button when enabled', () => {
      render(<DragDropUpload enableBulkUpload={true} />);
      expect(screen.getByText('Select Multiple Files')).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('validates file types for waste images', async () => {
      const user = userEvent.setup();
      render(<DragDropUpload uploadType="waste-images" />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = createMockFile('document.pdf', 'application/pdf');
      
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [invalidFile],
          writable: false,
        });
        
        fireEvent.change(input);
        
        await waitFor(() => {
          expect(message.error).toHaveBeenCalledWith('You can only upload image files for waste verification!');
        });
      }
    });

    it('accepts valid image files for waste images', async () => {
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      
      render(<DragDropUpload uploadType="waste-images" onFilesChange={onFilesChange} />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = createMockFile('image.jpg', 'image/jpeg');
      
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [validFile],
          writable: false,
        });
        
        fireEvent.change(input);
        
        await waitFor(() => {
          expect(onFilesChange).toHaveBeenCalled();
          expect(message.error).not.toHaveBeenCalled();
        });
      }
    });

    it('validates file size limits', async () => {
      const user = userEvent.setup();
      render(<DragDropUpload maxSize={1} />); // 1MB limit
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createMockFile('large-image.jpg', 'image/jpeg', 2 * 1024 * 1024); // 2MB
      
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [largeFile],
          writable: false,
        });
        
        fireEvent.change(input);
        
        await waitFor(() => {
          expect(message.error).toHaveBeenCalledWith('File must be smaller than 1MB!');
        });
      }
    });

    it('validates maximum file count', async () => {
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      
      render(<DragDropUpload maxFiles={1} onFilesChange={onFilesChange} />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Add first file
      const firstFile = createMockFile('image1.jpg', 'image/jpeg');
      Object.defineProperty(input, 'files', {
        value: [firstFile],
        writable: false,
      });
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(onFilesChange).toHaveBeenCalled();
      });
      
      // Try to add second file
      const secondFile = createMockFile('image2.jpg', 'image/jpeg');
      Object.defineProperty(input, 'files', {
        value: [secondFile],
        writable: false,
      });
      fireEvent.change(input);
      
      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('You can only upload up to 1 files!');
      });
    });
  });

  describe('Camera Functionality', () => {
    it('captures image from camera with GPS', async () => {
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      
      // Mock successful GPS
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
          },
        });
      });

      render(<DragDropUpload enableCamera={true} onFilesChange={onFilesChange} />);
      
      const cameraButton = screen.getByText('Capture from Camera');
      await user.click(cameraButton);
      
      const cameraInput = document.querySelector('input[capture="environment"]') as HTMLInputElement;
      const mockFile = createMockFile('camera-capture.jpg', 'image/jpeg');
      
      if (cameraInput) {
        Object.defineProperty(cameraInput, 'files', {
          value: [mockFile],
          writable: false,
        });
        
        fireEvent.change(cameraInput);
        
        await waitFor(() => {
          expect(onFilesChange).toHaveBeenCalled();
          expect(message.success).toHaveBeenCalledWith('Image captured with GPS location');
        });
      }
    });

    it('captures image from camera without GPS', async () => {
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      
      // Mock GPS failure
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'GPS not available' });
      });

      render(<DragDropUpload enableCamera={true} onFilesChange={onFilesChange} />);
      
      const cameraButton = screen.getByText('Capture from Camera');
      await user.click(cameraButton);
      
      const cameraInput = document.querySelector('input[capture="environment"]') as HTMLInputElement;
      const mockFile = createMockFile('camera-capture.jpg', 'image/jpeg');
      
      if (cameraInput) {
        Object.defineProperty(cameraInput, 'files', {
          value: [mockFile],
          writable: false,
        });
        
        fireEvent.change(cameraInput);
        
        await waitFor(() => {
          expect(onFilesChange).toHaveBeenCalled();
          expect(message.info).toHaveBeenCalledWith('Image captured (GPS not available)');
        });
      }
    });
  });

  describe('Bulk Upload Functionality', () => {
    it('handles bulk file selection', async () => {
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      
      render(<DragDropUpload enableBulkUpload={true} onFilesChange={onFilesChange} />);
      
      const bulkButton = screen.getByText('Select Multiple Files');
      await user.click(bulkButton);
      
      const bulkInput = document.querySelector('input[multiple]') as HTMLInputElement;
      const validFiles = [
        createMockFile('image1.jpg', 'image/jpeg'),
        createMockFile('image2.png', 'image/png'),
      ];
      
      if (bulkInput) {
        Object.defineProperty(bulkInput, 'files', {
          value: validFiles,
          writable: false,
        });
        
        fireEvent.change(bulkInput);
        
        await waitFor(() => {
          expect(onFilesChange).toHaveBeenCalled();
          expect(message.success).toHaveBeenCalledWith('2 files added successfully');
        });
      }
    });

    it('validates files in bulk upload', async () => {
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      
      render(<DragDropUpload enableBulkUpload={true} uploadType="waste-images" onFilesChange={onFilesChange} />);
      
      const bulkButton = screen.getByText('Select Multiple Files');
      await user.click(bulkButton);
      
      const bulkInput = document.querySelector('input[multiple]') as HTMLInputElement;
      const mixedFiles = [
        createMockFile('valid-image.jpg', 'image/jpeg'),
        createMockFile('invalid-doc.pdf', 'application/pdf'),
      ];
      
      if (bulkInput) {
        Object.defineProperty(bulkInput, 'files', {
          value: mixedFiles,
          writable: false,
        });
        
        fireEvent.change(bulkInput);
        
        await waitFor(() => {
          expect(message.error).toHaveBeenCalledWith(
            expect.stringContaining('Some files were rejected')
          );
          expect(message.success).toHaveBeenCalledWith('1 files added successfully');
        });
      }
    });
  });

  describe('Upload Progress and Error Handling', () => {
    it('shows upload progress', async () => {
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      
      render(<DragDropUpload onFilesChange={onFilesChange} />);
      
      // Add a file
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg');
      
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [mockFile],
          writable: false,
        });
        fireEvent.change(input);
        
        await waitFor(() => {
          expect(onFilesChange).toHaveBeenCalled();
        });
        
        // Start upload
        const uploadButton = screen.getByText(/Upload 1 file/);
        await user.click(uploadButton);
        
        // Check that progress is shown
        await waitFor(() => {
          expect(screen.getByText('Uploading files...')).toBeInTheDocument();
        });
      }
    });

    it('handles custom upload handler', async () => {
      const user = userEvent.setup();
      const customUploadHandler = vi.fn().mockResolvedValue([
        {
          uid: 'custom-1',
          name: 'custom-upload.jpg',
          status: 'done' as const,
          response: { url: 'https://custom.com/upload.jpg' }
        }
      ]);
      
      render(<DragDropUpload customUploadHandler={customUploadHandler} />);
      
      // Add a file
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg');
      
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [mockFile],
          writable: false,
        });
        fireEvent.change(input);
        
        // Start upload
        const uploadButton = screen.getByText(/Upload 1 file/);
        await user.click(uploadButton);
        
        await waitFor(() => {
          expect(customUploadHandler).toHaveBeenCalledWith([mockFile]);
          expect(message.success).toHaveBeenCalledWith('Files uploaded successfully!');
        });
      }
    });
  });

  describe('File Management', () => {
    it('allows removing individual files', async () => {
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      
      render(<DragDropUpload onFilesChange={onFilesChange} />);
      
      // Add a file
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg');
      
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [mockFile],
          writable: false,
        });
        fireEvent.change(input);
        
        await waitFor(() => {
          expect(screen.getByText('Selected Files (1/10)')).toBeInTheDocument();
        });
        
        // Find and click remove button
        const removeButton = screen.getByLabelText('delete');
        await user.click(removeButton);
        
        // Should call onFilesChange with empty array
        expect(onFilesChange).toHaveBeenLastCalledWith([]);
      }
    });

    it('allows clearing all files', async () => {
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      
      render(<DragDropUpload onFilesChange={onFilesChange} />);
      
      // Add files
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFiles = [
        createMockFile('image1.jpg', 'image/jpeg'),
        createMockFile('image2.jpg', 'image/jpeg'),
      ];
      
      if (input) {
        Object.defineProperty(input, 'files', {
          value: mockFiles,
          writable: false,
        });
        fireEvent.change(input);
        
        await waitFor(() => {
          expect(screen.getByText('Selected Files (2/10)')).toBeInTheDocument();
        });
        
        // Click clear all
        const clearButton = screen.getByText('Clear All');
        await user.click(clearButton);
        
        expect(onFilesChange).toHaveBeenLastCalledWith([]);
      }
    });

    it('allows previewing files', async () => {
      const user = userEvent.setup();
      
      render(<DragDropUpload />);
      
      // Add a file
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg');
      
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [mockFile],
          writable: false,
        });
        fireEvent.change(input);
        
        await waitFor(() => {
          expect(screen.getByText('Selected Files (1/10)')).toBeInTheDocument();
        });
        
        // Click preview button
        const previewButton = screen.getByLabelText('eye');
        await user.click(previewButton);
        
        expect(window.open).toHaveBeenCalledWith('mocked-url', '_blank');
      }
    });
  });

  describe('File Type Specific Tests', () => {
    it('accepts PDF files for EPR documents', async () => {
      const onFilesChange = vi.fn();
      render(<DragDropUpload uploadType="epr-documents" onFilesChange={onFilesChange} />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const pdfFile = createMockFile('document.pdf', 'application/pdf');
      
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [pdfFile],
          writable: false,
        });
        
        fireEvent.change(input);
        
        await waitFor(() => {
          expect(onFilesChange).toHaveBeenCalled();
          expect(message.error).not.toHaveBeenCalled();
        });
      }
    });

    it('rejects non-image files for waste images', async () => {
      render(<DragDropUpload uploadType="waste-images" />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const textFile = createMockFile('document.txt', 'text/plain');
      
      if (input) {
        Object.defineProperty(input, 'files', {
          value: [textFile],
          writable: false,
        });
        
        fireEvent.change(input);
        
        await waitFor(() => {
          expect(message.error).toHaveBeenCalledWith('You can only upload image files for waste verification!');
        });
      }
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag events', () => {
      render(<DragDropUpload />);
      
      const dropZone = document.querySelector('.ant-upload-drag');
      
      if (dropZone) {
        // Simulate drag enter
        fireEvent.dragEnter(dropZone);
        
        // Simulate drag leave
        fireEvent.dragLeave(dropZone);
        
        // Should not throw errors
        expect(dropZone).toBeInTheDocument();
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<DragDropUpload enableCamera={true} enableBulkUpload={true} />);
      
      // Check for upload area
      expect(document.querySelector('.ant-upload-drag')).toBeInTheDocument();
      
      // Check for camera button
      expect(screen.getByRole('button', { name: /capture from camera/i })).toBeInTheDocument();
      
      // Check for bulk upload button
      expect(screen.getByRole('button', { name: /select multiple files/i })).toBeInTheDocument();
    });
  });
});