import { useNavigate, useParams } from 'react-router-dom';
import useLiveProducts from '../hooks/useLiveProducts';
import ShopTabBar from '../components/ShopTabBar';
import '../styles/admin.css';

export default function ShopHome() {
  const { sellerSlug } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useLiveProducts();

  return (
    <div className="admin-container">
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 56, background: 'white',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
          {sellerSlug} &#128722;
        </h1>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'var(--color-pink)', color: 'white',
          fontSize: '0.75rem', fontWeight: 700,
          padding: '4px 10px', borderRadius: 9999,
        }}>
          <span className="live-dot" />LIVE
        </span>
      </header>

      <div className="admin-content">
        {/* 라이브 배너 */}
        <div style={{
          background: 'linear-gradient(135deg, #FF8C00, #FF6B00)',
          color: 'white', padding: '12px 16px', borderRadius: 10,
          fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5,
        }}>
          &#128250; 밴드 라이브 방송 중 · 여기서 바로 주문하세요
        </div>

        {/* 상품 목록 */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            상품 불러오는 중...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            현재 라이브 상품이 없습니다
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  background: 'white', borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                {/* 상품 이미지 */}
                <div style={{
                  height: 200, background: product.imageUrl
                    ? `url(${product.imageUrl}) center/cover no-repeat`
                    : 'linear-gradient(135deg, var(--color-gray-100), var(--color-gray-200))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!product.imageUrl && (
                    <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>&#128247;</span>
                  )}
                </div>

                {/* 상품 정보 */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700 }}>{product.name}</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-pink)', marginTop: 4 }}>
                        {product.price.toLocaleString('ko-KR')}원
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: product.stock > 0 ? 'var(--color-teal)' : 'var(--color-pink)',
                      fontWeight: 600, marginTop: 4,
                    }}>
                      {product.stock > 0 ? `재고 ${product.stock}` : '품절'}
                    </span>
                  </div>

                  <button
                    className="btn-primary"
                    disabled={product.stock <= 0}
                    onClick={() => navigate(`/shop/${sellerSlug}/order/${product.id}`)}
                    style={{
                      width: '100%', marginTop: 12, padding: '12px',
                      fontSize: '0.9375rem',
                      opacity: product.stock <= 0 ? 0.4 : 1,
                    }}
                  >
                    {product.stock > 0 ? '바로 주문하기' : '품절'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ShopTabBar />
    </div>
  );
}
