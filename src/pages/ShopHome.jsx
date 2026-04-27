// 쇼핑몰 (전체 상품 페이지 · 부수 진입점 /shop/:slug/all)
// 메인 진입(/shop/:slug, /s/:slug)은 라이브몰로 이동했음
import { useNavigate, useParams } from 'react-router-dom';
import useLiveProducts from '../hooks/useLiveProducts';
import useAuth from '../hooks/useAuth';
import useSeller from '../hooks/useSeller';
import ShopTabBar from '../components/ShopTabBar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ViewSwitcher from '../components/ViewSwitcher';
import LiveStatusBanner from '../components/LiveStatusBanner';
import InstallButton from '../components/InstallButton';
import '../styles/admin.css';

export default function ShopHome() {
  const { sellerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading } = useLiveProducts({ filter: 'shop' });
  const { seller, slug } = useSeller(sellerSlug);
  const displayName = seller?.name || seller?.shopName || sellerSlug;

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
          {displayName} 쇼핑몰 &#128722;
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ViewSwitcher slug={sellerSlug} />
          {user && (
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
          )}
        </div>
      </header>

      <div className="admin-content">
        {seller?.isLive && (
          <LiveStatusBanner slug={slug} sellerName={displayName} />
        )}
        <InstallButton />
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
                onDetail={() => navigate(`/shop/${sellerSlug}/product/${product.id}`)}
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
