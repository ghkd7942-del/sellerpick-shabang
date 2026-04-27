import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { readCallback } from '../lib/kakao';

export default function KakaoCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const { code, state, expectedState, sellerSlug, error, errorDescription, redirectUri } = readCallback();

      if (error) { setErrorMsg(errorDescription || error); return; }
      if (!code) { setErrorMsg('인증 코드가 없습니다.'); return; }
      if (expectedState && state !== expectedState) {
        setErrorMsg('잘못된 요청입니다. 다시 시도해주세요.');
        return;
      }

      try {
        const res = await fetch('/api/kakao-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri, sellerSlug }),
        });
        const data = await res.json();
        if (!res.ok) {
          const detail = data.detail ? `\n${typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)}` : '';
          const debug = data.debug ? `\n[debug] ${JSON.stringify(data.debug)}` : '';
          throw new Error((data.error || '로그인 실패') + detail + debug);
        }

        await signInWithCustomToken(auth, data.firebaseToken);

        const slug = sellerSlug || '샤방이';
        const needsOnboarding = !data.profile?.phone;
        const target = needsOnboarding
          ? `/shop/${slug}/onboarding`
          : `/shop/${slug}`;
        navigate(target, { replace: true });
      } catch (e) {
        console.error(e);
        setErrorMsg(e.message || '로그인에 실패했습니다.');
      }
    })();
  }, []);

  if (errorMsg) {
    return (
      <div style={{
        maxWidth: 430, margin: '0 auto', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center', gap: 16,
      }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>카카오 로그인 실패</div>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, maxWidth: 380, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{errorMsg}</div>
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{
            marginTop: 8, padding: '12px 20px', borderRadius: 12,
            border: 'none', background: '#111', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          처음으로
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center',
    }}>
      <div style={{ fontSize: 15, color: '#666' }}>카카오 로그인 처리 중...</div>
    </div>
  );
}
