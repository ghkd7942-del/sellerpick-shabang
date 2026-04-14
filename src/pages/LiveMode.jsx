import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import useOrders from '../hooks/useOrders';
import useLiveSession from '../hooks/useLiveSession';
import useOrderNotification from '../hooks/useOrderNotification';
import LiveProductCard from '../components/LiveProductCard';
import OrderToast from '../components/OrderToast';
import QuickAdd from '../components/QuickAdd';
import FAB from '../components/FAB';
import '../styles/admin.css';

function formatElapsed(startedAt) {
  if (!startedAt) return '00:00';
  const start = startedAt.toDate ? startedAt.toDate() : new Date(startedAt);
  const diff = Math.floor((Date.now() - start.getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function LiveMode() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { orders } = useOrders(200);
  const { session, loading, startSession, endSession, setCurrentProduct, nextProduct, prevProduct, updateYoutubeId } = useLiveSession();
  const { latestOrder, hasNew, clearNew } = useOrderNotification();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [elapsed, setElapsed] = useState('00:00');
  const [youtubeInput, setYoutubeInput] = useState('');

  const liveProducts = useMemo(() =>
    products.filter((p) => p.isLive),
    [products]
  );

  const currentProduct = useMemo(() =>
    liveProducts.find((p) => p.id === session?.currentProductId),
    [liveProducts, session]
  );

  // 경과 시간 타이머
  useEffect(() => {
    if (!session?.isActive) return;
    const interval = setInterval(() => {
      setElapsed(formatElapsed(session.startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.isActive, session?.startedAt]);

  // 상품별 주문 수
  const orderCountMap = useMemo(() => {
    const map = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    orders.forEach((o) => {
      const t = o.createdAt?.toDate?.() || new Date(o.createdAt);
      if (t >= today && o.productId) {
        map[o.productId] = (map[o.productId] || 0) + 1;
      }
    });
    return map;
  }, [orders]);

  const totalSessionOrders = useMemo(() => {
    if (!session?.startedAt) return 0;
    const start = session.startedAt.toDate ? session.startedAt.toDate() : new Date(session.startedAt);
    return orders.filter((o) => {
      const t = o.createdAt?.toDate?.() || new Date(o.createdAt);
      return t >= start;
    }).length;
  }, [orders, session]);

  if (loading) {
    return (
      <div className="admin-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--color-gray-500)' }}>로딩 중...</span>
      </div>
    );
  }

  // 방송 시작 전
  if (!session?.isActive) {
    return (
      <div className="admin-container">
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 16px', height: 56, background: 'white',
          borderBottom: '1px solid var(--color-gray-200)',
        }}>
          <button onClick={() => navigate('/admin')} style={{ fontSize: '1.25rem', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center' }}>
            &#8592;
          </button>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>라이브 모드</h1>
        </header>

        <div style={{
          padding: 24, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - 56px)', gap: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: '4rem' }}>&#128308;</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>라이브 방송 준비</h2>
          <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            라이브 상품 {liveProducts.length}개 준비됨
          </p>

          {/* 유튜브 링크 입력 */}
          <div style={{ width: '100%', textAlign: 'left' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: 6, display: 'block' }}>
              유튜브 라이브 링크 (선택)
            </label>
            <input
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
              placeholder="유튜브 URL 또는 영상 ID"
              style={{
                width: '100%', padding: '12px 14px',
                border: '1px solid var(--color-gray-200)', borderRadius: 10,
                fontSize: '0.875rem', outline: 'none', minHeight: 44,
              }}
            />
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
              예) https://youtube.com/watch?v=xxxxx 또는 xxxxx
            </p>
          </div>

          <button
            onClick={() => {
              const id = youtubeInput.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1] || youtubeInput.trim();
              startSession(liveProducts.map((p) => p.id), id);
            }}
            disabled={liveProducts.length === 0}
            style={{
              background: 'var(--color-pink)', color: 'white',
              padding: '18px 48px', borderRadius: 16,
              fontSize: '1.25rem', fontWeight: 700, minHeight: 64,
              boxShadow: '0 4px 16px rgba(255,75,110,0.4)',
              opacity: liveProducts.length === 0 ? 0.4 : 1,
            }}
          >
            &#128308; 방송 시작
          </button>
          {liveProducts.length === 0 && (
            <p style={{ color: 'var(--color-pink)', fontSize: '0.8125rem' }}>
              먼저 상품을 등록해주세요
            </p>
          )}
        </div>

        <FAB onClick={() => setQuickAddOpen(true)} />
        {quickAddOpen && (
          <QuickAdd onClose={() => setQuickAddOpen(false)} onSuccess={() => {}} />
        )}
      </div>
    );
  }

  // 방송 중
  return (
    <div className="admin-container" style={{ background: '#111' }}>
      {/* 주문 토스트 */}
      {hasNew && latestOrder && (
        <OrderToast order={latestOrder} onDismiss={clearNew} />
      )}

      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 56, background: 'rgba(0,0,0,0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="live-dot" style={{ background: '#FF4B6E' }} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem' }}>LIVE</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>{elapsed}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: 'var(--color-pink)', color: 'white',
            padding: '4px 10px', borderRadius: 9999,
            fontSize: '0.75rem', fontWeight: 700,
          }}>
            주문 {totalSessionOrders}건
          </span>
          <button
            onClick={async () => { await endSession(); navigate('/admin'); }}
            style={{
              background: 'rgba(255,255,255,0.15)', color: '#FF6B6B',
              padding: '8px 14px', borderRadius: 8,
              fontSize: '0.8125rem', fontWeight: 600, minHeight: 36,
            }}
          >
            방송 종료
          </button>
        </div>
      </header>

      {/* 현재 상품 히어로 */}
      {currentProduct && (
        <div style={{ padding: '20px 16px' }}>
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              height: 280,
              background: currentProduct.imageUrl
                ? `url(${currentProduct.imageUrl}) center/cover no-repeat`
                : 'linear-gradient(135deg, var(--color-gray-100), var(--color-gray-200))',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: 'var(--color-pink)', color: 'white',
                padding: '6px 12px', borderRadius: 8,
                fontSize: '0.8125rem', fontWeight: 700,
              }}>
                <span className="live-dot" />
                지금 판매중
              </div>
              {orderCountMap[currentProduct.id] > 0 && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(0,0,0,0.7)', color: 'white',
                  padding: '6px 12px', borderRadius: 8,
                  fontSize: '0.8125rem', fontWeight: 700,
                }}>
                  &#128717; {orderCountMap[currentProduct.id]}건
                </div>
              )}
            </div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{currentProduct.name}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-pink)', marginTop: 4 }}>
                {currentProduct.price?.toLocaleString('ko-KR')}원
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상품 카루셀 */}
      <div style={{
        display: 'flex', gap: 10, padding: '0 16px',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x mandatory',
        paddingBottom: 12,
      }}>
        {liveProducts.map((p) => (
          <LiveProductCard
            key={p.id}
            product={p}
            isCurrent={p.id === session.currentProductId}
            orderCount={orderCountMap[p.id] || 0}
            onSelect={setCurrentProduct}
          />
        ))}
      </div>

      {/* 이전/다음 버튼 */}
      <div style={{
        display: 'flex', gap: 12, padding: '12px 16px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}>
        <button
          onClick={prevProduct}
          style={{
            flex: 1, padding: '16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.1)', color: 'white',
            fontSize: '1rem', fontWeight: 700, minHeight: 56,
          }}
        >
          &#9664; 이전
        </button>
        <button
          onClick={nextProduct}
          style={{
            flex: 1, padding: '16px', borderRadius: 12,
            background: 'var(--color-pink)', color: 'white',
            fontSize: '1rem', fontWeight: 700, minHeight: 56,
            boxShadow: '0 4px 12px rgba(255,75,110,0.4)',
          }}
        >
          다음 &#9654;
        </button>
      </div>

      {/* QuickAdd FAB */}
      <FAB onClick={() => setQuickAddOpen(true)} />
      {quickAddOpen && (
        <QuickAdd onClose={() => setQuickAddOpen(false)} onSuccess={() => {}} />
      )}
    </div>
  );
}
