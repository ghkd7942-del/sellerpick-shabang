export default function AdminHeader() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 56,
        background: 'white',
        borderBottom: '1px solid var(--color-gray-200)',
      }}
    >
      <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
        샤방이 관리자
      </h1>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'var(--color-pink)',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 9999,
        }}
      >
        <span className="live-dot" />
        LIVE
      </span>
    </header>
  );
}
