import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/admin', label: '홈', icon: '🏠' },
  { path: '/admin/live', label: '라이브', icon: '🔴' },
  { path: '/admin/orders', label: '주문', icon: '📋' },
  { path: '/admin/products', label: '상품', icon: '🛍️' },
  { path: '/admin/settlement', label: '정산', icon: '💰' },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="bottom-tab-bar"
      style={{
        display: 'flex',
        background: 'white',
        borderTop: '1px solid var(--color-gray-200)',
        height: 60,
        zIndex: 100,
      }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--color-pink)' : 'var(--color-gray-500)',
              fontSize: '0.625rem',
              fontWeight: isActive ? 700 : 400,
              minHeight: 44,
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
