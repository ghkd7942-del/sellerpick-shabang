// 쇼핑몰 (항상 판매하는 상품 · isLive !== true)
import { useNavigate, useParams } from 'react-router-dom';
import useLiveProducts from '../hooks/useLiveProducts';
import useAuth from '../hooks/useAuth';
import ShopTabBar from '../components/ShopTabBar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import '../styles/admin.css';

export default function ShopHome() {
  const { sellerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading } = useLiveProducts({ filter: 'shop' });

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
          {sellerSlug} 쇼핑몰 &#128722;
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <button
              onClick={() => navigate(`/shop/${sellerSlug}/my`)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-pink), #FF8C00)',
                color: 'white', fontSize: '0.75rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {(user.displayName || user.email || '?')[0]}
            </button>
          ) : (
            <button
              onClick={() => navigate(`/shop/${sellerSlug}/login`)}
              style={{
                fontSize: '0.75rem', fontWeight: 600,
                color: 'var(--color-pink)', padding: '6px 10px',
                border: '1px solid var(--color-pink)', borderRadius: 8,
                minHeight: 32,
              }}
            >
              로그인
            </button>
          )}
        </div>
      </header>

      <div className="admin-content">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            상품 불러오는 중...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            등록된 상품이 없습니다
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOrder={() => navigate(`/shop/${sellerSlug}/order/${product.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
      <ShopTabBar />
    </div>
  );
}
