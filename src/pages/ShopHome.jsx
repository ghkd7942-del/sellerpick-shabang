import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useLiveProducts from '../hooks/useLiveProducts';
import useLiveSession from '../hooks/useLiveSession';
import useAuth from '../hooks/useAuth';
import LivePlayer from '../components/LivePlayer';
import ShopTabBar from '../components/ShopTabBar';
import Footer from '../components/Footer';
import '../styles/admin.css';

// 프리뷰용 더미 유튜브 영상 ID (저작권 무관 샘플)
const PREVIEW_VIDEO_ID = 'jNQXAC9IVRw';

export default function ShopHome() {
  const { sellerSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading } = useLiveProducts();
  const { session } = useLiveSession();
  const [searchParams] = useSearchParams();
  const previewMode = searchParams.get('preview'); // 'live' | 'shop' | null

  // 프리뷰 모드 강제 적용 (실제 session 무시)
  const isLiveView = previewMode === 'live' ? true
    : previewMode === 'shop' ? false
    : !!session?.isActive;
  const previewVideoId = previewMode === 'live' ? PREVIEW_VIDEO_ID : (session?.youtubeVideoId || '');

  // 현재 방송 상품을 맨 위로
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLiveView && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'var(--color-pink)', color: 'white',
              fontSize: '0.75rem', fontWeight: 700,
              padding: '4px 10px', borderRadius: 9999,
            }}>
              <span className="live-dot" />LIVE
            </span>
          )}
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
        {/* 프리뷰 모드 배너 */}
        {previewMode && (
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: '#FEF3C7', color: '#92400E',
            fontSize: '0.75rem', fontWeight: 600, textAlign: 'center',
          }}>
            {previewMode === 'live' ? '🎬 라이브 모드 미리보기' : '🛍️ 쇼핑몰 모드 미리보기'}
            {' · '}
            <button
              onClick={() => navigate(`/shop/${sellerSlug}?preview=${previewMode === 'live' ? 'shop' : 'live'}`)}
              style={{ background: 'none', border: 'none', color: '#92400E', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
            >
              {previewMode === 'live' ? '쇼핑몰 모드로' : '라이브 모드로'}
            </button>
            {' · '}
            <button
              onClick={() => navigate(`/shop/${sellerSlug}`)}
              style={{ background: 'none', border: 'none', color: '#92400E', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
            >
              실제 모드로
            </button>
          </div>
        )}

        {/* 라이브 방송 중일 때만 영상 노출 (평소엔 일반 쇼핑몰) */}
        {isLiveView && (
          <LivePlayer
            youtubeVideoId={previewVideoId}
            isActive
            bandUrl="https://band.us/band/샤방이"
          />
        )}

        {/* 상품 목록 */}
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
            {sortedProducts.map((product) => {
              const isCurrent = isLiveView && (
                previewMode === 'live'
                  ? product === sortedProducts[0] // 프리뷰 모드: 첫 번째 상품을 방송중으로 표시
                  : product.id === session?.currentProductId
              );
              return (
              <div
                key={product.id}
                className={isCurrent ? 'live-current-card' : ''}
                style={{
                  background: 'white', borderRadius: 12, overflow: 'hidden',
                  boxShadow: isCurrent ? '0 2px 12px rgba(255,75,110,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                {/* 상품 이미지 */}
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
