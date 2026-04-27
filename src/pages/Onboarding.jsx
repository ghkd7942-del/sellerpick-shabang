import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCustomerProfile from '../hooks/useCustomerProfile';

const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1px solid var(--color-gray-200)', borderRadius: 10,
  fontSize: '0.9375rem', outline: 'none', minHeight: 44,
};
const labelStyle = {
  display: 'block', fontSize: '0.8125rem', fontWeight: 600,
  color: 'var(--color-gray-700)', marginBottom: 6,
};

export default function Onboarding() {
  const { sellerSlug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useCustomerProfile();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/shop/${sellerSlug}/login`, { replace: true });
    }
  }, [authLoading, user, sellerSlug, navigate]);

  useEffect(() => {
    if (profile) {
      if (profile.phone) {
        navigate(`/shop/${sellerSlug}`, { replace: true });
        return;
      }
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile, sellerSlug, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ phone: phone.trim(), address: address.trim() });
      navigate(`/shop/${sellerSlug}`, { replace: true });
    } catch (err) {
      alert('저장 실패: ' + (err.message || '다시 시도해주세요'));
      setSaving(false);
    }
  };

  const handleSkip = () => navigate(`/shop/${sellerSlug}`, { replace: true });

  if (authLoading || profileLoading || !profile) {
    return (
      <div style={{
        maxWidth: 430, margin: '0 auto', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-gray-500)',
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100vh',
      background: 'linear-gradient(180deg, #FFF0F3 0%, white 40%)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '40px 24px 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>&#128075;</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-pink)' }}>
            환영합니다!
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', marginTop: 8, lineHeight: 1.5 }}>
            주문을 더 빠르게 처리할 수 있도록<br/>
            연락처와 배송지를 알려주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>
              연락처 <span style={{ color: 'var(--color-pink)' }}>*</span>
            </label>
            <input
              style={inputStyle}
              inputMode="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label style={labelStyle}>기본 배송지 (선택)</label>
            <input
              style={inputStyle}
              placeholder="주소를 입력해주세요"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !phone.trim()}
            style={{
              width: '100%', padding: '16px', borderRadius: 12,
              background: 'var(--color-pink)', color: 'white',
              border: 'none', cursor: 'pointer', marginTop: 8,
              fontSize: '1rem', fontWeight: 700, minHeight: 54,
              opacity: (saving || !phone.trim()) ? 0.5 : 1,
            }}
          >
            {saving ? '저장 중...' : '시작하기'}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              marginTop: 4, fontSize: '0.875rem',
              color: 'var(--color-gray-500)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px', minHeight: 44,
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            나중에 입력하기
          </button>
        </form>
      </div>
    </div>
  );
}
