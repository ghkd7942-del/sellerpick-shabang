import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    buyerName: '', phone: '', address: '', option: '',
  });

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'products', productId));
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() });
      setLoading(false);
    })();
  }, [productId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const options = product?.options
    ? product.options.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const handleSubmit = async () => {
    if (!form.buyerName || !form.phone || !form.address) {
      alert('이름, 연락처, 주소를 입력해주세요.');
      return;
    }
    if (options.length > 0 && !form.option) {
      alert('옵션을 선택해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        buyerName: form.buyerName,
        phone: form.phone,
        address: form.address,
        productId: product.id,
        productName: product.name,
        price: product.price,
        option: form.option,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      navigate(`/shop/${sellerSlug}/order-complete`, {
        state: {
          productName: product.name,
          price: product.price,
          buyerName: form.buyerName,
        },
      });
    } catch (err) {
      alert('주문 실패: ' + err.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="admin-container">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>
          상품을 찾을 수 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* 헤더 */}
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

      <div style={{ padding: 16, paddingBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{product.name}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-pink)', marginTop: 4 }}>
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

        {/* 받는 분 */}
        <div>
          <label style={labelStyle}>받는 분 이름 *</label>
          <input style={inputStyle} placeholder="홍길동"
            value={form.buyerName} onChange={(e) => handleChange('buyerName', e.target.value)} />
        </div>

        {/* 연락처 */}
        <div>
          <label style={labelStyle}>연락처 *</label>
          <input style={inputStyle} inputMode="tel" placeholder="010-0000-0000"
            value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
        </div>

        {/* 배송지 */}
        <div>
          <label style={labelStyle}>배송지 *</label>
          <input style={inputStyle} placeholder="주소를 입력하세요"
            value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
        </div>

        {/* 입금 안내 */}
        <div style={{
          background: '#FFF8F0', borderRadius: 12, padding: '16px 18px',
          border: '1px solid #FFE0B2',
        }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E65100', marginBottom: 8 }}>
            &#127974; 무통장 입금 안내
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.8, color: '#5D4037' }}>
            국민은행 000-0000-0000<br />
            예금주: 샤방이 · <strong>{product.price.toLocaleString('ko-KR')}원</strong><br />
            주문자명으로 입금해주세요
          </div>
        </div>

        {/* 주문 버튼 */}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: '14px', fontSize: '1rem', marginTop: 4,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '주문 처리 중...' : '주문 신청하기'}
        </button>
      </div>
    </div>
  );
}
