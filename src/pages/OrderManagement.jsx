import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateDocument } from '../lib/firestoreAPI';
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
];

const STATUS_CONFIG = {
  new: { label: '새주문', bg: '#FEF3C7', color: '#92400E' },
  paid: { label: '입금완료', bg: '#D1FAE5', color: '#065F46' },
  shipping: { label: '배송중', bg: '#DBEAFE', color: '#1E40AF' },
  done: { label: '완료', bg: 'var(--color-gray-100)', color: 'var(--color-gray-500)' },
};

const NEXT_STATUS = {
  new: { next: 'paid', label: '입금확인' },
  paid: { next: 'shipping', label: '배송시작' },
  shipping: { next: 'done', label: '배송완료' },
};

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function OrderManagement() {
  const navigate = useNavigate();
  const { orders, loading } = useOrders(100);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [shippingOrder, setShippingOrder] = useState(null);

  const filtered = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  const handleStatusChange = async (order, nextStatus) => {
    // paid → shipping은 송장 입력 바텀시트로
    if (order.status === 'paid' && nextStatus === 'shipping') {
      setShippingOrder(order);
      return;
    }
    setUpdating(order.id);
    try {
      await updateDocument('orders', order.id, { status: nextStatus });
      // 입금확인 알림톡 (new → paid)
      if (nextStatus === 'paid') {
        notifyPaymentConfirmed(order).catch(() => {});
      }
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
      // 배송시작 알림톡 (송장번호 있을 때만)
      if (trackingNumber) {
        notifyShippingStarted(shippingOrder, courier, trackingNumber).catch(() => {});
      }
      setShippingOrder(null);
    } catch (err) {
      alert('배송 시작 실패: ' + err.message);
    }
    setUpdating(null);
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

      {/* 필터 탭 */}
      <div style={{
        display: 'flex', gap: 0, background: 'white',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        borderBottom: '1px solid var(--color-gray-200)',
        position: 'sticky', top: 56, zIndex: 49,
      }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flex: '0 0 auto',
              padding: '12px 16px',
              fontSize: '0.875rem',
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
            {f.key !== 'all' && (
              <span style={{ marginLeft: 4, fontSize: '0.75rem' }}>
                {orders.filter((o) => o.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 주문 목록 */}
      <div style={{ padding: '12px 16px', paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            로딩 중...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>&#128230;</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gray-700)' }}>
              아직 주문이 없어요
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
              방송 중에 링크를 공유해보세요!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
              const action = NEXT_STATUS[order.status];

              return (
                <div
                  key={order.id}
                  style={{
                    background: 'white', borderRadius: 12, padding: '14px 16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* 상단: 구매자 + 뱃지 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{order.buyerName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginLeft: 8 }}>{order.phone}</span>
                    </div>
                    <span className="status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* 상품 정보 */}
                  <div style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>
                    {order.productName}
                    {order.option && <span style={{ color: 'var(--color-gray-500)' }}> · {order.option}</span>}
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

                  {/* 송장번호 표시 (배송중/완료일 때) */}
                  {(order.status === 'shipping' || order.status === 'done') && order.trackingNumber && (
                    <div style={{
                      marginTop: 8, padding: '8px 10px', borderRadius: 8,
                      background: 'var(--color-gray-50)', fontSize: '0.75rem',
                      color: 'var(--color-gray-700)',
                    }}>
                      {COURIERS.find((c) => c.code === order.courier)?.name || '택배'} · {order.trackingNumber}
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

      <BottomTabBar />
    </div>
  );
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
