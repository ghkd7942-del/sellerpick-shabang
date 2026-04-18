import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import useOrders from '../hooks/useOrders';
import useLiveSession from '../hooks/useLiveSession';
import useOrderNotification from '../hooks/useOrderNotification';
import { updateDocument } from '../lib/firestoreAPI';
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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [starting, setStarting] = useState(false);

  // 상품이 로드되면 라이브 상품은 기본 선택
  useEffect(() => {
    if (products.length > 0 && selectedIds.size === 0) {
      const initial = new Set(products.filter((p) => p.isLive).map((p) => p.id));
      if (initial.size > 0) setSelectedIds(initial);
    }
  }, [products, selectedIds.size]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          padding: '20px 16px 120px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>&#128308;</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 4 }}>라이브 방송 준비</h2>
            <p style={{ color: 'var(--color-gray-500)', fontSize: '0.8125rem', marginTop: 2 }}>
              방송할 상품을 선택하세요
            </p>
          </div>

          {/* 유튜브 링크 입력 */}
          <div style={{ textAlign: 'left' }}>
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

          {/* 상품 선택 */}
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 8,
            }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-gray-700)' }}>
                방송 상품 선택
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setSelectedIds(new Set(products.map((p) => p.id)))}
                  style={pickBtnStyle}
                >
                  전체
                </button>
                <button
                  onClick={() => setSelectedIds(new Set(products.filter((p) => p.isLive).map((p) => p.id)))}
                  style={pickBtnStyle}
                >
                  라이브 상품만
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  style={pickBtnStyle}
                >
                  해제
                </button>
              </div>
            </div>

            {products.length === 0 ? (
              <div style={{
                padding: 24, textAlign: 'center', borderRadius: 10,
                background: 'var(--color-gray-50)',
                color: 'var(--color-gray-500)', fontSize: '0.8125rem',
              }}>
                등록된 상품이 없어요
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {products.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      style={{
                        display: 'flex', gap: 12, padding: '10px 12px',
                        background: isSelected ? '#FFF0F3' : 'white',
                        border: '1.5px solid',
                        borderColor: isSelected ? 'var(--color-pink)' : 'var(--color-gray-200)',
                        borderRadius: 10, textAlign: 'left',
                        cursor: 'pointer', alignItems: 'center',
                      }}
                    >
                      <span style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        border: '2px solid',
                        borderColor: isSelected ? 'var(--color-pink)' : 'var(--color-gray-300)',
                        background: isSelected ? 'var(--color-pink)' : 'white',
                        color: 'white', fontSize: '0.75rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected ? '✓' : ''}
                      </span>
                      <div style={{
                        width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                        background: p.imageUrl
                          ? `url(${p.imageUrl}) center/cover`
                          : 'var(--color-gray-200)',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.875rem', fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {p.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem', color: 'var(--color-pink)', fontWeight: 700,
                          marginTop: 2,
                        }}>
                          {p.price?.toLocaleString('ko-KR')}원
                        </div>
                      </div>
                      {p.isLive ? (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700,
                          background: '#D1FAE5', color: '#065F46',
                          padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                        }}>LIVE</span>
                      ) : (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700,
                          background: 'var(--color-gray-100)', color: 'var(--color-gray-700)',
                          padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                        }}>쇼핑몰</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 하단 방송 시작 버튼 */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          maxWidth: 430, margin: '0 auto',
          padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          background: 'white', borderTop: '1px solid var(--color-gray-200)',
        }}>
          <button
            onClick={async () => {
              if (starting) return;
              if (selectedIds.size === 0) {
                alert('방송 상품을 한 개 이상 선택해주세요.');
                return;
              }
              setStarting(true);
              try {
                // 선택된 쇼핑몰 상품은 isLive=true로 승격
                const toPromote = products.filter(
                  (p) => selectedIds.has(p.id) && !p.isLive
                );
                if (toPromote.length > 0) {
                  await Promise.all(
                    toPromote.map((p) => updateDocument('products', p.id, { isLive: true }))
                  );
                }
                const id = youtubeInput.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1] || youtubeInput.trim();
                await startSession([...selectedIds], id);
              } catch (err) {
                alert('방송 시작 실패: ' + err.message);
              }
              setStarting(false);
            }}
            disabled={selectedIds.size === 0 || starting}
            style={{
              width: '100%', padding: '16px', borderRadius: 16,
              background: selectedIds.size === 0 ? 'var(--color-gray-200)' : 'var(--color-pink)',
              color: 'white',
              fontSize: '1.125rem', fontWeight: 700, minHeight: 56,
              border: 'none',
              boxShadow: selectedIds.size === 0 ? 'none' : '0 4px 16px rgba(255,75,110,0.4)',
              cursor: selectedIds.size === 0 || starting ? 'not-allowed' : 'pointer',
              opacity: starting ? 0.7 : 1,
            }}
          >
            {starting
              ? '방송 준비 중...'
              : `🔴 방송 시작${selectedIds.size > 0 ? ` · ${selectedIds.size}개 상품` : ''}`}
          </button>
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

const pickBtnStyle = {
  fontSize: '0.6875rem', fontWeight: 700,
  padding: '4px 10px', borderRadius: 6,
  border: '1px solid var(--color-gray-200)',
  background: 'white', color: 'var(--color-gray-700)',
  cursor: 'pointer', minHeight: 28,
};
