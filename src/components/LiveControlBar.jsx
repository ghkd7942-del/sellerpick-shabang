import { useState } from 'react';
import useSeller from '../hooks/useSeller';
import { buildLiveShareMessage, buildShortUrl, DEFAULT_SELLER_SLUG } from '../lib/sellers';

export default function LiveControlBar() {
  const { seller, slug, toggleLive } = useSeller(DEFAULT_SELLER_SLUG);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLive = !!seller?.isLive;
  const sellerName = seller?.name || seller?.shopName || '샤방이';

  const handleStart = async () => {
    setBusy(true);
    try {
      await toggleLive(true);
    } catch (err) {
      alert('라이브 시작 실패: ' + err.message);
    }
    setBusy(false);
  };

  const handleEnd = async () => {
    if (!confirm('라이브를 종료할까요?')) return;
    setBusy(true);
    try {
      await toggleLive(false);
    } catch (err) {
      alert('라이브 종료 실패: ' + err.message);
    }
    setBusy(false);
  };

  const handleCopy = async () => {
    const msg = buildLiveShareMessage(sellerName, slug);
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 일부 브라우저(http, 구형)는 clipboard API 없음 → 폴백
      const ta = document.createElement('textarea');
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); }
      catch { alert(msg); }
      document.body.removeChild(ta);
    }
  };

  if (!isLive) {
    return (
      <button
        onClick={handleStart}
        disabled={busy}
        style={{
          width: '100%', padding: '14px 18px', borderRadius: 12,
          background: 'var(--color-gray-100)', color: 'var(--color-gray-700)',
          border: '1.5px solid var(--color-gray-200)',
          display: 'flex', alignItems: 'center', gap: 12,
          minHeight: 56, cursor: busy ? 'wait' : 'pointer', textAlign: 'left',
          opacity: busy ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>&#128308;</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
            {busy ? '시작 중…' : '라이브 시작'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
            고객에게 LIVE 배너가 즉시 표시돼요
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      className="live-control-pulse"
      style={{
        width: '100%', padding: 12, borderRadius: 12,
        background: 'linear-gradient(135deg, #FF4B6E, #FF1744)',
        color: 'white',
        boxShadow: '0 6px 20px rgba(255, 75, 110, 0.35)',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}
    >
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', background: 'rgba(0,0,0,0.18)',
        borderRadius: 9999, fontWeight: 800, fontSize: '0.8125rem',
        minHeight: 32,
      }}>
        <span className="live-dot-white" />
        <span>LIVE 중</span>
      </div>
      <button
        onClick={handleCopy}
        disabled={busy}
        style={{
          flex: 1, minWidth: 120,
          padding: '10px 14px', borderRadius: 10,
          background: 'white', color: 'var(--color-pink)',
          fontSize: '0.875rem', fontWeight: 800,
          minHeight: 44,
        }}
      >
        {copied ? '✓ 복사됨' : '📋 링크 복사'}
      </button>
      <button
        onClick={handleEnd}
        disabled={busy}
        style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(0,0,0,0.25)', color: 'white',
          fontSize: '0.875rem', fontWeight: 700,
          minHeight: 44,
        }}
      >
        종료
      </button>
      <div style={{
        flexBasis: '100%', fontSize: '0.6875rem', opacity: 0.85,
        paddingTop: 2, wordBreak: 'break-all',
      }}>
        {buildShortUrl(slug)}
      </div>
    </div>
  );
}
