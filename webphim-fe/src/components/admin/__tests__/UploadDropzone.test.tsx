import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadDropzone from '../UploadDropzone';

let mockOnFileSelect: ReturnType<typeof vi.fn<(file: File) => void>>;
let mockOnClear: ReturnType<typeof vi.fn<() => void>>;

beforeEach(() => {
  mockOnFileSelect = vi.fn<(file: File) => void>();
  mockOnClear = vi.fn<() => void>();
});

function renderDropzone(props: Partial<Parameters<typeof UploadDropzone>[0]> = {}) {
  return render(
    <UploadDropzone
      onFileSelect={mockOnFileSelect}
      selectedFile={null}
      onClear={mockOnClear}
      {...props}
    />
  );
}

function createMockFile(name = 'test.mp4', size = 1024 * 1024, type = 'video/mp4'): File {
  const file = new File(['x'.repeat(Math.min(size, 100))], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('UploadDropzone', () => {
  it('renders drop area with instructions', () => {
    renderDropzone();
    expect(screen.getByText(/Drag & drop your video here/)).toBeInTheDocument();
    expect(screen.getByText(/MP4, MOV, AVI, WebM, MKV/)).toBeInTheDocument();
  });

  it('opens file dialog on click', () => {
    renderDropzone();
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByTestId('dropzone'));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('calls onFileSelect when a valid file is selected', () => {
    renderDropzone();
    const input = screen.getByTestId('file-input');
    const file = createMockFile();
    fireEvent.change(input, { target: { files: [file] } });
    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('shows error for invalid file type', () => {
    renderDropzone();
    const input = screen.getByTestId('file-input');
    const file = createMockFile('doc.pdf', 1024, 'application/pdf');
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByTestId('dropzone-error')).toHaveTextContent(
      'File type not allowed'
    );
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('shows error for file exceeding 2GB', () => {
    renderDropzone();
    const input = screen.getByTestId('file-input');
    const file = createMockFile('big.mp4', 3 * 1024 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByTestId('dropzone-error')).toHaveTextContent('File too large');
  });

  it('shows selected file info when file is provided', () => {
    const file = createMockFile('movie.mp4', 500 * 1024 * 1024);
    renderDropzone({ selectedFile: file });
    expect(screen.getByTestId('dropzone-selected')).toBeInTheDocument();
    expect(screen.getByText('movie.mp4')).toBeInTheDocument();
    expect(screen.getByText('500.0 MB')).toBeInTheDocument();
  });

  it('calls onClear when remove button is clicked', () => {
    const file = createMockFile();
    renderDropzone({ selectedFile: file });
    fireEvent.click(screen.getByLabelText('Remove selected file'));
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('hides remove button when disabled', () => {
    const file = createMockFile();
    renderDropzone({ selectedFile: file, disabled: true });
    expect(screen.queryByLabelText('Remove selected file')).not.toBeInTheDocument();
  });

  it('handles drag and drop with valid file', () => {
    renderDropzone();
    const dropzone = screen.getByTestId('dropzone');
    const file = createMockFile();

    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });
    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });
});
