import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/admin.css';

export default function OrderComplete() {
  const { sellerSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { productName, price, buyerName, paymentMethod, paymentMethodLabel, receiptUrl } = location.state || {};
  const priceNum = Number(price) || 0;
  const methodLabel =
    paymentMethod === 'bank' ? '무통장 입금'
      : paymentMethodLabel ? paymentMethodLabel
      : paymentMethod === 'toss' ? '카드·간편결제'
      // 과거 데이터 호환
      : paymentMethod === 'kakaopay' ? '카카오페이'
      : paymentMethod === 'tosspay' ? '토스페이'
      : '-';

  return (
    <div className="admin-container">
      <div style={{
        padding: '48px 24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center', gap: 20,
      }}>
        {/* 체크 아이콘 */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#D1FAE5', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 36,
        }}>
          &#10003;
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>주문 신청 완료!</h1>

        {/* 주문 요약 */}
        <div style={{
          width: '100%', background: 'white', borderRadius: 12,
          padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          textAlign: 'left',
        }}>
          <div style={rowStyle}>
            <span style={rowLabel}>상품명</span>
            <span style={rowValue}>{productName || '-'}</span>
          </div>
          <div style={rowStyle}>
            <span style={rowLabel}>금액</span>
            <span style={{ ...rowValue, color: 'var(--color-pink)', fontWeight: 700 }}>
              {priceNum ? priceNum.toLocaleString('ko-KR') + '원' : '-'}
            </span>
          </div>
          <div style={rowStyle}>
            <span style={rowLabel}>결제방법</span>
            <span style={rowValue}>{methodLabel}</span>
          </div>
          {paymentMethod === 'bank' && (
            <>
              <div style={rowStyle}>
                <span style={rowLabel}>입금계좌</span>
                <span style={rowValue}>국민 000-0000-0000</span>
              </div>
              <div style={{ ...rowStyle, borderBottom: 'none' }}>
                <span style={rowLabel}>예금주</span>
                <span style={rowValue}>샤방이</span>
              </div>
            </>
          )}
          {paymentMethod === 'toss' && receiptUrl && (
            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <span style={rowLabel}>영수증</span>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                style={{ ...rowValue, color: 'var(--color-pink)', textDecoration: 'underline' }}
              >
                영수증 보기 &rarr;
              </a>
            </div>
          )}
        </div>

        {/* 안내 문구 — 결제 수단별 */}
        <div style={{
          width: '100%', background: '#FFF8E1', borderRadius: 12,
          padding: '14px 18px', fontSize: '0.875rem', color: '#5D4037',
          lineHeight: 1.6, textAlign: 'center',
        }}>
          {paymentMethod === 'bank'
            ? <>&#128172; 입금 완료되면 카카오톡으로 알림 드려요</>
            : <>&#128230; 주문이 접수됐어요. 배송 상태는 카카오톡으로 안내해드릴게요</>}
        </div>

        {/* 버튼 */}
        <button
          className="btn-primary"
          onClick={() => navigate(`/shop/${sellerSlug}`)}
          style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8 }}
        >
          쇼핑 계속하기
        </button>
      </div>
      <Footer compact />
    </div>
  );
}

const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 0', borderBottom: '1px solid var(--color-gray-100)',
};
const rowLabel = { fontSize: '0.8125rem', color: 'var(--color-gray-500)' };
const rowValue = { fontSize: '0.875rem', fontWeight: 600 };
