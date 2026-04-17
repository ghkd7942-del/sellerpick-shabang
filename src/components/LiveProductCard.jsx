export default function LiveProductCard({ product, isCurrent, orderCount, onSelect }) {
  const soldOut = (product.stock ?? 0) <= 0;
  return (
    <button
      onClick={() => onSelect(product.id)}
      style={{
        flex: '0 0 140px',
        background: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        border: isCurrent ? '2px solid var(--color-pink)' : '2px solid transparent',
        boxShadow: isCurrent ? '0 0 12px rgba(255,75,110,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        scrollSnapAlign: 'center',
        opacity: soldOut ? 0.55 : 1,
      }}
    >
      {/* 품절 뱃지 */}
      {soldOut && (
        <div style={{
          position: 'absolute', top: 6, left: 6, zIndex: 1,
          background: 'var(--color-gray-700)', color: 'white',
          fontSize: '0.625rem', fontWeight: 700,
          padding: '2px 6px', borderRadius: 4,
        }}>
          품절
        </div>
      )}

      {/* 판매중 뱃지 */}
      {isCurrent && !soldOut && (
        <div style={{
          position: 'absolute', top: 6, left: 6, zIndex: 1,
          background: 'var(--color-pink)', color: 'white',
          fontSize: '0.625rem', fontWeight: 700,
          padding: '2px 6px', borderRadius: 4,
        }}>
          판매중
        </div>
      )}

      {/* 주문 수 뱃지 */}
      {orderCount > 0 && (
        <div style={{
          position: 'absolute', top: 6, right: 6, zIndex: 1,
          background: 'var(--color-pink)', color: 'white',
          width: 22, height: 22, borderRadius: '50%',
          fontSize: '0.6875rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {orderCount}
        </div>
      )}

      {/* 이미지 */}
      <div style={{
        height: 90,
        background: product.imageUrl
          ? `url(${product.imageUrl}) center/cover no-repeat`
          : 'linear-gradient(135deg, var(--color-gray-100), var(--color-gray-200))',
      }} />

      {/* 정보 */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{
          fontSize: '0.75rem', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {product.name}
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-pink)', marginTop: 2 }}>
          {product.price?.toLocaleString('ko-KR')}원
        </div>
      </div>
    </button>
  );
}
