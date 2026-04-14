import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCustomerProfile from '../hooks/useCustomerProfile';
import ShopTabBar from '../components/ShopTabBar';
import '../styles/admin.css';

const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1px solid var(--color-gray-200)', borderRadius: 10,
  fontSize: '0.9375rem', outline: 'none', minHeight: 44,
};
const labelStyle = {
  display: 'block', fontSize: '0.8125rem', fontWeight: 600,
  color: 'var(--color-gray-700)', marginBottom: 6,
};

export default function MyPage() {
  const { sellerSlug } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile, loading, updateProfile } = useCustomerProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="admin-container">
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          padding: '0 16px', height: 56, background: 'white',
          display: 'flex', alignItems: 'center',
          borderBottom: '1px solid var(--color-gray-200)',
        }}>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>마이</h1>
        </header>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>&#128100;</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>로그인이 필요합니다</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)', marginBottom: 20 }}>
            로그인하면 주문내역과 배송 조회를 할 수 있어요
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate(`/shop/${sellerSlug}/login`)}
            style={{ padding: '14px 32px', fontSize: '0.9375rem' }}
          >
            로그인하기
          </button>
        </div>
        <ShopTabBar />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>로딩 중...</div>
      </div>
    );
  }

  const startEdit = () => {
    setForm({ name: profile?.name || '', phone: profile?.phone || '', address: profile?.address || '' });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(form);
    setEditing(false);
    setSaving(false);
  };

  return (
    <div className="admin-container">
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '0 16px', height: 56, background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>마이</h1>
        <button onClick={() => { logout(); navigate(`/shop/${sellerSlug}`); }}
          style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', padding: '6px 8px', minHeight: 32 }}>
          로그아웃
        </button>
      </header>

      <div className="admin-content">
        {/* 프로필 카드 */}
        <div style={{
          background: 'white', borderRadius: 12, padding: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-pink), #FF8C00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '1.25rem', fontWeight: 700,
            }}>
              {(profile?.name || '?')[0]}
            </div>
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                {profile?.name || '이름을 설정해주세요'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                {user.email || ''}
              </div>
            </div>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>이름</label>
                <input style={inputStyle} value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>연락처</label>
                <input style={inputStyle} inputMode="tel" placeholder="010-0000-0000"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>기본 배송지</label>
                <input style={inputStyle} placeholder="주소 입력"
                  value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(false)}
                  style={{
                    flex: 1, padding: 12, borderRadius: 10,
                    border: '1px solid var(--color-gray-200)', background: 'white',
                    fontSize: '0.875rem', fontWeight: 600, minHeight: 44, cursor: 'pointer',
                  }}>
                  취소
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}
                  style={{ flex: 1, padding: 12, borderRadius: 10, fontSize: '0.875rem', minHeight: 44, opacity: saving ? 0.6 : 1 }}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InfoRow label="연락처" value={profile?.phone || '미입력'} />
                <InfoRow label="기본 배송지" value={profile?.address || '미입력'} />
              </div>
              <button onClick={startEdit}
                style={{
                  width: '100%', marginTop: 14, padding: 12, borderRadius: 10,
                  border: '1px solid var(--color-gray-200)', background: 'white',
                  fontSize: '0.875rem', fontWeight: 600, minHeight: 44, cursor: 'pointer',
                  color: 'var(--color-gray-700)',
                }}>
                정보 수정
              </button>
            </>
          )}
        </div>

        {/* 메뉴 */}
        <div style={{
          background: 'white', borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <MenuItem icon="📦" label="주문내역" onClick={() => navigate(`/shop/${sellerSlug}/orders`)} />
          <MenuItem icon="💬" label="1:1 문의" onClick={() => alert('준비 중입니다')} />
          <MenuItem icon="📢" label="공지사항" onClick={() => alert('준비 중입니다')} last />
        </div>
      </div>
      <ShopTabBar />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.8125rem' }}>
      <span style={{ color: 'var(--color-gray-500)' }}>{label}</span>
      <span style={{ color: value === '미입력' ? 'var(--color-gray-300)' : 'var(--color-gray-700)' }}>{value}</span>
    </div>
  );
}

function MenuItem({ icon, label, onClick, last }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '16px 18px', background: 'none', cursor: 'pointer',
      borderBottom: last ? 'none' : '1px solid var(--color-gray-50)',
      fontSize: '0.9375rem', minHeight: 52, textAlign: 'left',
    }}>
      <span>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ color: 'var(--color-gray-300)' }}>&#8250;</span>
    </button>
  );
}
