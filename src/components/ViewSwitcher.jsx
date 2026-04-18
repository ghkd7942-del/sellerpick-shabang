import { useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_SELLER_SLUG = '샤방이';

export default function ViewSwitcher({ slug }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = location.pathname.startsWith('/admin');
  const sellerSlug = slug || DEFAULT_SELLER_SLUG;

  const target = isAdmin ? `/shop/${sellerSlug}` : '/admin';
  const label = isAdmin ? '고객 화면' : '관리자 화면';
  const icon = isAdmin ? '👀' : '⚙️';

  return (
    <button
      onClick={() => navigate(target)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 9999,
        border: '1.5px solid var(--color-pink)',
        background: isAdmin ? 'white' : 'var(--color-pink)',
        color: isAdmin ? 'var(--color-pink)' : 'white',
        fontSize: '0.75rem', fontWeight: 700,
        minHeight: 32, cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      title={`${label}으로 전환`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
