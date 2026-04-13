import { useLocation, useNavigate, useParams } from 'react-router-dom';

export default function ShopTabBar() {
  const { sellerSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: `/shop/${sellerSlug}`, label: '쇼핑', icon: '🛍️' },
    { path: `/shop/${sellerSlug}/orders`, label: '주문내역', icon: '📦' },
    { path: `/shop/${sellerSlug}/my`, label: '마이', icon: '👤' },
  ];

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
