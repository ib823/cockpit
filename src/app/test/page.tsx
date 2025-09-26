'use client';

export default function TestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000 0%, #111 100%)',
      color: 'white',
      padding: '50px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <h1 style={{
        fontSize: '72px',
        fontWeight: '100',
        letterSpacing: '-2px',
        marginBottom: '20px'
      }}>
        Think Different
      </h1>
      <p style={{
        fontSize: '24px',
        fontWeight: '300',
        color: '#888',
        marginBottom: '40px'
      }}>
        If this looks good, CSS works.
      </p>
      <button style={{
        background: 'white',
        color: 'black',
        padding: '15px 40px',
        borderRadius: '50px',
        border: 'none',
        fontSize: '18px',
        fontWeight: '500',
        cursor: 'pointer'
      }}>
        Test Button
      </button>
    </div>
  );
}
