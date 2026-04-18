import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import useCustomerProfile from '../hooks/useCustomerProfile';
import { addDocument, updateDocument, getDocument } from '../lib/firestoreAPI';
import Footer from '../components/Footer';
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

export default function Cart() {
  const { sellerSlug } = useParams();
  const navigate = useNavigate();
  const { items, updateQty, removeItem, clearCart, totalPrice, makeKey } = useCart();
  const { user } = useAuth();
  const { profile } = useCustomerProfile();

  const [form, setForm] = useState({ buyerName: '', phone: '', address: '' });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        buyerName: prev.buyerName || profile.name || '',
        phone: prev.phone || profile.phone || '',
        address: prev.address || profile.address || '',
      }));
    }
  }, [profile]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePay = async () => {
    if (items.length === 0) return;
    if (!form.buyerName || !form.phone) {
      alert('이름과 연락처를 입력해주세요.');
      return;
    }
    if (!agreed) {
      alert('주문 내용에 동의해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      // 재고 재검증 (상품별)
      for (const it of items) {
        const fresh = await getDocument('products', it.productId);
        const currentStock = fresh?.stock ?? 0;
        if (currentStock < it.qty) {
          alert(`"${it.productName}" 재고가 부족합니다. 장바구니에서 수정해주세요.`);
          setSubmitting(false);
          return;
        }
      }

      // 주문 일괄 생성 + 재고 차감
      for (const it of items) {
        await addDocument('orders', {
          buyerName: form.buyerName,
          phone: form.phone,
          address: form.address || '',
          productId: it.productId,
          productName: it.productName,
          price: (it.price || 0) * (it.qty || 1),
          option: it.option || '',
          qty: it.qty || 1,
          paymentMethod: 'bank',
          status: 'new',
        });
        // 재고 차감 (best-effort)
        const fresh = await getDocument('products', it.productId);
        if (fresh) {
          updateDocument('products', it.productId, {
            stock: Math.max(0, (fresh.stock ?? 0) - (it.qty || 1)),
          }).catch(() => {});
        }
      }

      navigator.vibrate?.(200);
      clearCart();
      navigate(`/shop/${sellerSlug}/order-complete`, {
        state: {
          productName: items.length === 1
            ? items[0].productName
            : `${items[0].productName} 외 ${items.length - 1}건`,
          price: totalPrice,
          buyerName: form.buyerName,
          paymentMethod: 'bank',
        },
      });
    } catch (err) {
      alert('주문 실패: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="admin-container">
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', height: 56, background: 'white',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <button onClick={() => navigate(-1)} style={{
          fontSize: '1.25rem', minWidth: 44, minHeight: 44,
          display: 'flex', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          ←
        </button>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>장바구니</h1>
        <span style={{
          marginLeft: 'auto', fontSize: '0.75rem',
          color: 'var(--color-gray-500)',
        }}>
          {items.length}개 상품
        </span>
      </header>

      {items.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛒</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>
            장바구니가 비어있어요
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)', marginBottom: 24 }}>
            상품을 둘러보고 담아보세요
          </div>
          <button
            onClick={() => navigate(`/shop/${sellerSlug}`)}
            className="btn-primary"
            style={{ padding: '14px 32px', fontSize: '0.9375rem' }}
          >
            쇼핑하러 가기
          </button>
        </div>
      ) : (
        <div style={{ padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 장바구니 상품들 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it) => {
              const key = makeKey(it);
              const lineTotal = (it.price || 0) * (it.qty || 1);
              return (
                <div key={key} style={{
                  display: 'flex', gap: 12, padding: 12,
                  background: 'white', borderRadius: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div
                    onClick={() => navigate(`/shop/${sellerSlug}/product/${it.productId}`)}
                    style={{
                      width: 72, height: 72, borderRadius: 10, flexShrink: 0,
                      background: it.imageUrl
                        ? `url(${it.imageUrl}) center/cover`
                        : 'var(--color-gray-200)',
                      cursor: 'pointer',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', gap: 8,
                      alignItems: 'start',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.875rem', fontWeight: 700,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {it.productName}
                        </div>
                        {it.option && (
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                            {it.option}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(key)}
                        style={{
                          width: 24, height: 24, borderRadius: '50%',
                          border: 'none', background: 'var(--color-gray-100)',
                          color: 'var(--color-gray-500)', fontSize: 12,
                          cursor: 'pointer', flexShrink: 0,
                        }}
                        title="삭제"
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: 8, gap: 8,
                    }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center',
                        border: '1px solid var(--color-gray-200)', borderRadius: 8,
                        overflow: 'hidden',
                      }}>
                        <button
                          onClick={() => updateQty(key, (it.qty || 1) - 1)}
                          style={qtyBtn}
                        >−</button>
                        <span style={{
                          minWidth: 32, textAlign: 'center',
                          fontSize: '0.875rem', fontWeight: 600,
                        }}>
                          {it.qty}
                        </span>
                        <button
                          onClick={() => updateQty(key, (it.qty || 1) + 1)}
                          style={qtyBtn}
                        >+</button>
                      </div>
                      <div style={{
                        fontSize: '0.9375rem', fontWeight: 700,
                        color: 'var(--color-pink)',
                      }}>
                        {lineTotal.toLocaleString('ko-KR')}원
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 결제 요약 */}
          <div style={{
            background: 'white', borderRadius: 12, padding: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: 10 }}>결제 요약</div>
            <div style={summaryRow}>
              <span>상품 금액</span>
              <span>{totalPrice.toLocaleString('ko-KR')}원</span>
            </div>
            <div style={summaryRow}>
              <span>배송비</span>
              <span style={{ color: 'var(--color-mint)', fontWeight: 600 }}>무료</span>
            </div>
            <div style={{
              ...summaryRow,
              borderTop: '1px solid var(--color-gray-100)',
              paddingTop: 10, marginTop: 4,
            }}>
              <span style={{ fontWeight: 700 }}>총 결제금액</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-pink)' }}>
                {totalPrice.toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>

          {/* 구매자 정보 */}
          <div style={{
            background: 'white', borderRadius: 12, padding: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>구매자 정보</div>
            <div>
              <label style={labelStyle}>이름 *</label>
              <input
                style={inputStyle}
                placeholder="홍길동"
                value={form.buyerName}
                onChange={(e) => handleChange('buyerName', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>연락처 *</label>
              <input
                style={inputStyle}
                inputMode="tel"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>배송지</label>
              <input
                style={inputStyle}
                placeholder="주소를 입력하세요"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
          </div>

          {/* 무통장 입금 안내 */}
          <div style={{
            background: '#FFF8F0', borderRadius: 12, padding: '16px 18px',
            border: '1px solid #FFE0B2',
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E65100', marginBottom: 8 }}>
              🏦 무통장 입금 안내
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.8, color: '#5D4037' }}>
              국민은행 000-0000-0000<br />
              예금주: 샤방이 · <strong>{totalPrice.toLocaleString('ko-KR')}원</strong><br />
              주문자명({form.buyerName || '이름'})으로 입금해주세요
            </div>
          </div>

          {/* 동의 */}
          <button
            onClick={() => setAgreed(!agreed)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 0', fontSize: '0.8125rem', color: 'var(--color-gray-700)',
              cursor: 'pointer', minHeight: 44,
              background: 'none', border: 'none',
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              border: '2px solid',
              borderColor: agreed ? 'var(--color-pink)' : 'var(--color-gray-300)',
              background: agreed ? 'var(--color-pink)' : 'white',
              color: 'white', fontSize: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {agreed ? '✓' : ''}
            </span>
            주문 내용을 확인했으며 결제에 동의합니다
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          maxWidth: 430, margin: '0 auto',
          padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          background: 'white', borderTop: '1px solid var(--color-gray-200)',
          zIndex: 50,
        }}>
          <button
            className="btn-primary"
            onClick={handlePay}
            disabled={submitting || !agreed}
            style={{
              width: '100%', padding: '16px', fontSize: '1rem',
              opacity: (submitting || !agreed) ? 0.5 : 1,
            }}
          >
            {submitting ? '주문 처리 중...' : `${totalPrice.toLocaleString('ko-KR')}원 결제하기`}
          </button>
        </div>
      )}

      <Footer compact />
    </div>
  );
}

const summaryRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '6px 0', fontSize: '0.8125rem', color: 'var(--color-gray-700)',
};

const qtyBtn = {
  width: 32, height: 32, background: 'white', border: 'none',
  fontSize: '1rem', cursor: 'pointer', color: 'var(--color-gray-700)',
};
