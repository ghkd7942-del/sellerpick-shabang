// 고객 화면 공통 상품 카드
export default function ProductCard({ product, onOrder, onDetail, isCurrent = false }) {
  const soldOut = (product.stock ?? 0) <= 0;
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 1;
  return (
    <div
      className={isCurrent ? 'live-current-card' : ''}
      style={{
        background: 'white', borderRadius: 12, overflow: 'hidden',
        boxShadow: isCurrent ? '0 2px 12px rgba(255,75,110,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <button
        onClick={onDetail}
        disabled={!onDetail}
        style={{
          width: '100%', padding: 0, background: 'none', border: 'none',
          cursor: onDetail ? 'pointer' : 'default', textAlign: 'left',
        }}
      >
        <div style={{
          height: 200, background: product.imageUrl
            ? `url(${product.imageUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--color-gray-100), var(--color-gray-200))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {isCurrent && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'var(--color-pink)', color: 'white',
              padding: '4px 10px', borderRadius: 6,
              fontSize: '0.75rem', fontWeight: 700,
            }}>
              <span className="live-dot" />지금 방송중
            </div>
          )}
          {!product.imageUrl && (
            <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>&#128247;</span>
          )}
        </div>

        <div style={{ padding: '14px 16px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '1rem', fontWeight: 700,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {product.name}
              </div>
              <div style={{
                fontSize: '1.125rem', fontWeight: 700,
                color: 'var(--color-pink)', marginTop: 4,
              }}>
                {product.price?.toLocaleString('ko-KR')}원
                {hasVariants && (
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 500,
                    color: 'var(--color-gray-500)', marginLeft: 4,
                  }}>
                    부터
                  </span>
                )}
              </div>
            </div>
            <span style={{ color: 'var(--color-gray-300)', fontSize: '1.25rem', marginLeft: 8 }}>
              ›
            </span>
          </div>
          {soldOut && (
            <div style={{
              fontSize: '0.75rem', color: 'var(--color-pink)',
              fontWeight: 700, marginTop: 4,
            }}>
              품절
            </div>
          )}
        </div>
      </button>

      <div style={{ padding: '0 16px 14px' }}>
        <button
          className="btn-primary"
          disabled={soldOut}
          onClick={onOrder}
          style={{
            width: '100%', padding: '12px',
            fontSize: '0.9375rem',
            opacity: soldOut ? 0.4 : 1,
          }}
        >
          {soldOut ? '품절' : '바로 주문하기'}
        </button>
      </div>
    </div>
  );
}
