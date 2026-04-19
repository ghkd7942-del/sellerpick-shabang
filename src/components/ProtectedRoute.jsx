import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { isAdmin } from '../lib/admin';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', color: 'var(--color-gray-500)',
      }}>
        로딩 중...
      </div>
    );
  }

  // 로그인 안 됨 → 로그인 페이지
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 로그인했지만 관리자가 아님 → 고객 쇼핑몰로
  if (!isAdmin(user)) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: 24, textAlign: 'center', gap: 10,
        background: 'white',
      }}>
        <div style={{ fontSize: '3rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>관리자 전용 페이지</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', lineHeight: 1.6 }}>
          이 페이지는 등록된 관리자만 접근할 수 있어요.<br />
          <span style={{ fontSize: '0.75rem' }}>({user.email})</span>
        </p>
        <Navigate to="/shop/샤방이" replace />
      </div>
    );
  }

  return children;
}
