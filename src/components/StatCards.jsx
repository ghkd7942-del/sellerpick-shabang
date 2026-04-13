const cardStyle = {
  flex: 1,
  background: 'white',
  borderRadius: 12,
  padding: '14px 12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  textAlign: 'center',
};

const labelStyle = {
  fontSize: '0.75rem',
  color: 'var(--color-gray-500)',
  marginBottom: 4,
};

const valueStyle = {
  fontSize: '1.25rem',
  fontWeight: 700,
};

export default function StatCards({ todayOrderCount, paidCount, todayRevenue }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={cardStyle}>
        <div style={labelStyle}>오늘 주문</div>
        <div style={{ ...valueStyle, color: 'var(--color-pink)' }}>
          {todayOrderCount}
        </div>
      </div>
      <div style={cardStyle}>
        <div style={labelStyle}>결제완료</div>
        <div style={{ ...valueStyle, color: 'var(--color-mint)' }}>
          {paidCount}
        </div>
      </div>
      <div style={cardStyle}>
        <div style={labelStyle}>오늘 매출</div>
        <div style={{ ...valueStyle, color: 'var(--color-teal)' }}>
          {todayRevenue.toLocaleString('ko-KR')}원
        </div>
      </div>
    </div>
  );
}
