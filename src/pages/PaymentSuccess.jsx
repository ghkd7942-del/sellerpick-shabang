// 토스 결제 성공 리다이렉트 엔트리
// URL: /shop/:sellerSlug/payment/success?paymentKey=&orderId=&amount=
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getDocument } from '../lib/firestoreAPI';
import { notifyPaymentConfirmed } from '../lib/alimtalk';

export default function PaymentSuccess() {
  const { sellerSlug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'confirming', message: '결제를 확인하는 중이에요...' });

  const paymentKey = params.get('paymentKey');
  const orderId = params.get('orderId');
  const amount = params.get('amount');

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setState({ status: 'error', message: '잘못된 접근이에요.' });
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/toss-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });
        const data = await res.json();
        if (!res.ok) {
          setState({
            status: 'error',
            message: data?.error || '결제 승인 중 문제가 발생했어요.',
            code: data?.code,
          });
          return;
        }

        // 주문 문서에서 상품명/구매자/실제 결제수단(Toss가 덮어쓴 값) 로드
        // 실패해도 기본값으로 넘어갈 수 있도록 try/catch
        let order = null;
        try {
          order = await getDocument('orders', orderId);
        } catch (e) {
          console.warn('order 문서 조회 실패 — 최소 정보로 이동', e);
        }

        // 결제 완료 알림톡 — 실패해도 플로우 막지 않음
        if (order?.phone) {
          notifyPaymentConfirmed({ ...order, id: orderId }).catch(() => {});
        }

        // 성공 → OrderComplete로 state 전달하며 리다이렉트
        navigate(`/shop/${sellerSlug}/order-complete`, {
          replace: true,
          state: {
            orderId,
            productName: order?.productName || '',
            price: Number(order?.price ?? amount),
            buyerName: order?.buyerName || '',
            // 시스템 값은 항상 'toss', 한국어 라벨은 별도 필드 우선
            paymentMethodLabel: order?.paymentMethodLabel || '카드·간편결제',
            paymentMethod: 'toss',
            receiptUrl: data?.receiptUrl || '',
          },
        });
      } catch (err) {
        setState({ status: 'error', message: '네트워크 오류: ' + err.message });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={wrap}>
      <div style={card}>
        {state.status === 'confirming' ? (
          <>
            <div style={spinner} />
            <div style={title}>결제 확인 중</div>
            <div style={sub}>{state.message}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <div style={title}>결제 승인 실패</div>
            <div style={sub}>{state.message}</div>
            {state.code && <div style={code}>에러 코드: {state.code}</div>}
            <button onClick={() => navigate(`/s/${sellerSlug || 'shabang'}`)} style={btn}>
              쇼핑몰로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const wrap = {
  minHeight: '100vh', background: '#f9fafb',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
};
const card = {
  width: '100%', maxWidth: 380,
  background: 'white', borderRadius: 16,
  padding: '32px 24px', textAlign: 'center',
  boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
};
const title = { fontSize: '1.125rem', fontWeight: 800, color: '#111827' };
const sub = { fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 };
const code = { fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' };
const btn = {
  marginTop: 16, padding: '12px 20px', minHeight: 44,
  borderRadius: 10, background: '#FF4B6E', color: 'white',
  fontWeight: 700, fontSize: '0.9375rem',
};
const spinner = {
  width: 36, height: 36, borderRadius: '50%',
  border: '3px solid #f3d9e0', borderTopColor: '#FF4B6E',
  animation: 'spin 0.8s linear infinite',
};
// keyframe은 admin.css 에 없으므로 인라인으로 주입
if (typeof document !== 'undefined' && !document.getElementById('toss-spin-kf')) {
  const style = document.createElement('style');
  style.id = 'toss-spin-kf';
  style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
}
