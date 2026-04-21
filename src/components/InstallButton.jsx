import { useEffect, useState } from 'react';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export default function InstallButton({ variant = 'primary' }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [platform] = useState(() => detectPlatform());

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      deferred.prompt();
      const res = await deferred.userChoice;
      if (res?.outcome === 'accepted') {
        setDeferred(null);
        setInstalled(true);
      }
      return;
    }
    // iOS 또는 beforeinstallprompt가 아직 안 뜬 경우 → 수동 안내
    setShowModal(true);
  };

  const primary = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    background: 'linear-gradient(135deg, #FF4B6E, #FF8C00)',
    color: 'white', fontSize: '0.9375rem', fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 4px 12px rgba(255, 75, 110, 0.3)',
    minHeight: 52,
  };
  const ghost = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    background: 'white', color: 'var(--color-pink)',
    border: '1.5px solid var(--color-pink)',
    fontSize: '0.9375rem', fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 48,
  };

  return (
    <>
      <button onClick={handleClick} style={variant === 'ghost' ? ghost : primary}>
        <span style={{ fontSize: '1.125rem' }}>📱</span>
        <span>홈 화면에 앱으로 추가</span>
      </button>
      {showModal && (
        <InstallModal platform={platform} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function InstallModal({ platform, onClose }) {
  const isIOS = platform === 'ios';
  const steps = isIOS
    ? [
        { icon: '⬆️', text: '하단 공유 버튼 탭' },
        { icon: '➕', text: '"홈 화면에 추가" 선택' },
        { icon: '✅', text: '우측 상단 "추가" 탭' },
      ]
    : [
        { icon: '⋮', text: '브라우저 메뉴 (우상단 점 3개) 탭' },
        { icon: '🏠', text: '"홈 화면에 추가" 또는 "앱 설치" 선택' },
        { icon: '✅', text: '"설치" 또는 "추가" 탭' },
      ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430,
          background: 'white',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          animation: 'slide-in-top 0.25s ease-out reverse',
        }}
      >
        <div style={{
          width: 36, height: 4, background: 'var(--color-gray-200)',
          borderRadius: 9999, margin: '0 auto 16px',
        }} />

        <div style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: 4 }}>
          📱 앱으로 설치하기
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)', marginBottom: 18 }}>
          {isIOS
            ? 'Safari에서 아래 단계를 따라주세요'
            : '브라우저 메뉴에서 설치할 수 있어요'}
        </div>

        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map((s, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: 'var(--color-gray-50)',
              borderRadius: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--color-pink)', color: 'white',
                fontWeight: 800, fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: '1.25rem', width: 28, textAlign: 'center' }}>{s.icon}</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{s.text}</span>
            </li>
          ))}
        </ol>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 20,
            padding: '14px', borderRadius: 12,
            background: 'var(--color-gray-100)', color: 'var(--color-gray-700)',
            fontSize: '0.9375rem', fontWeight: 700, minHeight: 52,
          }}
        >
          알겠어요
        </button>
      </div>
    </div>
  );
}
