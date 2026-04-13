export default function ProductList({ products, loading }) {
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
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {products.map((product, i) => (
          <div
            key={product.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              minHeight: 44,
              borderBottom: i < products.length - 1 ? '1px solid var(--color-gray-100)' : 'none',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: product.imageUrl ? `url(${product.imageUrl}) center/cover` : 'var(--color-gray-200)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                {product.price.toLocaleString('ko-KR')}원
              </div>
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: product.stock > 0 ? 'var(--color-teal)' : 'var(--color-pink)',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              재고 {product.stock}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const sectionTitle = {
  fontSize: '1rem',
  fontWeight: 700,
  marginBottom: 8,
};
