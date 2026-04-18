import { useState } from 'react';
import { updateDocument, deleteDocument } from '../lib/firestoreAPI';
import SwipeableItem from './SwipeableItem';
import BottomSheet from './BottomSheet';

export default function ProductList({ products, loading, refetch }) {
  const [editProduct, setEditProduct] = useState(null);

  const handleDelete = async (product) => {
    if (!confirm(`"${product.name}" 상품을 삭제할까요?`)) return;
    try {
      await deleteDocument('products', product.id);
      refetch?.();
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    }
  };

  if (loading) {
    return (
      <section>
        <h2 style={sectionTitle}>상품 목록</h2>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
          로딩 중...
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section>
        <h2 style={sectionTitle}>상품 목록</h2>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
          등록된 상품이 없습니다
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 style={sectionTitle}>상품 목록</h2>
      <p style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginBottom: 6 }}>
        ← 왼쪽으로 밀어서 수정/삭제
      </p>
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {products.map((product, i) => (
          <div
            key={product.id}
            style={{ borderBottom: i < products.length - 1 ? '1px solid var(--color-gray-100)' : 'none' }}
          >
            <SwipeableItem
              onEdit={() => setEditProduct(product)}
              onDelete={() => handleDelete(product)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                minHeight: 44,
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: product.imageUrl ? `url(${product.imageUrl}) center/cover` : 'var(--color-gray-200)',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', gap: 8,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                        {product.price.toLocaleString('ko-KR')}원
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: product.stock > 0 ? 'var(--color-teal)' : 'var(--color-pink)',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {Array.isArray(product.variants) && product.variants.length > 0
                        ? `총 ${product.stock ?? 0}`
                        : `재고 ${product.stock ?? 0}`}
                    </div>
                  </div>
                  {Array.isArray(product.variants) && product.variants.length > 0 && (
                    <div style={{
                      display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4,
                    }}>
                      {product.variants.map((v, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.6875rem', fontWeight: 600,
                          padding: '2px 6px', borderRadius: 4,
                          background: (v.stock ?? 0) <= 0 ? '#FEE2E2' : 'var(--color-gray-100)',
                          color: (v.stock ?? 0) <= 0 ? '#991B1B' : 'var(--color-gray-700)',
                        }}>
                          {v.name} <span style={{
                            color: (v.stock ?? 0) <= 0 ? '#991B1B' : 'var(--color-pink)',
                          }}>
                            {(v.stock ?? 0) <= 0 ? '품절' : v.stock}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SwipeableItem>
          </div>
        ))}
      </div>

      {/* 수정 바텀시트 */}
      <BottomSheet
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        title="상품 수정"
      >
        {editProduct && (
          <EditProductForm
            product={editProduct}
            onClose={() => { setEditProduct(null); refetch?.(); }}
          />
        )}
      </BottomSheet>
    </section>
  );
}

function EditProductForm({ product, onClose }) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);

  const formatPrice = (val) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('ko-KR');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument('products', product.id, {
        name,
        price: parseInt(price.replace(/[^0-9]/g, ''), 10) || 0,
        stock: parseInt(stock, 10) || 0,
      });
      onClose();
    } catch (err) {
      alert('수정 실패: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 16 }}>
      <div>
        <label style={labelStyle}>상품명</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>판매가</label>
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...inputStyle, paddingRight: 36 }}
            inputMode="numeric"
            value={formatPrice(price)}
            onChange={(e) => setPrice(e.target.value)}
          />
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-gray-500)', fontSize: '0.875rem',
          }}>원</span>
        </div>
      </div>
      <div>
        <label style={labelStyle}>재고 수량</label>
        <input
          style={inputStyle}
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>
      <button
        className="btn-primary"
        onClick={handleSave}
        disabled={saving || !name || !price}
        style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8, opacity: saving ? 0.6 : 1 }}
      >
        {saving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  );
}

const sectionTitle = {
  fontSize: '1rem',
  fontWeight: 700,
  marginBottom: 8,
};
const labelStyle = {
  display: 'block', fontSize: '0.8125rem', fontWeight: 600,
  color: 'var(--color-gray-700)', marginBottom: 6,
};
const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1px solid var(--color-gray-200)', borderRadius: 10,
  fontSize: '0.9375rem', outline: 'none', minHeight: 44,
};
