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
import InstallButton from '../components/InstallButton';
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

  // 현재 라이브 중인 상품 (히어로 카드로 큼지막하게 별도 노출)
  const currentProduct = useMemo(() => {
    if (!session?.isActive || !session.currentProductId) return null;
    return products.find((p) => p.id === session.currentProductId);
  }, [products, session]);

  // 리스트에 표시할 상품 — currentProduct 는 히어로로 빠지니 제외
  const otherProducts = useMemo(() => {
    if (!currentProduct) return products;
    return products.filter((p) => p.id !== currentProduct.id);
  }, [products, currentProduct]);

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
        <InstallButton />
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

        {/* 🔴 지금 판매중 — 라이브 영상 바로 아래 큼지막한 히어로 카드 */}
        {currentProduct && (
          <div style={{
            position: 'relative',
            marginTop: 12,
            background: 'white',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(255,75,110,0.18)',
            border: '2px solid var(--color-pink)',
          }}>
            {/* 라이브 펄스 표시 */}
            <div style={{
              position: 'absolute', top: 12, left: 12, zIndex: 2,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--color-pink)', color: 'white',
              padding: '6px 12px', borderRadius: 9999,
              fontSize: '0.75rem', fontWeight: 700,
              boxShadow: '0 2px 8px rgba(255,75,110,0.4)',
            }}>
              <span className="live-dot" />
              지금 판매중
            </div>

            {/* 사진 */}
            <div
              onClick={() => navigate(`/shop/${sellerSlug}/product/${currentProduct.id}`)}
              style={{
                width: '100%', height: 240,
                background: currentProduct.imageUrl
                  ? `url(${currentProduct.imageUrl}) center/cover no-repeat`
                  : 'linear-gradient(135deg, var(--color-gray-100), var(--color-gray-200))',
                cursor: 'pointer',
              }}
            />

            {/* 정보 */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                {currentProduct.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-pink)' }}>
                  {currentProduct.price?.toLocaleString('ko-KR')}원
                </span>
                {!currentProduct.unlimitedStock && (currentProduct.stock ?? 0) > 0 && (currentProduct.stock ?? 0) <= 10 && (
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, color: '#92400E',
                    background: '#FEF3C7', padding: '2px 8px', borderRadius: 4,
                  }}>
                    🔥 {currentProduct.stock}개 남음
                  </span>
                )}
              </div>

              {/* 바로 주문 버튼 */}
              <button
                onClick={() => navigate(`/shop/${sellerSlug}/order/${currentProduct.id}`)}
                disabled={!currentProduct.unlimitedStock && (currentProduct.stock ?? 0) === 0}
                style={{
                  width: '100%', marginTop: 12, padding: '14px',
                  borderRadius: 12, border: 'none',
                  background: !currentProduct.unlimitedStock && (currentProduct.stock ?? 0) === 0
                    ? 'var(--color-gray-200)' : 'var(--color-pink)',
                  color: 'white', fontSize: '1rem', fontWeight: 700,
                  cursor: !currentProduct.unlimitedStock && (currentProduct.stock ?? 0) === 0
                    ? 'not-allowed' : 'pointer',
                  minHeight: 52,
                  boxShadow: '0 4px 12px rgba(255,75,110,0.3)',
                }}
              >
                {!currentProduct.unlimitedStock && (currentProduct.stock ?? 0) === 0
                  ? '품절됐어요'
                  : `🛒 바로 주문하기 · ${currentProduct.price?.toLocaleString('ko-KR')}원`}
              </button>
            </div>
          </div>
        )}

        {/* 다른 라이브몰 상품들 */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            상품 불러오는 중...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            라이브몰에 등록된 상품이 없습니다
          </div>
        ) : otherProducts.length > 0 ? (
          <>
            {currentProduct && (
              <div style={{
                marginTop: 16, marginBottom: 8,
                fontSize: '0.8125rem', fontWeight: 600,
                color: 'var(--color-gray-500)',
              }}>
                다른 라이브 상품
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {otherProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isCurrent={false}
                  onDetail={() => navigate(`/shop/${sellerSlug}/product/${product.id}`)}
                  onOrder={() => navigate(`/shop/${sellerSlug}/order/${product.id}`)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      <Footer />
      <ShopTabBar />
    </div>
  );
}
