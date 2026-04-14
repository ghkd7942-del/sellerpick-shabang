import { useEffect } from 'react';

export default function OrderToast({ order, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [order, onDismiss]);

  if (!order) return null;

  return (
    <div style={{
      position: 'fixed', top: 16, left: 16, right: 16,
      maxWidth: 398, margin: '0 auto', zIndex: 400,
      background: 'white', borderRadius: 12, padding: '14px 16px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      borderLeft: '4px solid var(--color-pink)',
      animation: 'slide-in-top 0.3s ease-out',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: '#FFF0F3', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', flexShrink: 0,
      }}>
        &#128717;
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
          {order.buyerName}님 주문!
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
          {order.productName} · {order.price?.toLocaleString('ko-KR')}원
        </div>
      </div>
    </div>
  );
}
