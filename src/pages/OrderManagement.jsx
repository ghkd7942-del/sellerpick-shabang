import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useOrders from '../hooks/useOrders';
import BottomTabBar from '../components/BottomTabBar';
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
  const { orders, loading } = useOrders(100);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  const filtered = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  const handleStatusChange = async (orderId, nextStatus) => {
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: nextStatus });
    } catch (err) {
      alert('상태 변경 실패: ' + err.message);
    }
    setUpdating(null);
  };

  return (
    <div className="admin-container">
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '0 16px', height: 56, background: 'white',
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>주문 관리</h1>
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

                  {/* 상태 변경 버튼 */}
                  {action && (
                    <button
                      onClick={() => handleStatusChange(order.id, action.next)}
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

      <BottomTabBar />
    </div>
  );
}
