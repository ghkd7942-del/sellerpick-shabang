import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useLiveSession from '../hooks/useLiveSession';

export default function ShopTabBar() {
  const { sellerSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useLiveSession();

  const tabs = [
    { path: `/shop/${sellerSlug}`, label: '쇼핑몰', icon: '🛍️' },
    { path: `/shop/${sellerSlug}/live`, label: '라이브몰', icon: '🔴', liveIndicator: !!session?.isActive },
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
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '1.25rem', position: 'relative' }}>
              {tab.icon}
              {tab.liveIndicator && (
                <span style={{
                  position: 'absolute', top: -2, right: -6,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#FF4B6E',
                  boxShadow: '0 0 0 2px white',
                  animation: 'pulse 1.5s infinite',
                }} />
              )}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
