import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithKakao } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSocialLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else if (provider === 'kakao') {
        // 카카오 OIDC 설정 전까지 임시 진입
        sessionStorage.setItem('kakao_temp_auth', 'true');
        navigate('/admin');
        setLoading(false);
        return;
      }
      navigate('/admin');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('로그인 실패: ' + (err.message || '다시 시도해주세요'));
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(180deg, #FFF0F3 0%, white 40%)',
    }}>
      {/* 로고 */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>&#128722;</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-pink)' }}>
          셀러픽
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', marginTop: 6 }}>
          공장 라이브 즉석 판매 플랫폼
        </p>
      </div>

      {/* 에러 */}
      {error && (
        <div style={{
          background: '#FEF2F2', color: '#991B1B',
          padding: '10px 14px', borderRadius: 8,
          fontSize: '0.8125rem', marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* 소셜 로그인 버튼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 카카오 로그인 */}
        <button
          onClick={() => handleSocialLogin('kakao')}
          disabled={loading}
          style={{
            width: '100%', padding: '16px', borderRadius: 12,
            background: '#FEE500', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: '1rem', fontWeight: 700, minHeight: 54,
            color: '#191919',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path fill="#191919" d="M10 0C4.477 0 0 3.582 0 8c0 2.87 1.89 5.39 4.727 6.81-.208.774-.754 2.805-.864 3.24-.136.543.199.537.418.39.172-.115 2.74-1.861 3.845-2.616A12.58 12.58 0 0010 16c5.523 0 10-3.582 10-8S15.523 0 10 0z"/>
          </svg>
          카카오로 시작하기
        </button>

        {/* 구글 로그인 */}
        <button
          onClick={() => handleSocialLogin('google')}
          disabled={loading}
          style={{
            width: '100%', padding: '16px', borderRadius: 12,
            border: '1px solid var(--color-gray-200)',
            background: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: '1rem', fontWeight: 600, minHeight: 54,
            color: 'var(--color-gray-700)',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Google로 시작하기
        </button>
      </div>

      <p style={{
        textAlign: 'center', fontSize: '0.6875rem',
        color: 'var(--color-gray-500)', marginTop: 32, lineHeight: 1.6,
      }}>
        로그인하면 이용약관 및 개인정보처리방침에 동의합니다
      </p>
    </div>
  );
}
