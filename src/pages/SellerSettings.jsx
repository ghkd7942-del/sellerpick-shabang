import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuth from '../hooks/useAuth';
import BottomTabBar from '../components/BottomTabBar';
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

const DEFAULT_SETTINGS = {
  shopName: '샤방이',
  description: '',
  profileImage: '',
  bankName: '국민은행',
  accountNumber: '',
  accountHolder: '샤방이',
  phone: '',
  kakaoId: '',
  bandUrl: '',
  youtubeChannel: '',
  instagramId: '',
  shippingFee: 0,
  freeShippingOver: 0,
  courier: 'CJ대한통운',
  notifyKakao: true,
  notifySound: true,
};

export default function SellerSettings() {
  const { user } = useAuth();
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'sellers', 'shabang'));
      if (snap.exists()) setForm({ ...DEFAULT_SETTINGS, ...snap.data() });
      setLoading(false);
    })();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'sellers', 'shabang'), {
        ...form,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || '',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('저장 실패: ' + err.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 56, background: 'white',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>샤방이 관리자</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saved ? 'var(--color-mint)' : 'var(--color-pink)',
            color: 'white', padding: '8px 16px', borderRadius: 8,
            fontSize: '0.8125rem', fontWeight: 700, minHeight: 36,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saved ? '✓ 저장됨' : saving ? '저장 중...' : '저장'}
        </button>
      </header>

      <div style={{
        padding: 16, paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {/* 가게 정보 */}
        <Section title="&#127978; 가게 정보">
          <Field label="가게 이름" value={form.shopName}
            onChange={(v) => handleChange('shopName', v)} />
          <Field label="한줄 소개" value={form.description}
            onChange={(v) => handleChange('description', v)}
            placeholder="예) 공장 직배송 잡화/의류 전문" />
          <Field label="대표 연락처" value={form.phone}
            onChange={(v) => handleChange('phone', v)}
            placeholder="010-0000-0000" inputMode="tel" />
        </Section>

        {/* 입금 계좌 */}
        <Section title="&#127974; 입금 계좌">
          <div>
            <label style={labelStyle}>은행</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['국민은행', '신한은행', '하나은행', '우리은행', '농협', '카카오뱅크', '토스뱅크'].map((bank) => (
                <button key={bank} onClick={() => handleChange('bankName', bank)}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: '1.5px solid',
                    borderColor: form.bankName === bank ? 'var(--color-pink)' : 'var(--color-gray-200)',
                    background: form.bankName === bank ? 'var(--color-pink)' : 'white',
                    color: form.bankName === bank ? 'white' : 'var(--color-gray-700)',
                    fontSize: '0.75rem', fontWeight: 600, minHeight: 36, cursor: 'pointer',
                  }}
                >{bank}</button>
              ))}
            </div>
          </div>
          <Field label="계좌번호" value={form.accountNumber}
            onChange={(v) => handleChange('accountNumber', v)}
            placeholder="000-0000-0000" inputMode="numeric" />
          <Field label="예금주" value={form.accountHolder}
            onChange={(v) => handleChange('accountHolder', v)} />
        </Section>

        {/* SNS / 링크 */}
        <Section title="&#128279; SNS 연동">
          <Field label="밴드 URL" value={form.bandUrl}
            onChange={(v) => handleChange('bandUrl', v)}
            placeholder="https://band.us/band/..." />
          <Field label="유튜브 채널" value={form.youtubeChannel}
            onChange={(v) => handleChange('youtubeChannel', v)}
            placeholder="채널 URL 또는 @핸들" />
          <Field label="인스타그램" value={form.instagramId}
            onChange={(v) => handleChange('instagramId', v)}
            placeholder="@인스타 아이디" />
          <Field label="카카오톡 ID" value={form.kakaoId}
            onChange={(v) => handleChange('kakaoId', v)}
            placeholder="카카오톡 상담 ID" />
        </Section>

        {/* 배송 설정 */}
        <Section title="&#128666; 배송 설정">
          <div>
            <label style={labelStyle}>택배사</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['CJ대한통운', '한진택배', '롯데택배', '로젠택배', '우체국'].map((c) => (
                <button key={c} onClick={() => handleChange('courier', c)}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: '1.5px solid',
                    borderColor: form.courier === c ? 'var(--color-teal)' : 'var(--color-gray-200)',
                    background: form.courier === c ? 'var(--color-teal)' : 'white',
                    color: form.courier === c ? 'white' : 'var(--color-gray-700)',
                    fontSize: '0.75rem', fontWeight: 600, minHeight: 36, cursor: 'pointer',
                  }}
                >{c}</button>
              ))}
            </div>
          </div>
          <Field label="기본 배송비 (원)" value={String(form.shippingFee)}
            onChange={(v) => handleChange('shippingFee', parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)}
            inputMode="numeric" placeholder="0 (무료배송)" />
          <Field label="무료배송 기준 (원 이상)" value={String(form.freeShippingOver)}
            onChange={(v) => handleChange('freeShippingOver', parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)}
            inputMode="numeric" placeholder="0 (항상 무료)" />
        </Section>

        {/* 알림 설정 */}
        <Section title="&#128276; 알림 설정">
          <ToggleRow label="주문 알림음" desc="새 주문 시 알림 소리"
            value={form.notifySound} onChange={(v) => handleChange('notifySound', v)} />
          <ToggleRow label="카카오 알림톡" desc="고객에게 자동 알림 (준비 중)"
            value={form.notifyKakao} onChange={(v) => handleChange('notifyKakao', v)} />
        </Section>

        {/* 계정 정보 */}
        <Section title="&#128100; 계정">
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)' }}>
            로그인: {user?.email || '알 수 없음'}
          </div>
        </Section>
      </div>

      <BottomTabBar />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, inputMode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        style={inputStyle}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
      />
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', cursor: 'pointer', minHeight: 44, width: '100%',
        background: 'none', textAlign: 'left',
      }}
    >
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 1 }}>{desc}</div>
      </div>
      <div style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? 'var(--color-pink)' : 'var(--color-gray-200)',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'white', position: 'absolute', top: 2,
          left: value ? 22 : 2, transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </button>
  );
}
