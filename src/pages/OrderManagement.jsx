import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateDocument, getDocument } from '../lib/firestoreAPI';
import useOrders from '../hooks/useOrders';
import BottomTabBar from '../components/BottomTabBar';
import BottomSheet from '../components/BottomSheet';
import { COURIERS } from '../lib/couriers';
import { notifyPaymentConfirmed, notifyShippingStarted } from '../lib/alimtalk';
import '../styles/admin.css';

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'new', label: '신규' },
  { key: 'paid', label: '입금완료' },
  { key: 'shipping', label: '배송중' },
  { key: 'done', label: '완료' },
  { key: 'cancelled', label: '취소' },
  { key: 'refund_pending', label: '환불중' },
  { key: 'refunded', label: '환불완료' },
];

const STATUS_CONFIG = {
  pending_payment: { label: '결제대기', bg: '#FEF3C7', color: '#92400E' },
  new: { label: '새주문', bg: '#FEF3C7', color: '#92400E' },
  paid: { label: '입금완료', bg: '#D1FAE5', color: '#065F46' },
  shipping: { label: '배송중', bg: '#DBEAFE', color: '#1E40AF' },
  done: { label: '완료', bg: 'var(--color-gray-100)', color: 'var(--color-gray-500)' },
  cancelled: { label: '취소', bg: '#FEE2E2', color: '#991B1B' },
  refund_pending: { label: '환불중', bg: '#FEF3C7', color: '#92400E' },
  refunded: { label: '환불완료', bg: 'var(--color-gray-100)', color: 'var(--color-gray-500)' },
};

const NEXT_STATUS = {
  new: { next: 'paid', label: '입금확인' },
  paid: { next: 'shipping', label: '배송시작' },
  shipping: { next: 'done', label: '배송완료' },
};

const DATE_RANGES = [
  { key: 'all', label: '전체' },
  { key: 'today', label: '오늘' },
  { key: '7d', label: '7일' },
  { key: '30d', label: '30일' },
];

// 상태 변경/취소/환불 등 진행 불가한 최종 상태
const TERMINAL_STATUSES = new Set(['cancelled', 'refunded']);

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function toDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts);
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return null;
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function OrderManagement() {
  const navigate = useNavigate();
  const { orders, loading, refetch } = useOrders(300);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [shippingOrder, setShippingOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [bulkAction, setBulkAction] = useState(null); // { type: 'status' | 'cancel', ... }
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const filtered = useMemo(() => {
    const now = Date.now();
    const msDay = 86400000;
    let list = orders;

    // 상태 필터
    if (filter !== 'all') list = list.filter((o) => o.status === filter);

    // 기간 필터
    if (dateRange !== 'all') {
      const cutoff =
        dateRange === 'today' ? startOfDay().getTime()
          : dateRange === '7d' ? now - 7 * msDay
            : dateRange === '30d' ? now - 30 * msDay
              : 0;
      list = list.filter((o) => {
        const d = toDate(o.createdAt);
        return d && d.getTime() >= cutoff;
      });
    }

    // 검색 — 구매자명, 연락처, 상품명
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const hay = `${o.buyerName || ''} ${o.phone || ''} ${o.productName || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [orders, filter, dateRange, search]);

  // 선택된 주문들 (현재 필터 결과 안에 있는 것만)
  const selectedOrders = useMemo(
    () => filtered.filter((o) => selectedIds.has(o.id)),
    [filtered, selectedIds],
  );

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectAllVisible = () => {
    const ids = filtered
      .filter((o) => !TERMINAL_STATUSES.has(o.status))
      .map((o) => o.id);
    setSelectedIds(new Set(ids));
  };

  // 단일 상태 변경
  const handleStatusChange = async (order, nextStatus) => {
    // paid → shipping은 송장 입력 바텀시트
    if (order.status === 'paid' && nextStatus === 'shipping') {
      setShippingOrder(order);
      return;
    }
    setUpdating(order.id);
    try {
      await updateDocument('orders', order.id, { status: nextStatus });
      if (nextStatus === 'paid') {
        notifyPaymentConfirmed(order).catch(() => {});
      }
      refetch();
    } catch (err) {
      alert('상태 변경 실패: ' + err.message);
    }
    setUpdating(null);
  };

  const handleShippingSubmit = async ({ courier, trackingNumber }) => {
    if (!shippingOrder) return;
    setUpdating(shippingOrder.id);
    try {
      await updateDocument('orders', shippingOrder.id, {
        status: 'shipping',
        courier: courier || '',
        trackingNumber: trackingNumber || '',
        shippedAt: new Date(),
      });
      if (trackingNumber) {
        notifyShippingStarted(shippingOrder, courier, trackingNumber).catch(() => {});
      }
      setShippingOrder(null);
      refetch();
    } catch (err) {
      alert('배송 시작 실패: ' + err.message);
    }
    setUpdating(null);
  };

  // 주문 취소/환불 실행
  const executeCancel = async (order, { reason, refundOnly }) => {
    try {
      // 토스 결제 여부는 paymentKey 존재로 견고하게 판별
      // (paymentMethod 필드는 과거 데이터에서 한국어로 저장된 경우가 있을 수 있음)
      if (order.paymentKey && !refundOnly) {
        // 토스 자동 취소 API
        const res = await fetch('/api/toss-cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, cancelReason: reason || '판매자 취소' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || '취소 실패');
        refetch();
        return { ok: true, method: 'toss-auto', data };
      }

      // 무통장 — 수동 환불 대기 상태로 기록 + 재고 복원
      const restockNeeded = !order.shippedAt && order.productId && Number(order.qty) > 0;
      if (restockNeeded) {
        try {
          const p = await getDocument('products', order.productId);
          if (p) {
            await updateDocument('products', order.productId, {
              stock: Number(p.stock || 0) + Number(order.qty),
            });
          }
        } catch (e) {
          console.warn('재고 복원 실패 (주문은 취소 진행)', e);
        }
      }

      await updateDocument('orders', order.id, {
        status: refundOnly ? 'refund_pending' : 'cancelled',
        paymentStatus: refundOnly ? 'refund_pending' : 'cancelled',
        cancelReason: reason || (refundOnly ? '환불 요청' : '판매자 취소'),
        cancelledAt: new Date(),
      });
      refetch();
      return { ok: true, method: 'manual' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // 벌크 상태 변경 (paid, done, cancelled)
  const applyBulk = async (kind) => {
    const targets = selectedOrders;
    if (targets.length === 0) return;

    let success = 0;
    let fail = 0;

    for (const order of targets) {
      if (TERMINAL_STATUSES.has(order.status)) continue;
      try {
        if (kind === 'paid') {
          if (order.status === 'new') {
            await updateDocument('orders', order.id, { status: 'paid' });
            notifyPaymentConfirmed(order).catch(() => {});
            success++;
          }
        } else if (kind === 'done') {
          if (order.status === 'shipping' || order.status === 'paid') {
            await updateDocument('orders', order.id, { status: 'done' });
            success++;
          }
        } else if (kind === 'cancel') {
          const r = await executeCancel(order, { reason: '일괄 취소' });
          if (r.ok) success++; else fail++;
        }
      } catch (err) {
        console.warn('bulk fail', order.id, err);
        fail++;
      }
    }

    clearSelection();
    refetch();
    alert(`처리 완료: 성공 ${success}건${fail ? ` / 실패 ${fail}건` : ''}`);
  };

  return (
    <div className="admin-container">
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '0 16px', height: 56, background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>주문 관리</h1>
        <button
          onClick={() => navigate('/admin/print')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 9999,
            fontSize: '0.8125rem', fontWeight: 700, minHeight: 40,
            background: 'var(--color-pink)', color: 'white',
            border: 'none', cursor: 'pointer',
          }}
        >
          🖨️ 프린트하기
        </button>
      </header>

      {/* 검색 + 기간 */}
      <div style={{
        background: 'white', padding: '10px 16px 8px',
        borderBottom: '1px solid var(--color-gray-100)',
        position: 'sticky', top: 56, zIndex: 49,
      }}>
        <div style={{ position: 'relative' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="구매자명·연락처·상품명 검색"
            style={{
              width: '100%', padding: '10px 38px 10px 14px',
              borderRadius: 10, border: '1px solid var(--color-gray-200)',
              fontSize: '0.875rem', outline: 'none', minHeight: 40,
              background: 'var(--color-gray-50)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                width: 24, height: 24, borderRadius: '50%', background: 'var(--color-gray-300)',
                color: 'white', fontSize: 12, border: 'none', cursor: 'pointer',
              }}
              aria-label="검색 지우기"
            >
              ×
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {DATE_RANGES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDateRange(d.key)}
              style={{
                padding: '6px 12px', borderRadius: 9999,
                fontSize: '0.75rem', fontWeight: 600, minHeight: 32,
                border: '1px solid',
                borderColor: dateRange === d.key ? 'var(--color-pink)' : 'var(--color-gray-200)',
                background: dateRange === d.key ? 'var(--color-pink)' : 'white',
                color: dateRange === d.key ? 'white' : 'var(--color-gray-700)',
                cursor: 'pointer',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 상태 필터 탭 */}
      <div style={{
        display: 'flex', gap: 0, background: 'white',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        borderBottom: '1px solid var(--color-gray-200)',
        position: 'sticky', top: 56 + 86, zIndex: 48,
      }}>
        {FILTERS.map((f) => {
          const count = f.key === 'all'
            ? orders.length
            : orders.filter((o) => o.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                flex: '0 0 auto',
                padding: '12px 14px',
                fontSize: '0.8125rem',
                fontWeight: filter === f.key ? 700 : 400,
                color: filter === f.key ? 'var(--color-pink)' : 'var(--color-gray-500)',
                borderBottom: filter === f.key ? '2px solid var(--color-pink)' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 44,
              }}
            >
              {f.label}
              <span style={{ marginLeft: 4, fontSize: '0.75rem' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* 주문 목록 */}
      <div style={{ padding: '12px 16px', paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        {/* 선택 제어 */}
        {filtered.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.75rem', color: 'var(--color-gray-500)',
            marginBottom: 8, padding: '0 2px',
          }}>
            <button
              onClick={selectedIds.size > 0 ? clearSelection : selectAllVisible}
              style={{ background: 'none', border: 'none', color: 'var(--color-gray-700)', cursor: 'pointer', fontWeight: 600 }}
            >
              {selectedIds.size > 0 ? '선택 해제' : '전체 선택'}
            </button>
            <span>{filtered.length}건</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            로딩 중...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>&#128230;</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gray-700)' }}>
              {search || dateRange !== 'all' || filter !== 'all' ? '조건에 맞는 주문이 없어요' : '아직 주문이 없어요'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
              {search || dateRange !== 'all' || filter !== 'all' ? '필터를 바꿔보세요' : '방송 중에 링크를 공유해보세요!'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
              const action = NEXT_STATUS[order.status];
              const selected = selectedIds.has(order.id);
              const terminal = TERMINAL_STATUSES.has(order.status);

              return (
                <div
                  key={order.id}
                  style={{
                    background: 'white', borderRadius: 12, padding: '14px 16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    border: selected ? '1.5px solid var(--color-pink)' : '1.5px solid transparent',
                    position: 'relative',
                  }}
                >
                  {/* 상단: 체크박스 + 구매자 + 뱃지 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {!terminal && (
                      <button
                        onClick={() => toggleSelect(order.id)}
                        aria-label={selected ? '선택 해제' : '선택'}
                        style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          border: '2px solid',
                          borderColor: selected ? 'var(--color-pink)' : 'var(--color-gray-300)',
                          background: selected ? 'var(--color-pink)' : 'white',
                          color: 'white', fontSize: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {selected ? '✓' : ''}
                      </button>
                    )}
                    <div
                      style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                      onClick={() => setDetailOrder(order)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{order.buyerName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginLeft: 8 }}>{order.phone}</span>
                        </div>
                        <span className="status-badge" style={{ background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 상품 정보 */}
                  <div
                    style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--color-gray-700)', cursor: 'pointer' }}
                    onClick={() => setDetailOrder(order)}
                  >
                    {order.productName}
                    {order.option && <span style={{ color: 'var(--color-gray-500)' }}> · {order.option}</span>}
                    {Number(order.qty) > 1 && <span style={{ color: 'var(--color-gray-500)' }}> · {order.qty}개</span>}
                  </div>

                  {/* 금액 + 시간 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-pink)' }}>
                      {order.price?.toLocaleString('ko-KR')}원
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                      {timeAgo(order.createdAt)}
                    </span>
                  </div>

                  {/* 메모 배지 */}
                  {order.notes && (
                    <div style={{
                      marginTop: 8, padding: '6px 10px', borderRadius: 8,
                      background: '#FFFBEB', fontSize: '0.75rem', color: '#92400E',
                      borderLeft: '3px solid #FBBF24',
                    }}>
                      📝 {order.notes.length > 40 ? order.notes.slice(0, 40) + '...' : order.notes}
                    </div>
                  )}

                  {/* 송장 표시 */}
                  {(order.status === 'shipping' || order.status === 'done') && order.trackingNumber && (
                    <div style={{
                      marginTop: 8, padding: '8px 10px', borderRadius: 8,
                      background: 'var(--color-gray-50)', fontSize: '0.75rem',
                      color: 'var(--color-gray-700)',
                    }}>
                      {COURIERS.find((c) => c.code === order.courier)?.name || '택배'} · {order.trackingNumber}
                    </div>
                  )}

                  {/* 취소/환불 사유 표시 */}
                  {(order.status === 'cancelled' || order.status === 'refund_pending' || order.status === 'refunded') && order.cancelReason && (
                    <div style={{
                      marginTop: 8, padding: '8px 10px', borderRadius: 8,
                      background: '#FEF2F2', fontSize: '0.75rem', color: '#991B1B',
                    }}>
                      사유: {order.cancelReason}
                    </div>
                  )}

                  {/* 상태 변경 버튼 */}
                  {action && (
                    <button
                      onClick={() => handleStatusChange(order, action.next)}
                      disabled={updating === order.id}
                      style={{
                        width: '100%', marginTop: 10, padding: '10px',
                        borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600,
                        minHeight: 44, cursor: 'pointer',
                        background: order.status === 'new' ? 'var(--color-mint)' :
                          order.status === 'paid' ? 'var(--color-teal)' : 'var(--color-gray-200)',
                        color: order.status === 'shipping' ? 'var(--color-gray-700)' : 'white',
                        opacity: updating === order.id ? 0.6 : 1,
                      }}
                    >
                      {updating === order.id ? '처리 중...' : action.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
              {selectedIds.size}건 선택됨
            </span>
            <button
              onClick={clearSelection}
              style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              해제
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => applyBulk('paid')} style={bulkBtn('#10B981')}>입금확인</button>
            <button onClick={() => applyBulk('done')} style={bulkBtn('#3B82F6')}>배송완료</button>
            <button
              onClick={() => {
                if (confirm(`${selectedIds.size}건을 취소할까요? (토스 결제 건은 자동 취소됩니다)`)) {
                  applyBulk('cancel');
                }
              }}
              style={bulkBtn('#EF4444')}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 송장 입력 바텀시트 */}
      <BottomSheet
        isOpen={!!shippingOrder}
        onClose={() => setShippingOrder(null)}
        title="배송 시작"
      >
        {shippingOrder && (
          <ShippingForm
            order={shippingOrder}
            submitting={updating === shippingOrder.id}
            onSubmit={handleShippingSubmit}
            onSkip={() => handleShippingSubmit({ courier: '', trackingNumber: '' })}
          />
        )}
      </BottomSheet>

      {/* 주문 상세 시트 — 메모 편집 + 취소/환불 */}
      <BottomSheet
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title="주문 상세"
      >
        {detailOrder && (
          <OrderDetail
            order={detailOrder}
            onSaveNotes={async (notes) => {
              await updateDocument('orders', detailOrder.id, { notes });
              refetch();
              setDetailOrder({ ...detailOrder, notes });
            }}
            onRequestCancel={() => {
              setCancelTarget(detailOrder);
              setDetailOrder(null);
            }}
            onClose={() => setDetailOrder(null)}
          />
        )}
      </BottomSheet>

      {/* 취소/환불 확인 시트 */}
      <BottomSheet
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title={cancelTarget?.paymentKey ? '결제 취소' : '주문 취소·환불'}
      >
        {cancelTarget && (
          <CancelForm
            order={cancelTarget}
            onSubmit={async ({ reason, refundOnly }) => {
              const r = await executeCancel(cancelTarget, { reason, refundOnly });
              if (!r.ok) {
                alert('취소 실패: ' + r.error);
                return;
              }
              setCancelTarget(null);
              setDetailOrder(null);
            }}
            onClose={() => setCancelTarget(null)}
          />
        )}
      </BottomSheet>

      <BottomTabBar />
    </div>
  );
}

function bulkBtn(color) {
  return {
    flex: 1, minHeight: 44, padding: '10px 8px',
    borderRadius: 8, border: 'none',
    fontSize: '0.8125rem', fontWeight: 700,
    background: color, color: 'white', cursor: 'pointer',
  };
}

function ShippingForm({ order, submitting, onSubmit, onSkip }) {
  const [courier, setCourier] = useState('cj');
  const [trackingNumber, setTrackingNumber] = useState('');

  const canSubmit = !!courier && trackingNumber.trim().length > 0 && !submitting;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 16 }}>
      <div style={{
        padding: '10px 12px', background: 'var(--color-gray-50)', borderRadius: 8,
        fontSize: '0.8125rem', color: 'var(--color-gray-700)',
      }}>
        <div style={{ fontWeight: 700 }}>{order.buyerName}</div>
        <div style={{ marginTop: 2, color: 'var(--color-gray-500)' }}>
          {order.productName}{order.option ? ` · ${order.option}` : ''}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: 6 }}>
          택배사
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COURIERS.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCourier(c.code)}
              style={{
                padding: '8px 12px', borderRadius: 8,
                fontSize: '0.8125rem', fontWeight: 600, minHeight: 40,
                border: '1.5px solid',
                borderColor: courier === c.code ? 'var(--color-pink)' : 'var(--color-gray-200)',
                background: courier === c.code ? 'var(--color-pink)' : 'white',
                color: courier === c.code ? 'white' : 'var(--color-gray-700)',
                cursor: 'pointer',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: 6 }}>
          송장번호
        </label>
        <input
          inputMode="numeric"
          placeholder="숫자만 입력"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value.replace(/[^0-9a-zA-Z-]/g, ''))}
          style={{
            width: '100%', padding: '12px 14px',
            border: '1px solid var(--color-gray-200)', borderRadius: 10,
            fontSize: '0.9375rem', outline: 'none', minHeight: 44,
          }}
        />
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={() => onSubmit({ courier, trackingNumber: trackingNumber.trim() })}
        disabled={!canSubmit}
        style={{
          width: '100%', padding: '14px', fontSize: '1rem', marginTop: 4,
          opacity: canSubmit ? 1 : 0.6,
        }}
      >
        {submitting ? '처리 중...' : '배송 시작'}
      </button>

      <button
        type="button"
        onClick={onSkip}
        disabled={submitting}
        style={{
          width: '100%', padding: '10px', fontSize: '0.8125rem',
          color: 'var(--color-gray-500)', background: 'none', border: 'none',
          cursor: 'pointer', opacity: submitting ? 0.6 : 1,
        }}
      >
        송장번호 없이 배송중으로 변경
      </button>
    </div>
  );
}

function OrderDetail({ order, onSaveNotes, onRequestCancel, onClose }) {
  const [notes, setNotes] = useState(order.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const terminal = TERMINAL_STATUSES.has(order.status);
  const methodLabel =
    order.paymentMethod === 'bank' ? '무통장 입금'
      : order.paymentMethodLabel ? `${order.paymentMethodLabel} (토스)`
      : order.paymentMethod === 'toss' ? '카드·간편결제(토스)'
      : order.paymentMethod || '-';

  const saveNotes = async () => {
    if (notes === (order.notes || '')) return;
    setSavingNotes(true);
    try {
      await onSaveNotes(notes);
    } catch (err) {
      alert('메모 저장 실패: ' + err.message);
    }
    setSavingNotes(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 16 }}>
      <div style={{
        padding: '12px 14px', background: 'var(--color-gray-50)', borderRadius: 10,
        fontSize: '0.8125rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--color-gray-500)' }}>구매자</span>
          <span style={{ fontWeight: 700 }}>{order.buyerName} · {order.phone}</span>
        </div>
        {order.address && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 12 }}>
            <span style={{ color: 'var(--color-gray-500)', flexShrink: 0 }}>배송지</span>
            <span style={{ textAlign: 'right' }}>{order.address}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--color-gray-500)' }}>상품</span>
          <span style={{ fontWeight: 600, textAlign: 'right' }}>
            {order.productName}
            {order.option ? <span style={{ color: 'var(--color-gray-500)' }}> · {order.option}</span> : null}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--color-gray-500)' }}>수량/금액</span>
          <span style={{ fontWeight: 700 }}>{order.qty || 1}개 · {(order.price || 0).toLocaleString('ko-KR')}원</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-gray-500)' }}>결제수단</span>
          <span>{methodLabel}</span>
        </div>
      </div>

      {/* 메모 */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: 6 }}>
          관리자 메모 <span style={{ color: 'var(--color-gray-500)', fontWeight: 400 }}>(고객에게 보이지 않음)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="예) 리뷰 이벤트 적용, 특이사항 기록"
          rows={3}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            border: '1px solid var(--color-gray-200)', fontSize: '0.875rem',
            resize: 'vertical', outline: 'none',
          }}
        />
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
          {savingNotes ? '저장 중...' : '입력창을 벗어나면 자동 저장돼요'}
        </div>
      </div>

      {/* 취소/환불 버튼 */}
      {!terminal && (
        <button
          type="button"
          onClick={onRequestCancel}
          style={{
            width: '100%', padding: '12px', minHeight: 44, marginTop: 4,
            borderRadius: 10, border: '1px solid #FECACA',
            background: 'white', color: '#DC2626',
            fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          주문 취소·환불
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        style={{
          width: '100%', padding: '10px', fontSize: '0.8125rem',
          color: 'var(--color-gray-500)', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        닫기
      </button>
    </div>
  );
}

function CancelForm({ order, onSubmit, onClose }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // paymentKey 존재 = 토스 결제 (paymentMethod 필드 의존 안 함)
  const isToss = !!order.paymentKey;

  const handleSubmit = async (refundOnly) => {
    setSubmitting(true);
    try {
      await onSubmit({ reason: reason.trim(), refundOnly });
    } catch (err) {
      alert('실패: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
      <div style={{
        padding: '10px 12px', background: '#FEF2F2', borderRadius: 8,
        fontSize: '0.8125rem', color: '#7F1D1D', lineHeight: 1.6,
      }}>
        {isToss
          ? <><b>{(order.price || 0).toLocaleString('ko-KR')}원</b>이 토스페이먼츠에서 <b>자동 취소</b>됩니다.<br />배송 전이라면 재고도 복원돼요.</>
          : <>무통장 결제 건은 시스템이 자동으로 환불할 수 없어요. <b>수동으로 입금금액 환불 후</b> 상태를 바꾸세요.<br />배송 전이라면 재고는 자동 복원됩니다.</>}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: 6 }}>
          취소 사유 (선택)
        </label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예) 고객 요청, 품절"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            border: '1px solid var(--color-gray-200)', fontSize: '0.875rem',
            outline: 'none', minHeight: 44,
          }}
        />
      </div>

      {isToss ? (
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          style={{
            width: '100%', padding: '14px', minHeight: 48,
            borderRadius: 10, border: 'none',
            background: '#EF4444', color: 'white',
            fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '취소 처리 중...' : '토스 결제 취소'}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            style={{
              width: '100%', padding: '14px', minHeight: 48,
              borderRadius: 10, border: 'none',
              background: '#EF4444', color: 'white',
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? '처리 중...' : '취소 처리 (환불 완료)'}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            style={{
              width: '100%', padding: '12px', minHeight: 44,
              borderRadius: 10, border: '1px solid #FBBF24',
              background: '#FFFBEB', color: '#92400E',
              fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            환불 진행 중 상태로만 표시
          </button>
        </div>
      )}

      <button
        onClick={onClose}
        disabled={submitting}
        style={{
          width: '100%', padding: '10px', fontSize: '0.8125rem',
          color: 'var(--color-gray-500)', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        닫기
      </button>
    </div>
  );
}
