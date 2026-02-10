import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UploadProgress from '../UploadProgress';

describe('UploadProgress', () => {
  it('renders file name and size', () => {
    render(
      <UploadProgress
        fileName="movie.mp4"
        fileSize={1073741824}
        progress={50}
        isComplete={false}
      />
    );
    expect(screen.getByText('movie.mp4')).toBeInTheDocument();
    expect(screen.getByText('1.00 GB')).toBeInTheDocument();
  });

  it('shows current progress percentage', () => {
    render(
      <UploadProgress
        fileName="movie.mp4"
        fileSize={1024}
        progress={75}
        isComplete={false}
      />
    );
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('75%');
  });

  it('shows "Uploading..." when not complete', () => {
    render(
      <UploadProgress
        fileName="movie.mp4"
        fileSize={1024}
        progress={50}
        isComplete={false}
      />
    );
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('shows "Upload complete" when done', () => {
    render(
      <UploadProgress
        fileName="movie.mp4"
        fileSize={1024}
        progress={100}
        isComplete={true}
      />
    );
    expect(screen.getByText('Upload complete')).toBeInTheDocument();
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('100%');
  });

  it('renders progress bar element', () => {
    render(
      <UploadProgress
        fileName="test.mp4"
        fileSize={2048}
        progress={30}
        isComplete={false}
      />
    );
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });
});
