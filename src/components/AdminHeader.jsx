import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ViewSwitcher from './ViewSwitcher';

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
        <ViewSwitcher />
        <button
          onClick={() => navigate('/admin/settings')}
          style={{
            fontSize: '1.125rem',
            padding: '6px',
            minWidth: 32, minHeight: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="설정"
        >
          &#9881;
        </button>
        <button
          onClick={logout}
          style={{
            fontSize: '0.6875rem',
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
