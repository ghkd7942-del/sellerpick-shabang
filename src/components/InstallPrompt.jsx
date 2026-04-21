import { useEffect, useState } from 'react';

const DISMISS_KEY = 'shabang:a2hs-dismissed';
const DISMISS_DAYS = 14;

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    window.navigator.standalone === true
  );
}

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

function isRecentlyDismissed() {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (!ts) return false;
    const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return days < DISMISS_DAYS;
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform] = useState(() => detectPlatform());
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (isRecentlyDismissed()) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS는 beforeinstallprompt가 안 떠서 수동 안내 배너를 바로 표시.
    if (platform === 'ios') {
      const t = setTimeout(() => setVisible(true), 800);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, [platform]);

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    handleDismiss();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="홈 화면에 추가 안내"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'white', border: '1.5px solid var(--color-gray-200)',
        borderRadius: 12, padding: '12px 14px',
        boxShadow: '0 6px 14px rgba(0,0,0,0.06)',
      }}
    >
      <span style={{ fontSize: '1.5rem' }}>&#128241;</span>
      <div style={{ flex: 1, fontSize: '0.8125rem', lineHeight: 1.45 }}>
        <div style={{ fontWeight: 800 }}>홈 화면에 추가하면 더 빨라요</div>
        {platform === 'ios' ? (
          <div style={{ color: 'var(--color-gray-500)', fontSize: '0.75rem' }}>
            공유 <span aria-hidden>⬆️</span> → <b>홈 화면에 추가</b>
          </div>
        ) : (
          <div style={{ color: 'var(--color-gray-500)', fontSize: '0.75rem' }}>
            한 번 설치하면 앱처럼 사용 가능
          </div>
        )}
      </div>
      {deferred && (
        <button
          onClick={handleInstall}
          style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'var(--color-pink)', color: 'white',
            fontSize: '0.8125rem', fontWeight: 700, minHeight: 36,
          }}
        >
          설치
        </button>
      )}
      <button
        onClick={handleDismiss}
        aria-label="닫기"
        style={{
          width: 32, height: 32, borderRadius: 8,
          color: 'var(--color-gray-500)', fontSize: '1rem',
        }}
      >
        ✕
      </button>
    </div>
  );
}
