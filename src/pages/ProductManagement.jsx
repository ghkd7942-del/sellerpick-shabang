import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateDocument, deleteDocument } from '../lib/firestoreAPI';
import useProducts from '../hooks/useProducts';
import useOrders from '../hooks/useOrders';
import BottomSheet from '../components/BottomSheet';
import ProductForm from '../components/ProductForm';
import ShopProductForm from '../components/ShopProductForm';
import ProductDetailView from '../components/ProductDetailView';
import EditShopProduct from '../components/EditShopProduct';
import ViewSwitcher from '../components/ViewSwitcher';
import FAB from '../components/FAB';
import BottomTabBar from '../components/BottomTabBar';
import '../styles/admin.css';

const CATEGORIES = ['전체', '의류', '잡화', '뷰티', '식품·건강', '침구·생활', '기타'];
// 카테고리 외 '특수 필터' — 저재고/품절/숨김
const SPECIAL_FILTERS = [
  { key: 'lowStock', label: '저재고', emoji: '⚠️' },
  { key: 'soldOut', label: '품절', emoji: '🚫' },
  { key: 'hidden', label: '숨김', emoji: '👻' },
];
const LOW_STOCK_THRESHOLD = 10;

export default function ProductManagement() {
  const navigate = useNavigate();
  const { products, loading, refetch } = useProducts();
  const { orders } = useOrders(200);
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [editProduct, setEditProduct] = useState(null);
  const [cloneProduct, setCloneProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [shopFormOpen, setShopFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

  const todayOrderCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter((o) => {
      const t = o.createdAt?.toDate?.() || new Date(o.createdAt);
      return t >= today;
    }).length;
  }, [orders]);

  const filtered = useMemo(() => {
    let base;
    // 특수 필터: 저재고/품절/숨김
    if (filter === 'lowStock') {
      base = products.filter((p) => !p.hidden && (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD);
    } else if (filter === 'soldOut') {
      base = products.filter((p) => !p.hidden && (p.stock ?? 0) === 0);
    } else if (filter === 'hidden') {
      base = products.filter((p) => p.hidden === true);
    } else if (filter === '전체') {
      // '전체'는 숨김 제외 (관리 포커스가 활성 상품)
      base = products.filter((p) => !p.hidden);
    } else {
      base = products.filter((p) => p.category === filter && !p.hidden);
    }
    const q = search.trim().toLowerCase();
    const bySearch = !q ? base : base.filter((p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.tags || []).some((t) => String(t).toLowerCase().includes(q))
    );
    const sorted = [...bySearch];
    const ts = (p) => {
      const v = p.createdAt;
      if (!v) return 0;
      if (typeof v?.toDate === 'function') return v.toDate().getTime();
      const t = new Date(v).getTime();
      return isNaN(t) ? 0 : t;
    };
    switch (sortBy) {
      case 'stockAsc':
        sorted.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
        break;
      case 'priceAsc':
        sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'priceDesc':
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => ts(b) - ts(a));
        break;
    }
    return sorted;
  }, [products, filter, search, sortBy]);

  const toggleLive = async (product) => {
    await updateDocument('products', product.id, { isLive: !product.isLive });
    refetch();
  };

  const handleDelete = async (product) => {
    if (!confirm(`"${product.name}" 상품을 삭제할까요?`)) return;
    await deleteDocument('products', product.id);
    refetch();
  };

  // 벌크 선택 헬퍼
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());
  const selectAllVisible = () => setSelectedIds(new Set(filtered.map((p) => p.id)));
  const selectedProducts = filtered.filter((p) => selectedIds.has(p.id));

  // 벌크 액션
  const applyBulk = async (kind) => {
    if (selectedProducts.length === 0) return;

    if (kind === 'delete') {
      if (!confirm(`선택한 ${selectedProducts.length}개 상품을 삭제할까요? 되돌릴 수 없어요.`)) return;
    }

    setBulkWorking(true);
    let success = 0;
    try {
      for (const p of selectedProducts) {
        try {
          if (kind === 'liveOn') {
            await updateDocument('products', p.id, { isLive: true });
          } else if (kind === 'liveOff') {
            await updateDocument('products', p.id, { isLive: false });
          } else if (kind === 'hide') {
            await updateDocument('products', p.id, { hidden: true });
          } else if (kind === 'unhide') {
            await updateDocument('products', p.id, { hidden: false });
          } else if (kind === 'delete') {
            await deleteDocument('products', p.id);
          }
          success++;
        } catch (e) {
          console.warn('bulk fail', p.id, e);
        }
      }
    } finally {
      setBulkWorking(false);
    }
    clearSelection();
    refetch();
    alert(`처리 완료: ${success}/${selectedProducts.length}건`);
  };

  // 숨김 상품은 별도 카운트 — "전체"에서 제외되므로 뱃지로 따로 표시
  const hiddenCount = products.filter((p) => p.hidden === true).length;
  const activeProducts = products.filter((p) => !p.hidden);
  const liveCount = activeProducts.filter((p) => p.isLive).length;
  const soldOutCount = activeProducts.filter((p) => (p.stock || 0) === 0).length;
  const lowStockCount = activeProducts.filter(
    (p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= LOW_STOCK_THRESHOLD,
  ).length;
  const pendingOrderCount = orders.filter(
    (o) => o.status === 'new' || o.status === 'paid'
  ).length;

  return (
    <div className="admin-container">
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 56, background: 'white',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>상품 관리</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)' }}>
            {products.length}개 · 라이브 {liveCount}
          </span>
          <ViewSwitcher />
        </div>
      </header>

      {/* 요약 카드 */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px 0',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        <div style={miniCard}>
          <div style={miniLabel}>전체 상품</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeProducts.length}</div>
        </div>
        <div style={miniCard}>
          <div style={miniLabel}>라이브</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-pink)' }}>{liveCount}</div>
        </div>
        <div
          style={{ ...miniCard, cursor: lowStockCount > 0 ? 'pointer' : 'default' }}
          onClick={() => lowStockCount > 0 && setFilter('lowStock')}
        >
          <div style={miniLabel}>저재고</div>
          <div style={{
            fontSize: '1.25rem', fontWeight: 700,
            color: lowStockCount > 0 ? '#D97706' : 'var(--color-gray-400)',
          }}>{lowStockCount}</div>
        </div>
        <div
          style={{ ...miniCard, cursor: soldOutCount > 0 ? 'pointer' : 'default' }}
          onClick={() => soldOutCount > 0 && setFilter('soldOut')}
        >
          <div style={miniLabel}>품절</div>
          <div style={{
            fontSize: '1.25rem', fontWeight: 700,
            color: soldOutCount > 0 ? 'var(--color-pink)' : 'var(--color-gray-400)',
          }}>{soldOutCount}</div>
        </div>
        <div
          style={{ ...miniCard, cursor: 'pointer' }}
          onClick={() => navigate('/admin/orders')}
        >
          <div style={miniLabel}>대기 주문</div>
          <div style={{
            fontSize: '1.25rem', fontWeight: 700,
            color: pendingOrderCount > 0 ? 'var(--color-teal)' : 'var(--color-gray-400)',
          }}>{pendingOrderCount}</div>
        </div>
      </div>

      {/* 저재고 경고 배너 — 있을 때만 */}
      {lowStockCount > 0 && filter !== 'lowStock' && (
        <div style={{ padding: '10px 16px 0' }}>
          <button
            onClick={() => setFilter('lowStock')}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              background: '#FFFBEB', border: '1px solid #FDE68A',
              color: '#92400E', display: 'flex', alignItems: 'center', gap: 10,
              minHeight: 44, cursor: 'pointer', textAlign: 'left',
              fontSize: '0.8125rem', fontWeight: 600,
            }}
          >
            <span style={{ fontSize: '1.125rem' }}>⚠️</span>
            <span style={{ flex: 1 }}>
              재고 {LOW_STOCK_THRESHOLD}개 이하 상품 {lowStockCount}개가 있어요
            </span>
            <span style={{ fontSize: '0.75rem', color: '#D97706' }}>보기 →</span>
          </button>
        </div>
      )}

      {/* 오늘 주문 프린팅 배너 */}
      <div style={{ padding: '12px 16px 0' }}>
        <button
          onClick={() => navigate('/admin/print')}
          disabled={todayOrderCount === 0}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12,
            background: todayOrderCount === 0
              ? 'var(--color-gray-100)'
              : 'linear-gradient(135deg, #FF4B6E, #FF8C00)',
            color: todayOrderCount === 0 ? 'var(--color-gray-400)' : 'white',
            border: 'none',
            cursor: todayOrderCount === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            minHeight: 52, textAlign: 'left',
            boxShadow: todayOrderCount === 0 ? 'none' : '0 4px 12px rgba(255,75,110,0.25)',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🖨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
              오늘 주문 전체 프린팅
            </div>
            <div style={{ fontSize: '0.6875rem', opacity: 0.85, marginTop: 1 }}>
              {todayOrderCount > 0
                ? `오늘 주문 ${todayOrderCount}건 · 탭해서 라벨 인쇄`
                : '오늘 주문이 아직 없어요'}
            </div>
          </div>
          {todayOrderCount > 0 && (
            <span style={{
              background: 'rgba(255,255,255,0.25)',
              padding: '4px 12px', borderRadius: 9999,
              fontSize: '0.875rem', fontWeight: 700,
            }}>
              {todayOrderCount}건
            </span>
          )}
        </button>
      </div>

      {/* 검색창 + 정렬 */}
      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.9375rem', color: 'var(--color-gray-400)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="상품명·설명·태그 검색"
            style={{
              width: '100%', padding: '10px 38px 10px 38px',
              border: '1px solid var(--color-gray-200)', borderRadius: 10,
              fontSize: '0.875rem', outline: 'none', minHeight: 40,
              background: 'white',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="검색어 지우기"
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 28, height: 28, borderRadius: '50%',
                border: 'none', background: 'var(--color-gray-100)',
                color: 'var(--color-gray-500)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem',
              }}
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="정렬"
          style={{
            flexShrink: 0, padding: '0 10px', minHeight: 40,
            border: '1px solid var(--color-gray-200)', borderRadius: 10,
            fontSize: '0.8125rem', background: 'white',
            color: 'var(--color-gray-700)', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="newest">최신순</option>
          <option value="stockAsc">재고 적은 순</option>
          <option value="priceAsc">가격 낮은 순</option>
          <option value="priceDesc">가격 높은 순</option>
        </select>
      </div>

      {/* 카테고리 필터 */}
      <div style={{
        display: 'flex', gap: 0, padding: '12px 16px 0',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              flex: '0 0 auto', padding: '8px 14px',
              fontSize: '0.8125rem', fontWeight: filter === cat ? 700 : 400,
              color: filter === cat ? 'var(--color-pink)' : 'var(--color-gray-500)',
              borderBottom: filter === cat ? '2px solid var(--color-pink)' : '2px solid transparent',
              background: 'none', cursor: 'pointer', minHeight: 40, whiteSpace: 'nowrap',
            }}
          >
            {cat}
            {cat !== '전체' && (
              <span style={{ marginLeft: 4, fontSize: '0.6875rem' }}>
                {activeProducts.filter((p) => p.category === cat).length}
              </span>
            )}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--color-gray-200)', margin: '8px 6px', flexShrink: 0 }} />
        {SPECIAL_FILTERS.map((s) => {
          const count = s.key === 'lowStock' ? lowStockCount
            : s.key === 'soldOut' ? soldOutCount
              : hiddenCount;
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              style={{
                flex: '0 0 auto', padding: '8px 12px',
                fontSize: '0.8125rem', fontWeight: filter === s.key ? 700 : 400,
                color: filter === s.key ? 'var(--color-pink)' : 'var(--color-gray-500)',
                borderBottom: filter === s.key ? '2px solid var(--color-pink)' : '2px solid transparent',
                background: 'none', cursor: 'pointer', minHeight: 40, whiteSpace: 'nowrap',
              }}
            >
              <span style={{ marginRight: 4 }}>{s.emoji}</span>
              {s.label}
              <span style={{ marginLeft: 4, fontSize: '0.6875rem' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* 선택 제어 바 */}
      {filtered.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px 0', fontSize: '0.75rem', color: 'var(--color-gray-500)',
        }}>
          <button
            onClick={selectedIds.size > 0 ? clearSelection : selectAllVisible}
            style={{ background: 'none', border: 'none', color: 'var(--color-gray-700)', cursor: 'pointer', fontWeight: 600 }}
          >
            {selectedIds.size > 0 ? '선택 해제' : '전체 선택'}
          </button>
          <span>{filtered.length}개</span>
        </div>
      )}

      {/* 상품 목록 */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: selectedIds.size > 0
          ? 'calc(140px + env(safe-area-inset-bottom, 0px))'
          : 'calc(76px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            로딩 중...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
              {search.trim() ? '🔎' : '\u{1F4E6}'}
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-gray-700)' }}>
              {search.trim() ? '검색 결과가 없어요' : '등록된 상품이 없어요'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
              {search.trim() ? `"${search.trim()}"에 해당하는 상품을 찾을 수 없어요` : '+ 버튼으로 상품을 등록해보세요'}
            </div>
          </div>
        ) : (
          filtered.map((product) => {
            const selected = selectedIds.has(product.id);
            const isHidden = product.hidden === true;
            return (
            <div
              key={product.id}
              style={{
                background: 'white', borderRadius: 12, padding: '12px 14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                opacity: product.isLive || isHidden ? 1 : 0.6,
                border: selected ? '1.5px solid var(--color-pink)' : '1.5px solid transparent',
                filter: isHidden ? 'grayscale(0.3)' : 'none',
              }}
            >
              {/* 체크박스 + 썸네일 + 정보 */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <button
                  onClick={() => toggleSelect(product.id)}
                  aria-label={selected ? '선택 해제' : '선택'}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    marginTop: 4,
                    border: '2px solid',
                    borderColor: selected ? 'var(--color-pink)' : 'var(--color-gray-300)',
                    background: selected ? 'var(--color-pink)' : 'white',
                    color: 'white', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {selected ? '✓' : ''}
                </button>
              <button
                onClick={() => setDetailProduct(product)}
                style={{
                  display: 'flex', gap: 12, flex: 1, minWidth: 0,
                  padding: 0, background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                {/* 썸네일 */}
                <div style={{
                  width: 64, height: 64, borderRadius: 10, flexShrink: 0,
                  background: product.imageUrl
                    ? `url(${product.imageUrl}) center/cover`
                    : 'var(--color-gray-200)',
                }} />

                {/* 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 6 }}>
                    <div style={{
                      fontSize: '0.9375rem', fontWeight: 700,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {product.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {(product.stock ?? 0) === 0 ? (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700,
                          background: '#FEE2E2', color: '#991B1B',
                          padding: '2px 6px', borderRadius: 4,
                        }}>
                          품절
                        </span>
                      ) : (product.stock ?? 0) <= LOW_STOCK_THRESHOLD && (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700,
                          background: '#FEF3C7', color: '#92400E',
                          padding: '2px 6px', borderRadius: 4,
                        }}>
                          재고부족
                        </span>
                      )}
                      {product.isLive && (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700,
                          background: '#D1FAE5', color: '#065F46',
                          padding: '2px 6px', borderRadius: 4,
                        }}>
                          LIVE
                        </span>
                      )}
                      <span style={{ color: 'var(--color-gray-300)', fontSize: '1rem' }}>›</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-pink)', marginTop: 2 }}>
                    {product.price?.toLocaleString('ko-KR')}원
                    {Array.isArray(product.variants) && product.variants.length > 0 && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--color-gray-500)', marginLeft: 4 }}>
                        부터
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                    {product.category && <span>{product.category}</span>}
                    <span>
                      총 재고 <strong style={{
                        color: (product.stock ?? 0) === 0
                          ? '#991B1B'
                          : (product.stock ?? 0) <= LOW_STOCK_THRESHOLD
                            ? '#92400E'
                            : 'var(--color-gray-700)',
                      }}>{product.stock ?? 0}</strong>
                    </span>
                    {Array.isArray(product.variants) && product.variants.length > 0 && (
                      <span>옵션 {product.variants.length}</span>
                    )}
                    {isHidden && (
                      <span style={{
                        background: 'var(--color-gray-200)', color: 'var(--color-gray-700)',
                        padding: '1px 6px', borderRadius: 4, fontSize: '0.625rem', fontWeight: 700,
                      }}>
                        숨김
                      </span>
                    )}
                  </div>
                </div>
              </button>
              </div>

              {/* 액션 버튼 */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => toggleLive(product)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8,
                    fontSize: '0.75rem', fontWeight: 600, minHeight: 40,
                    border: '1px solid',
                    borderColor: product.isLive ? 'var(--color-gray-200)' : 'var(--color-mint)',
                    background: product.isLive ? 'white' : 'var(--color-mint)',
                    color: product.isLive ? 'var(--color-gray-700)' : 'white',
                    cursor: 'pointer',
                  }}
                  title="라이브몰/쇼핑몰 선택"
                >
                  {product.isLive ? '🛍 쇼핑몰로' : '🔴 라이브몰로'}
                </button>
                <button
                  onClick={() => setEditProduct(product)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8,
                    fontSize: '0.75rem', fontWeight: 600, minHeight: 40,
                    border: '1px solid var(--color-gray-200)',
                    background: 'white', color: 'var(--color-gray-700)', cursor: 'pointer',
                  }}
                >
                  수정
                </button>
                <button
                  onClick={() => navigate(`/shop/샤방이/product/${product.id}`)}
                  aria-label="고객 미리보기"
                  title="고객 미리보기"
                  style={{
                    padding: '8px 12px', borderRadius: 8,
                    fontSize: '0.9375rem', minHeight: 40,
                    border: '1px solid var(--color-gray-200)',
                    background: 'white', color: 'var(--color-gray-700)', cursor: 'pointer',
                  }}
                >
                  👀
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  aria-label="삭제"
                  title="삭제"
                  style={{
                    padding: '8px 12px', borderRadius: 8,
                    fontSize: '0.9375rem', minHeight: 40,
                    border: '1px solid #FEE2E2',
                    background: '#FEF2F2', color: '#991B1B', cursor: 'pointer',
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* 상세 바텀시트 */}
      <BottomSheet
        isOpen={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        title="상품 상세"
      >
        {detailProduct && (
          <ProductDetailView
            product={detailProduct}
            onEdit={() => {
              setEditProduct(detailProduct);
              setDetailProduct(null);
            }}
            onClone={() => {
              setCloneProduct(detailProduct);
              setDetailProduct(null);
            }}
          />
        )}
      </BottomSheet>

      {/* 수정 바텀시트 */}
      <BottomSheet
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        title="상품 수정"
      >
        {editProduct && (
          <EditShopProduct
            product={editProduct}
            onClose={() => setEditProduct(null)}
          />
        )}
      </BottomSheet>

      {/* 복제 바텀시트 */}
      <BottomSheet
        isOpen={!!cloneProduct}
        onClose={() => setCloneProduct(null)}
        title="상품 복제"
      >
        {cloneProduct && (
          <EditShopProduct
            product={cloneProduct}
            mode="clone"
            onClose={() => setCloneProduct(null)}
          />
        )}
      </BottomSheet>

      {/* 벌크 액션바 */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', left: 0, right: 0,
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          maxWidth: 430, margin: '0 auto', zIndex: 60,
          padding: '10px 12px', background: 'white',
          borderTop: '1px solid var(--color-gray-200)',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
              {selectedIds.size}개 선택됨
            </span>
            <button
              onClick={clearSelection}
              style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              해제
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            <button onClick={() => applyBulk('liveOn')} disabled={bulkWorking} style={bulkBtnStyle('#EC4899')}>🔴 라이브 ON</button>
            <button onClick={() => applyBulk('liveOff')} disabled={bulkWorking} style={bulkBtnStyle('#64748B')}>🛍 쇼핑몰</button>
            {filter === 'hidden' ? (
              <button onClick={() => applyBulk('unhide')} disabled={bulkWorking} style={bulkBtnStyle('#10B981')}>👁 숨김 해제</button>
            ) : (
              <button onClick={() => applyBulk('hide')} disabled={bulkWorking} style={bulkBtnStyle('#94A3B8')}>👻 숨기기</button>
            )}
            <button onClick={() => applyBulk('delete')} disabled={bulkWorking} style={bulkBtnStyle('#EF4444')}>🗑 삭제</button>
          </div>
        </div>
      )}

      {/* 쇼핑몰 상품 등록 — 정식 폼 (옵션·상세이미지 포함) */}
      <FAB onClick={() => setShopFormOpen(true)} />
      {shopFormOpen && (
        <ShopProductForm
          onClose={() => setShopFormOpen(false)}
          onSuccess={() => { setShopFormOpen(false); refetch(); }}
        />
      )}
      <BottomTabBar />
    </div>
  );
}

function EditForm({ product, onClose }) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [options, setOptions] = useState(product.options || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument('products', product.id, {
        name,
        price: parseInt(price.replace(/[^0-9]/g, ''), 10) || 0,
        stock: parseInt(stock, 10) || 0,
        options,
      });
      onClose();
    } catch (err) {
      alert('수정 실패: ' + err.message);
    }
    setSaving(false);
  };

  const formatPrice = (val) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('ko-KR');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 16 }}>
      <div>
        <label style={labelStyle}>상품명</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>판매가</label>
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...inputStyle, paddingRight: 36 }}
            inputMode="numeric"
            value={formatPrice(price)}
            onChange={(e) => setPrice(e.target.value)}
          />
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-gray-500)', fontSize: '0.875rem',
          }}>원</span>
        </div>
      </div>
      <div>
        <label style={labelStyle}>재고 수량</label>
        <input
          style={inputStyle}
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>
      <div>
        <label style={labelStyle}>옵션</label>
        <input style={inputStyle} placeholder="예) S, M, L, XL" value={options} onChange={(e) => setOptions(e.target.value)} />
      </div>
      <button
        className="btn-primary"
        onClick={handleSave}
        disabled={saving || !name || !price}
        style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8, opacity: saving ? 0.6 : 1 }}
      >
        {saving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  );
}

const miniCard = {
  flex: '0 0 auto', minWidth: 72,
  background: 'white', borderRadius: 10, padding: '10px 12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center',
};
const miniLabel = {
  fontSize: '0.6875rem', color: 'var(--color-gray-500)',
  whiteSpace: 'nowrap',
};
function bulkBtnStyle(color) {
  return {
    flex: '1 0 auto', minHeight: 40, padding: '8px 10px',
    borderRadius: 8, border: 'none',
    fontSize: '0.75rem', fontWeight: 700,
    background: color, color: 'white', cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}
const labelStyle = {
  display: 'block', fontSize: '0.8125rem', fontWeight: 600,
  color: 'var(--color-gray-700)', marginBottom: 6,
};
const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1px solid var(--color-gray-200)', borderRadius: 10,
  fontSize: '0.9375rem', outline: 'none', minHeight: 44,
};
