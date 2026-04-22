import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import { addDocument, getDocument, updateDocument } from '../lib/firestoreAPI';
import Footer from '../components/Footer';
import '../styles/admin.css';

const PAYMENT_METHODS = [
  { key: 'toss', label: '카드·간편결제', icon: '💳', desc: '토스·카카오·네이버페이, 카드, 계좌이체 등' },
  { key: 'bank', label: '무통장 입금', icon: '🏦', desc: '국민은행 · 주문 후 입금' },
];

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || '';

export default function Checkout() {
  const { sellerSlug, productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { buyerName, phone, address, option, qty, product } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('toss');
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const widgetsRef = useRef(null);
  const [widgetsReady, setWidgetsReady] = useState(false);
  const [widgetError, setWidgetError] = useState('');

  const totalPrice = product ? product.price * (qty || 1) : 0;

  // 토스 결제위젯 초기화 (토스 선택 시)
  useEffect(() => {
    if (paymentMethod !== 'toss' || !product) return;
    if (!TOSS_CLIENT_KEY) {
      setWidgetError('결제 설정이 누락됐어요. 관리자에게 문의해주세요.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const toss = await loadTossPayments(TOSS_CLIENT_KEY);
        if (cancelled) return;
        const widgets = toss.widgets({ customerKey: ANONYMOUS });
        widgetsRef.current = widgets;
        await widgets.setAmount({ currency: 'KRW', value: totalPrice });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: '#toss-payment-method', variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: '#toss-agreement', variantKey: 'AGREEMENT' }),
        ]);
        if (!cancelled) setWidgetsReady(true);
      } catch (err) {
        console.error('Toss 위젯 로드 실패', err);
        if (!cancelled) setWidgetError('결제 모듈을 불러오지 못했어요. 새로고침하거나 무통장 입금을 이용해주세요.');
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, product?.id]);

  // 금액이 바뀌면 위젯에도 반영
  useEffect(() => {
    if (widgetsRef.current && widgetsReady) {
      widgetsRef.current.setAmount({ currency: 'KRW', value: totalPrice }).catch(() => {});
    }
  }, [totalPrice, widgetsReady]);

  if (!product) {
    return (
      <div className="admin-container">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>
          주문 정보가 없습니다. 다시 시도해주세요.
        </div>
      </div>
    );
  }

  // 공용: 주문 문서 생성 (status=pending_payment)
  const createPendingOrder = async () => {
    const fresh = await getDocument('products', product.id);
    const currentStock = fresh?.stock ?? 0;
    const needed = qty || 1;
    if (currentStock < needed) {
      alert(currentStock === 0 ? '품절된 상품입니다.' : '선택하신 수량으로는 주문할 수 없습니다.');
      return null;
    }
    const orderId = await addDocument('orders', {
      buyerName,
      phone,
      address: address || '',
      productId: product.id,
      productName: product.name,
      price: totalPrice,
      option: option || '',
      qty: needed,
      paymentMethod,
      paymentStatus: paymentMethod === 'toss' ? 'pending' : 'awaiting_deposit',
      status: paymentMethod === 'toss' ? 'pending_payment' : 'new',
    });
    return { orderId, currentStock, needed };
  };

  // 무통장 입금: 기존 흐름 유지 (즉시 재고 차감 + OrderComplete)
  const handleBankTransfer = async () => {
    const result = await createPendingOrder();
    if (!result) return;
    updateDocument('products', product.id, { stock: result.currentStock - result.needed }).catch(() => {});
    navigator.vibrate?.(200);
    navigate(`/shop/${sellerSlug}/order-complete`, {
      state: {
        productName: product.name,
        price: totalPrice,
        buyerName,
        paymentMethod: 'bank',
      },
    });
  };

  // 토스 결제: 주문 생성 후 위젯 호출 (승인·재고 차감은 서버에서)
  const handleTossPayment = async () => {
    if (!widgetsRef.current) {
      alert('결제 모듈이 준비되지 않았어요. 잠시 후 다시 시도해주세요.');
      return;
    }
    const result = await createPendingOrder();
    if (!result) return;
    const origin = window.location.origin;
    try {
      await widgetsRef.current.requestPayment({
        orderId: result.orderId,
        orderName: `${product.name}${(qty || 1) > 1 ? ` 외 ${(qty || 1) - 1}건` : ''}`,
        customerName: buyerName,
        customerMobilePhone: (phone || '').replace(/-/g, ''),
        successUrl: `${origin}/shop/${sellerSlug}/payment/success`,
        failUrl: `${origin}/shop/${sellerSlug}/payment/fail?orderId=${result.orderId}`,
      });
      // requestPayment는 성공 시 외부 리다이렉트 → 아래 코드는 도달하지 않음
    } catch (err) {
      console.error('결제 요청 실패', err);
      alert('결제 요청 실패: ' + (err?.message || '알 수 없는 오류'));
    }
  };

  const handlePay = async () => {
    setSubmitting(true);
    try {
      if (paymentMethod === 'toss') {
        await handleTossPayment();
      } else {
        await handleBankTransfer();
      }
    } catch (err) {
      alert('주문 실패: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="admin-container">
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', height: 56, background: 'white',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <button onClick={() => navigate(-1)} style={{ fontSize: '1.25rem', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center' }}>
          &#8592;
        </button>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>결제</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <span style={stepBadge(false)}>1</span>
          <span style={stepBadge(true)}>2</span>
        </div>
      </header>

      <div style={{ padding: 16, paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 주문 요약 */}
        <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 12 }}>주문 요약</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 8, flexShrink: 0,
              background: product.imageUrl ? `url(${product.imageUrl}) center/cover` : 'var(--color-gray-200)',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{product.name}</div>
              {option && <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>옵션: {option}</div>}
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>수량: {qty || 1}개</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--color-gray-100)', marginTop: 12, paddingTop: 12 }}>
            <div style={summaryRow}><span>상품 금액</span><span>{product.price.toLocaleString('ko-KR')}원 x {qty || 1}</span></div>
            <div style={summaryRow}><span>배송비</span><span style={{ color: 'var(--color-mint)', fontWeight: 600 }}>무료</span></div>
            <div style={{ ...summaryRow, borderTop: '1px solid var(--color-gray-100)', paddingTop: 10, marginTop: 4 }}>
              <span style={{ fontWeight: 700 }}>총 결제금액</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-pink)' }}>
                {totalPrice.toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>
        </div>

        {/* 구매자 정보 확인 */}
        <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 10 }}>구매자 정보</div>
          <div style={infoRow}><span style={infoLabel}>이름</span><span>{buyerName}</span></div>
          <div style={infoRow}><span style={infoLabel}>연락처</span><span>{phone}</span></div>
          {address && <div style={infoRow}><span style={infoLabel}>배송지</span><span>{address}</span></div>}
        </div>

        {/* 결제 수단 */}
        <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 12 }}>결제 수단</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.key}
                onClick={() => setPaymentMethod(pm.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 10,
                  border: '1.5px solid',
                  borderColor: paymentMethod === pm.key ? 'var(--color-pink)' : 'var(--color-gray-200)',
                  background: paymentMethod === pm.key ? '#FFF0F3' : 'white',
                  cursor: 'pointer',
                  minHeight: 52, textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{pm.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-gray-900)' }}>{pm.label}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 1 }}>{pm.desc}</div>
                </div>
                {paymentMethod === pm.key && (
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--color-pink)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6875rem',
                  }}>✓</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 토스 결제위젯 — 토스 선택 시 */}
        {paymentMethod === 'toss' && (
          <div style={{ background: 'white', borderRadius: 12, padding: '8px 4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {widgetError && (
              <div style={{ padding: 16, color: '#B71C1C', fontSize: '0.8125rem' }}>{widgetError}</div>
            )}
            <div id="toss-payment-method" style={{ minHeight: widgetsReady ? 0 : 160 }} />
            <div id="toss-agreement" />
            {!widgetsReady && !widgetError && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.8125rem' }}>
                결제 모듈 불러오는 중...
              </div>
            )}
          </div>
        )}

        {/* 무통장 입금 안내 — bank 선택 시 */}
        {paymentMethod === 'bank' && (
          <div style={{ background: '#FFF8F0', borderRadius: 12, padding: '16px 18px', border: '1px solid #FFE0B2' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E65100', marginBottom: 8 }}>
              &#127974; 무통장 입금 안내
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.8, color: '#5D4037' }}>
              국민은행 000-0000-0000<br />
              예금주: 샤방이 · <strong>{totalPrice.toLocaleString('ko-KR')}원</strong><br />
              주문자명({buyerName})으로 입금해주세요
            </div>
          </div>
        )}

        {/* 무통장 전용 약관 동의 (토스 위젯은 자체 약관 제공) */}
        {paymentMethod === 'bank' && (
          <button
            onClick={() => setAgreed(!agreed)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 0', fontSize: '0.8125rem', color: 'var(--color-gray-700)',
              cursor: 'pointer', minHeight: 44,
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              border: '2px solid',
              borderColor: agreed ? 'var(--color-pink)' : 'var(--color-gray-300)',
              background: agreed ? 'var(--color-pink)' : 'white',
              color: 'white', fontSize: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {agreed ? '✓' : ''}
            </span>
            주문 내용을 확인했으며 결제에 동의합니다
          </button>
        )}
      </div>
      <Footer compact />

      {/* 결제 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 430, margin: '0 auto',
        padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        background: 'white', borderTop: '1px solid var(--color-gray-200)',
      }}>
        <button
          className="btn-primary"
          onClick={handlePay}
          disabled={
            submitting ||
            (paymentMethod === 'bank' && !agreed) ||
            (paymentMethod === 'toss' && (!widgetsReady || !!widgetError))
          }
          style={{
            width: '100%', padding: '18px', fontSize: '1.125rem',
            opacity:
              submitting ||
              (paymentMethod === 'bank' && !agreed) ||
              (paymentMethod === 'toss' && (!widgetsReady || widgetError))
                ? 0.5 : 1,
          }}
        >
          {submitting
            ? '결제 처리 중...'
            : paymentMethod === 'toss'
              ? `${totalPrice.toLocaleString('ko-KR')}원 결제하기`
              : `${totalPrice.toLocaleString('ko-KR')}원 주문하기`}
        </button>
      </div>
    </div>
  );
}

function stepBadge(active) {
  return {
    width: 24, height: 24, borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.6875rem', fontWeight: 700,
    background: active ? 'var(--color-pink)' : 'var(--color-gray-200)',
    color: active ? 'white' : 'var(--color-gray-500)',
  };
}

const summaryRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '6px 0', fontSize: '0.8125rem', color: 'var(--color-gray-700)',
};
const infoRow = {
  display: 'flex', justifyContent: 'space-between',
  padding: '6px 0', fontSize: '0.8125rem',
};
const infoLabel = { color: 'var(--color-gray-500)' };
