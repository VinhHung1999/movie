'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: '#141414',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'sans-serif',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '6rem', color: '#E50914', fontWeight: 900, margin: 0 }}>
            Error
          </h1>
          <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>Something went wrong.</p>
          <button
            onClick={reset}
            style={{
              marginTop: '2rem',
              padding: '12px 32px',
              backgroundColor: '#E50914',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
