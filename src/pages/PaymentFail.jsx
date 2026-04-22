// 토스 결제 실패 리다이렉트 엔트리
// URL: /shop/:sellerSlug/payment/fail?code=&message=&orderId=
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export default function PaymentFail() {
  const { sellerSlug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const code = params.get('code') || '';
  const message = params.get('message') || '결제가 취소되었거나 실패했어요.';
  const orderId = params.get('orderId') || '';

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: '3rem' }}>😢</div>
        <div style={title}>결제가 완료되지 않았어요</div>
        <div style={sub}>{message}</div>
        {code && <div style={codeStyle}>에러 코드: {code}</div>}
        {orderId && <div style={codeStyle}>주문 ID: {orderId}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, width: '100%' }}>
          <button onClick={() => navigate(-1)} style={btnGhost}>이전으로</button>
          <button
            onClick={() => navigate(`/s/${sellerSlug || 'shabang'}`)}
            style={btnPrimary}
          >
            쇼핑몰
          </button>
        </div>
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
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
};
const title = { fontSize: '1.125rem', fontWeight: 800, color: '#111827', marginTop: 4 };
const sub = { fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 };
const codeStyle = { fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' };
const btnGhost = {
  flex: 1, padding: '12px', minHeight: 44,
  borderRadius: 10, background: '#f3f4f6', color: '#374151',
  fontWeight: 700, fontSize: '0.9375rem',
};
const btnPrimary = {
  flex: 1, padding: '12px', minHeight: 44,
  borderRadius: 10, background: '#FF4B6E', color: 'white',
  fontWeight: 700, fontSize: '0.9375rem',
};
