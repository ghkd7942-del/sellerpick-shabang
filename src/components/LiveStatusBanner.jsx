import { useNavigate, useLocation } from 'react-router-dom';

export default function LiveStatusBanner({ slug, sellerName = '샤방이' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const alreadyOnLive = location.pathname.endsWith('/live');

  const handleClick = () => {
    if (alreadyOnLive) return;
    // 현재 URL 구조(`/s/:slug` 또는 `/shop/:slug`)를 그대로 유지하며 /live 서브페이지로.
    const base = location.pathname.replace(/\/$/, '');
    navigate(`${base}/live`);
  };

  return (
    <button
      onClick={handleClick}
      className="live-status-banner"
      style={{
        width: '100%', padding: '12px 14px', borderRadius: 12,
        background: 'linear-gradient(135deg, #FF1744, #FF4B6E)',
        color: 'white',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 6px 16px rgba(255, 23, 68, 0.3)',
        minHeight: 56, textAlign: 'left',
        cursor: alreadyOnLive ? 'default' : 'pointer',
      }}
    >
      <span className="live-dot-white" />
      <div style={{ flex: 1, lineHeight: 1.3 }}>
        <div style={{ fontSize: '0.9375rem', fontWeight: 800 }}>
          {sellerName} 지금 라이브 중
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
          {alreadyOnLive ? '현재 라이브 화면이에요' : '탭해서 바로 시청하고 주문하세요'}
        </div>
      </div>
      {!alreadyOnLive && (
        <span style={{ fontSize: '1.125rem', opacity: 0.9 }}>&#8250;</span>
      )}
    </button>
  );
}
