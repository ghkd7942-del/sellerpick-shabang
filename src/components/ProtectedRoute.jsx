import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

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

  if (!user && !sessionStorage.getItem('kakao_temp_auth')) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
