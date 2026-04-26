// 쇼핑몰 (항상 판매하는 상품 · isLive !== true)
// 단, 방송 중이면 자동으로 LiveMall 로 redirect — 라이브 위주 플랫폼
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLiveProducts from '../hooks/useLiveProducts';
import useLiveSession from '../hooks/useLiveSession';
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
  const { session, loading: sessionLoading } = useLiveSession();
  const displayName = seller?.name || seller?.shopName || sellerSlug;

  // 방송 중이면 LiveMall 로 자동 이동 (라이브 위주 플랫폼)
  useEffect(() => {
    if (!sessionLoading && session?.isActive) {
      navigate(`/shop/${sellerSlug}/live`, { replace: true });
    }
  }, [sessionLoading, session?.isActive, sellerSlug, navigate]);

  // 방송 중일 때는 빠른 점멸 방지를 위해 빈 화면 (곧 redirect)
  if (sessionLoading || session?.isActive) {
    return (
      <div className="admin-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
          {session?.isActive ? '🔴 라이브 방송으로 이동 중...' : ''}
        </span>
      </div>
    );
  }

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
