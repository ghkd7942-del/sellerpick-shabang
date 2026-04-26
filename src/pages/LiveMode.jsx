import { useState, useMemo, useEffect, useCallback } from 'react';
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
import BottomSheet from '../components/BottomSheet';
import EditShopProduct from '../components/EditShopProduct';
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
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [working, setWorking] = useState(false);

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

  // 라이브 중 next/prev — productOrder 대신 현재 isLive=true 상품 전체로 동작
  // (방송 중 새로 등록한 상품도 자동 포함)
  const liveIds = useMemo(() => liveProducts.map((p) => p.id), [liveProducts]);

  const goNext = useCallback(async () => {
    if (liveIds.length === 0) return;
    const idx = liveIds.indexOf(session?.currentProductId);
    const nextId = liveIds[(idx + 1 + liveIds.length) % liveIds.length];
    if (nextId && nextId !== session?.currentProductId) {
      await setCurrentProduct(nextId);
    }
  }, [liveIds, session?.currentProductId, setCurrentProduct]);

  const goPrev = useCallback(async () => {
    if (liveIds.length === 0) return;
    const idx = liveIds.indexOf(session?.currentProductId);
    const prevId = liveIds[(idx - 1 + liveIds.length) % liveIds.length];
    if (prevId && prevId !== session?.currentProductId) {
      await setCurrentProduct(prevId);
    }
  }, [liveIds, session?.currentProductId, setCurrentProduct]);

  // 현재 상품 빠른 액션
  const handleQuickStockToggle = async () => {
    if (!currentProduct) return;
    setWorking(true);
    try {
      const willSoldOut = (currentProduct.stock ?? 0) > 0;
      await updateDocument('products', currentProduct.id, {
        stock: willSoldOut ? 0 : 99,
      });
      setActionSheetOpen(false);
    } catch (err) {
      alert('처리 실패: ' + err.message);
    }
    setWorking(false);
  };

  const handleRemoveFromLive = async () => {
    if (!currentProduct) return;
    if (!confirm(`"${currentProduct.name}" 을 라이브에서 빼고 쇼핑몰로 이동할까요?`)) return;
    setWorking(true);
    try {
      await updateDocument('products', currentProduct.id, { isLive: false });
      // 다음 상품으로 자동 전환 (있으면)
      const remaining = liveIds.filter((id) => id !== currentProduct.id);
      if (remaining.length > 0) {
        await setCurrentProduct(remaining[0]);
      }
      setActionSheetOpen(false);
    } catch (err) {
      alert('처리 실패: ' + err.message);
    }
    setWorking(false);
  };

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
          <QuickAdd onClose={() => setQuickAddOpen(false)} onSuccess={() => {}} defaultIsLive={true} />
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
        padding: '0 8px 0 4px', height: 56, background: 'rgba(0,0,0,0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* 홈으로 (방송은 백그라운드 유지) */}
          <button
            onClick={() => navigate('/admin')}
            aria-label="홈으로"
            title="방송 유지하고 홈으로"
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', color: 'white',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.125rem',
            }}
          >
            ←
          </button>
          <span className="live-dot" style={{ background: '#FF4B6E', marginLeft: 6 }} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginLeft: 4 }}>LIVE</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', marginLeft: 4 }}>{elapsed}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

      {/* 현재 상품 히어로 — 탭하면 빠른 액션 시트 */}
      {currentProduct && (
        <div style={{ padding: '20px 16px' }}>
          <button
            onClick={() => setActionSheetOpen(true)}
            style={{
              borderRadius: 16, overflow: 'hidden',
              background: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              padding: 0, border: 'none', cursor: 'pointer',
              width: '100%', textAlign: 'left',
            }}
          >
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
              {(currentProduct.stock ?? 0) === 0 && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#7F1D1D', color: 'white',
                  padding: '6px 12px', borderRadius: 8,
                  fontSize: '0.8125rem', fontWeight: 700,
                }}>
                  품절
                </div>
              )}
              {orderCountMap[currentProduct.id] > 0 && (currentProduct.stock ?? 0) > 0 && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(0,0,0,0.7)', color: 'white',
                  padding: '6px 12px', borderRadius: 8,
                  fontSize: '0.8125rem', fontWeight: 700,
                }}>
                  &#128717; {orderCountMap[currentProduct.id]}건
                </div>
              )}
              {/* 탭 hint */}
              <div style={{
                position: 'absolute', bottom: 12, right: 12,
                background: 'rgba(0,0,0,0.6)', color: 'white',
                padding: '4px 10px', borderRadius: 9999,
                fontSize: '0.6875rem', fontWeight: 600,
              }}>
                탭하여 관리 ✨
              </div>
            </div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{currentProduct.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-pink)' }}>
                  {currentProduct.price?.toLocaleString('ko-KR')}원
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                  재고 {currentProduct.stock ?? 0}
                </div>
              </div>
            </div>
          </button>
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
            onSelect={(id) => {
              // 이미 현재 상품이면 → 액션 시트(수정/매진/빼기)
              // 다른 상품이면 → 그 상품을 현재로 전환
              if (id === session?.currentProductId) {
                setActionSheetOpen(true);
              } else {
                setCurrentProduct(id);
              }
            }}
          />
        ))}
      </div>

      {/* 이전/다음 버튼 */}
      <div style={{
        display: 'flex', gap: 12, padding: '12px 16px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
      }}>
        <button
          onClick={goPrev}
          disabled={liveIds.length <= 1}
          style={{
            flex: 1, padding: '16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.1)', color: 'white',
            fontSize: '1rem', fontWeight: 700, minHeight: 56,
            opacity: liveIds.length <= 1 ? 0.4 : 1,
            cursor: liveIds.length <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          &#9664; 이전
        </button>
        <button
          onClick={goNext}
          disabled={liveIds.length <= 1}
          style={{
            flex: 1, padding: '16px', borderRadius: 12,
            background: 'var(--color-pink)', color: 'white',
            fontSize: '1rem', fontWeight: 700, minHeight: 56,
            boxShadow: '0 4px 12px rgba(255,75,110,0.4)',
            opacity: liveIds.length <= 1 ? 0.5 : 1,
            cursor: liveIds.length <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          다음 &#9654;
        </button>
      </div>

      {/* QuickAdd FAB */}
      <FAB onClick={() => setQuickAddOpen(true)} />
      {quickAddOpen && (
        <QuickAdd onClose={() => setQuickAddOpen(false)} onSuccess={() => {}} defaultIsLive={true} />
      )}

      {/* 현재 상품 빠른 액션 시트 */}
      <BottomSheet
        isOpen={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        title={currentProduct?.name || '상품 관리'}
      >
        {currentProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
            <div style={{
              padding: '10px 12px', background: 'var(--color-gray-50)',
              borderRadius: 10, fontSize: '0.8125rem', color: 'var(--color-gray-700)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>가격</span>
                <strong>{currentProduct.price?.toLocaleString('ko-KR')}원</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span>재고</span>
                <strong style={{
                  color: (currentProduct.stock ?? 0) === 0 ? '#991B1B' : 'var(--color-gray-700)',
                }}>
                  {currentProduct.stock ?? 0}개
                </strong>
              </div>
            </div>

            {/* 매진 / 매진 해제 */}
            <button
              onClick={handleQuickStockToggle}
              disabled={working}
              style={liveActionBtn(
                (currentProduct.stock ?? 0) > 0 ? '#FEE2E2' : '#D1FAE5',
                (currentProduct.stock ?? 0) > 0 ? '#991B1B' : '#065F46',
              )}
            >
              <span style={{ fontSize: '1.25rem' }}>{(currentProduct.stock ?? 0) > 0 ? '🚫' : '✅'}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>
                {(currentProduct.stock ?? 0) > 0 ? '품절 처리' : '품절 해제 (재고 99로)'}
              </span>
            </button>

            {/* 상품 수정 (정식 폼) */}
            <button
              onClick={() => { setActionSheetOpen(false); setEditProduct(currentProduct); }}
              disabled={working}
              style={liveActionBtn('white', 'var(--color-gray-900)', true)}
            >
              <span style={{ fontSize: '1.25rem' }}>📝</span>
              <span style={{ flex: 1, textAlign: 'left' }}>상품 수정 (이름·가격·재고·옵션)</span>
              <span style={{ color: 'var(--color-gray-400)' }}>›</span>
            </button>

            {/* 라이브에서 빼기 */}
            <button
              onClick={handleRemoveFromLive}
              disabled={working}
              style={liveActionBtn('white', '#92400E', true)}
            >
              <span style={{ fontSize: '1.25rem' }}>🛍</span>
              <span style={{ flex: 1, textAlign: 'left' }}>라이브에서 빼고 쇼핑몰로</span>
              <span style={{ color: 'var(--color-gray-400)' }}>›</span>
            </button>

            <button
              onClick={() => setActionSheetOpen(false)}
              style={{
                width: '100%', padding: 10, fontSize: '0.8125rem',
                color: 'var(--color-gray-500)', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        )}
      </BottomSheet>

      {/* 정식 수정 시트 */}
      <BottomSheet
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        title="상품 수정"
      >
        {editProduct && (
          <EditShopProduct product={editProduct} onClose={() => setEditProduct(null)} />
        )}
      </BottomSheet>
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

function liveActionBtn(bg, color, withBorder = false) {
  return {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 14px', minHeight: 56,
    borderRadius: 12,
    border: withBorder ? '1px solid var(--color-gray-200)' : 'none',
    background: bg, color, fontSize: '0.9375rem', fontWeight: 600,
    cursor: 'pointer',
  };
}
