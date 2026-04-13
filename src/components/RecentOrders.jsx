const STATUS_CONFIG = {
  new: { label: '새주문', bg: '#FEF3C7', color: '#92400E' },
  paid: { label: '결제', bg: '#D1FAE5', color: '#065F46' },
  shipping: { label: '배송중', bg: '#DBEAFE', color: '#1E40AF' },
  done: { label: '완료', bg: 'var(--color-gray-100)', color: 'var(--color-gray-500)' },
};

export default function RecentOrders({ orders, loading }) {
  if (loading) {
    return (
      <section>
        <h2 style={sectionTitle}>최근 주문</h2>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
          로딩 중...
        </div>
      </section>
    );
  }

  if (orders.length === 0) {
    return (
      <section>
        <h2 style={sectionTitle}>최근 주문</h2>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
          아직 주문이 없습니다
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 style={sectionTitle}>최근 주문</h2>
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {orders.slice(0, 10).map((order, i) => {
          const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
          return (
            <div
              key={order.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                minHeight: 44,
                borderBottom: i < Math.min(orders.length, 10) - 1 ? '1px solid var(--color-gray-100)' : 'none',
              }}
            >
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{order.buyerName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>{order.productName}</div>
              </div>
              <span
                className="status-badge"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const sectionTitle = {
  fontSize: '1rem',
  fontWeight: 700,
  marginBottom: 8,
};
