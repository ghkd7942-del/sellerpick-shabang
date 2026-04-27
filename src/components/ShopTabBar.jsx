import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useLiveSession from '../hooks/useLiveSession';
import useCart from '../hooks/useCart';

export default function ShopTabBar() {
  const { sellerSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useLiveSession();
  const { totalCount } = useCart();

  const isLive = !!session?.isActive;
  // 라이브 위주 플랫폼 — 첫 탭은 항상 라이브몰
  // 라이브 ON: 'LIVE' + 펄스 인디케이터, 라이브 OFF: '라이브'
  const tabs = [
    {
      path: `/shop/${sellerSlug}/live`,
      label: isLive ? 'LIVE' : '라이브',
      icon: '🔴',
      liveIndicator: isLive,
      emphasize: isLive,
    },
    { path: `/shop/${sellerSlug}/cart`, label: '장바구니', icon: '🛒', badge: totalCount },
    { path: `/shop/${sellerSlug}/orders`, label: '주문내역', icon: '📦' },
    { path: `/shop/${sellerSlug}/all`, label: '쇼핑몰', icon: '🛍️' },
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
              background: tab.emphasize && !isActive ? 'rgba(255,75,110,0.06)' : 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--color-pink)' : (tab.emphasize ? 'var(--color-pink)' : 'var(--color-gray-500)'),
              fontSize: '0.5625rem',
              fontWeight: isActive || tab.emphasize ? 700 : 400,
              minHeight: 44,
              position: 'relative',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '1.125rem', position: 'relative' }}>
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
              {tab.badge > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -10,
                  minWidth: 14, height: 14, borderRadius: 7,
                  padding: '0 4px',
                  background: 'var(--color-pink)', color: 'white',
                  fontSize: '0.5625rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 2px white',
                }}>
                  {tab.badge}
                </span>
              )}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
