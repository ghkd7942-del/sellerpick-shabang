export default function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--color-pink)',
        color: 'white',
        fontSize: 24,
        fontWeight: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(255, 75, 110, 0.4)',
        zIndex: 100,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      +
    </button>
  );
}
