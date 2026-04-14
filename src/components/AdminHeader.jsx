import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function AdminHeader() {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
        <button
          onClick={() => navigate('/admin/settings')}
          style={{
            fontSize: '1.125rem',
            padding: '6px',
            minWidth: 32, minHeight: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          &#9881;
        </button>
        <button
          onClick={logout}
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-gray-500)',
            padding: '6px 4px',
            minHeight: 32,
          }}
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
