import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument } from '../lib/firestoreAPI';
import useAuth from '../hooks/useAuth';
import useCustomerProfile from '../hooks/useCustomerProfile';
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

export default function OrderForm() {
  const { sellerSlug, productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useCustomerProfile();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({
    buyerName: '', phone: '', address: '', option: '',
  });

  // 프로필에서 자동 입력
  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        buyerName: prev.buyerName || profile.name || '',
        phone: prev.phone || profile.phone || '',
        address: prev.address || profile.address || '',
      }));
    }
  }, [profile]);

  useEffect(() => {
    (async () => {
      const data = await getDocument('products', productId);
      if (data) setProduct({ id: productId, ...data });
      setLoading(false);
    })();
  }, [productId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const options = product?.options
    ? product.options.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const handleNext = () => {
    if (!form.buyerName || !form.phone) {
      alert('이름과 연락처를 입력해주세요.');
      return;
    }
    if (options.length > 0 && !form.option) {
      alert('옵션을 선택해주세요.');
      return;
    }
    if (product && qty > (product.stock || 0)) {
      alert(`재고가 부족합니다. (남은 재고: ${product.stock || 0}개)`);
      return;
    }
    navigate(`/shop/${sellerSlug}/checkout/${productId}`, {
      state: { ...form, qty, product },
    });
  };

  // 비로그인 → 로그인 유도
  if (!user && !loading) {
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
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>주문하기</h1>
        </header>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>&#128100;</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>로그인 후 주문할 수 있어요</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)', marginBottom: 20 }}>
            로그인하면 정보가 자동으로 입력됩니다
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate(`/shop/${sellerSlug}/login`)}
            style={{ padding: '14px 32px', fontSize: '0.9375rem' }}
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>로딩 중...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="admin-container">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>상품을 찾을 수 없습니다</div>
      </div>
    );
  }

  const totalPrice = product.price * qty;
  const stock = product.stock || 0;
  const isSoldOut = stock <= 0;
  const exceedsStock = qty > stock;

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
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>주문 정보</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <span style={stepBadge(true)}>1</span>
          <span style={stepBadge(false)}>2</span>
        </div>
      </header>

      <div style={{ padding: 16, paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* 상품 요약 */}
        <div style={{
          display: 'flex', gap: 12, background: 'white',
          padding: 14, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 10, flexShrink: 0,
            background: product.imageUrl
              ? `url(${product.imageUrl}) center/cover`
              : 'var(--color-gray-200)',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{product.name}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-pink)', marginTop: 4 }}>
              {product.price.toLocaleString('ko-KR')}원
            </div>
          </div>
        </div>

        {/* 옵션 */}
        {options.length > 0 && (
          <div>
            <label style={labelStyle}>옵션 선택 *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleChange('option', opt)}
                  style={{
                    padding: '8px 16px', borderRadius: 9999,
                    border: '1.5px solid',
                    borderColor: form.option === opt ? 'var(--color-pink)' : 'var(--color-gray-200)',
                    background: form.option === opt ? 'var(--color-pink)' : 'white',
                    color: form.option === opt ? 'white' : 'var(--color-gray-700)',
                    fontSize: '0.8125rem', fontWeight: 600, minHeight: 44, cursor: 'pointer',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 수량 */}
        <div>
          <label style={labelStyle}>
            수량
            <span style={{
              marginLeft: 8, fontSize: '0.75rem', fontWeight: 500,
              color: isSoldOut ? 'var(--color-pink)' : 'var(--color-gray-500)',
            }}>
              {isSoldOut ? '품절' : `재고 ${stock}개`}
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setQty(Math.max(1, qty - 1))} style={qtyBtn} disabled={isSoldOut}>-</button>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{qty}</span>
            <button
              onClick={() => setQty(Math.min(stock || 1, qty + 1))}
              style={qtyBtn}
              disabled={isSoldOut || qty >= stock}
            >+</button>
            <span style={{ marginLeft: 'auto', fontSize: '1rem', fontWeight: 700, color: 'var(--color-pink)' }}>
              {totalPrice.toLocaleString('ko-KR')}원
            </span>
          </div>
          {exceedsStock && !isSoldOut && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-pink)', marginTop: 6 }}>
              최대 {stock}개까지 주문 가능해요
            </div>
          )}
        </div>

        {/* 구매자 정보 */}
        <div style={{
          background: 'white', borderRadius: 12, padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>구매자 정보</div>

          <div>
            <label style={labelStyle}>이름 *</label>
            <input style={inputStyle} placeholder="홍길동"
              value={form.buyerName} onChange={(e) => handleChange('buyerName', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>연락처 *</label>
            <input style={inputStyle} inputMode="tel" placeholder="010-0000-0000"
              value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>배송지 (나중에 입력 가능)</label>
            <input style={inputStyle} placeholder="주소를 입력하세요"
              value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 430, margin: '0 auto',
        padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        background: 'white', borderTop: '1px solid var(--color-gray-200)',
      }}>
        <button
          className="btn-primary"
          onClick={handleNext}
          disabled={isSoldOut || exceedsStock}
          style={{
            width: '100%', padding: '16px', fontSize: '1rem',
            opacity: (isSoldOut || exceedsStock) ? 0.4 : 1,
          }}
        >
          {isSoldOut ? '품절' : `결제하기 · ${totalPrice.toLocaleString('ko-KR')}원`}
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

const qtyBtn = {
  width: 40, height: 40, borderRadius: 10,
  border: '1px solid var(--color-gray-200)',
  background: 'white', fontSize: '1.25rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};
