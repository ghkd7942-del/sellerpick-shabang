// 라이브몰 (방송 연동 상품 · isLive === true)
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useLiveProducts from '../hooks/useLiveProducts';
import useLiveSession from '../hooks/useLiveSession';
import useAuth from '../hooks/useAuth';
import useSeller from '../hooks/useSeller';
import LivePlayer from '../components/LivePlayer';
import ShopTabBar from '../components/ShopTabBar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ViewSwitcher from '../components/ViewSwitcher';
import LiveStatusBanner from '../components/LiveStatusBanner';
import InstallPrompt from '../components/InstallPrompt';
import '../styles/admin.css';

export default function LiveMall() {
  const { sellerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading } = useLiveProducts({ filter: 'live' });
  const { session } = useLiveSession();
  const { seller, slug } = useSeller(sellerSlug);
  const displayName = seller?.name || seller?.shopName || sellerSlug;
  const isLive = !!(seller?.isLive || session?.isActive);

  const sortedProducts = useMemo(() => {
    if (!session?.isActive || !session.currentProductId) return products;
    return [...products].sort((a, b) => {
      if (a.id === session.currentProductId) return -1;
      if (b.id === session.currentProductId) return 1;
      return 0;
    });
  }, [products, session]);

  return (
    <div className="admin-container">
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 56, background: 'white',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
          {displayName} 라이브몰 &#128308;
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLive && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'var(--color-pink)', color: 'white',
              fontSize: '0.75rem', fontWeight: 700,
              padding: '4px 10px', borderRadius: 9999,
            }}>
              <span className="live-dot" />LIVE
            </span>
          )}
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
        {seller?.isLive && !session?.isActive && (
          <LiveStatusBanner slug={slug} sellerName={displayName} />
        )}
        <InstallPrompt />
        {/* 라이브 영상 */}
        {session?.isActive ? (
          <LivePlayer
            youtubeVideoId={session?.youtubeVideoId || ''}
            isActive
            bandUrl="https://band.us/band/샤방이"
          />
        ) : (
          <div style={{
            borderRadius: 12, overflow: 'hidden',
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            padding: '28px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>&#128250;</div>
            <div style={{ color: 'white', fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>
              다음 라이브 방송 예정
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>
              방송이 시작되면 여기서 바로 시청할 수 있어요
            </div>
          </div>
        )}

        {/* 라이브몰 상품 */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            상품 불러오는 중...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            라이브몰에 등록된 상품이 없습니다
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedProducts.map((product) => {
              const isCurrent = session?.isActive && product.id === session.currentProductId;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  isCurrent={isCurrent}
                  onDetail={() => navigate(`/shop/${sellerSlug}/product/${product.id}`)}
                  onOrder={() => navigate(`/shop/${sellerSlug}/order/${product.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
      <Footer />
      <ShopTabBar />
    </div>
  );
}
