import { useState } from 'react';
import { updateDocument, deleteDocument } from '../lib/firestoreAPI';
import useProducts from '../hooks/useProducts';
import BottomSheet from '../components/BottomSheet';
import ProductForm from '../components/ProductForm';
import QuickAdd from '../components/QuickAdd';
import FAB from '../components/FAB';
import BottomTabBar from '../components/BottomTabBar';
import '../styles/admin.css';

const CATEGORIES = ['전체', '의류', '잡화', '화장품', '건강식품'];

export default function ProductManagement() {
  const { products, loading } = useProducts();
  const [filter, setFilter] = useState('전체');
  const [editProduct, setEditProduct] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const filtered = filter === '전체'
    ? products
    : products.filter((p) => p.category === filter);

  const toggleLive = async (product) => {
    await updateDocument('products', product.id, { isLive: !product.isLive });
  };

  const handleDelete = async (product) => {
    if (!confirm(`"${product.name}" 상품을 삭제할까요?`)) return;
    await deleteDocument('products', product.id);
  };

  const liveCount = products.filter((p) => p.isLive).length;
  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);

  return (
    <div className="admin-container">
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 56, background: 'white',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>상품 관리</h1>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
          {products.length}개 · 라이브 {liveCount}개
        </span>
      </header>

      {/* 요약 카드 */}
      <div style={{
        display: 'flex', gap: 10, padding: '12px 16px 0',
      }}>
        <div style={miniCard}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)' }}>전체 상품</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{products.length}</div>
        </div>
        <div style={miniCard}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)' }}>라이브 중</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-pink)' }}>{liveCount}</div>
        </div>
        <div style={miniCard}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)' }}>총 재고</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-teal)' }}>{totalStock}</div>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div style={{
        display: 'flex', gap: 0, padding: '12px 16px 0',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              flex: '0 0 auto', padding: '8px 14px',
              fontSize: '0.8125rem', fontWeight: filter === cat ? 700 : 400,
              color: filter === cat ? 'var(--color-pink)' : 'var(--color-gray-500)',
              borderBottom: filter === cat ? '2px solid var(--color-pink)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', minHeight: 40, whiteSpace: 'nowrap',
            }}
          >
            {cat}
            {cat !== '전체' && (
              <span style={{ marginLeft: 4, fontSize: '0.6875rem' }}>
                {products.filter((p) => p.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 상품 목록 */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            로딩 중...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>&#128230;</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-gray-700)' }}>
              등록된 상품이 없어요
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
              + 버튼으로 상품을 등록해보세요
            </div>
          </div>
        ) : (
          filtered.map((product) => (
            <div
              key={product.id}
              style={{
                background: 'white', borderRadius: 12, padding: '12px 14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                opacity: product.isLive ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                {/* 썸네일 */}
                <div style={{
                  width: 64, height: 64, borderRadius: 10, flexShrink: 0,
                  background: product.imageUrl
                    ? `url(${product.imageUrl}) center/cover`
                    : 'var(--color-gray-200)',
                }} />

                {/* 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{
                      fontSize: '0.9375rem', fontWeight: 700,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {product.name}
                    </div>
                    {product.isLive && (
                      <span style={{
                        fontSize: '0.625rem', fontWeight: 700,
                        background: '#D1FAE5', color: '#065F46',
                        padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                      }}>
                        LIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-pink)', marginTop: 2 }}>
                    {product.price?.toLocaleString('ko-KR')}원
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                    {product.category && <span>{product.category}</span>}
                    <span>재고 {product.stock}</span>
                    {product.options && <span>{product.options}</span>}
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => toggleLive(product)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8,
                    fontSize: '0.75rem', fontWeight: 600, minHeight: 40,
                    border: '1px solid',
                    borderColor: product.isLive ? 'var(--color-gray-200)' : 'var(--color-mint)',
                    background: product.isLive ? 'white' : 'var(--color-mint)',
                    color: product.isLive ? 'var(--color-gray-700)' : 'white',
                    cursor: 'pointer',
                  }}
                >
                  {product.isLive ? '라이브 해제' : '라이브 켜기'}
                </button>
                <button
                  onClick={() => setEditProduct(product)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8,
                    fontSize: '0.75rem', fontWeight: 600, minHeight: 40,
                    border: '1px solid var(--color-gray-200)',
                    background: 'white', color: 'var(--color-gray-700)', cursor: 'pointer',
                  }}
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  style={{
                    padding: '8px 12px', borderRadius: 8,
                    fontSize: '0.75rem', fontWeight: 600, minHeight: 40,
                    border: '1px solid #FEE2E2',
                    background: '#FEF2F2', color: '#991B1B', cursor: 'pointer',
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 수정 바텀시트 */}
      <BottomSheet
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        title="상품 수정"
      >
        {editProduct && (
          <EditForm
            product={editProduct}
            onClose={() => setEditProduct(null)}
          />
        )}
      </BottomSheet>

      <FAB onClick={() => setQuickAddOpen(true)} />
      {quickAddOpen && (
        <QuickAdd onClose={() => setQuickAddOpen(false)} onSuccess={() => {}} />
      )}
      <BottomTabBar />
    </div>
  );
}

function EditForm({ product, onClose }) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [options, setOptions] = useState(product.options || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument('products', product.id, {
        name,
        price: parseInt(price.replace(/[^0-9]/g, ''), 10) || 0,
        stock: parseInt(stock, 10) || 0,
        options,
      });
      onClose();
    } catch (err) {
      alert('수정 실패: ' + err.message);
    }
    setSaving(false);
  };

  const formatPrice = (val) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('ko-KR');
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
      <div>
        <label style={labelStyle}>옵션</label>
        <input style={inputStyle} placeholder="예) S, M, L, XL" value={options} onChange={(e) => setOptions(e.target.value)} />
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

const miniCard = {
  flex: 1, background: 'white', borderRadius: 10, padding: '10px 12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center',
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
