import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useOrders from '../hooks/useOrders';
import BottomTabBar from '../components/BottomTabBar';
import '../styles/admin.css';

const PERIODS = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
];

const STATUS_CONFIG = {
  new: { label: '새주문', bg: '#FEF3C7', color: '#92400E' },
  paid: { label: '입금완료', bg: '#D1FAE5', color: '#065F46' },
  shipping: { label: '배송중', bg: '#DBEAFE', color: '#1E40AF' },
  done: { label: '완료', bg: 'var(--color-gray-100)', color: 'var(--color-gray-500)' },
};

function getStartDate(period) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (period === 'today') return now;
  if (period === 'week') {
    const day = now.getDay();
    now.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    return now;
  }
  now.setDate(1);
  return now;
}

function formatDate(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}/${d}`;
}

function toDate(timestamp) {
  return timestamp?.toDate?.() || new Date(timestamp);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', padding: '8px 12px', borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: '0.8125rem',
    }}>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ color: 'var(--color-pink)', fontWeight: 700 }}>
        {payload[0].value.toLocaleString('ko-KR')}원
      </div>
    </div>
  );
};

export default function Settlement() {
  const { orders, loading } = useOrders(500);
  const [period, setPeriod] = useState('today');

  const startDate = useMemo(() => getStartDate(period), [period]);

  // 기간 내 주문 필터링
  const periodOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      return toDate(o.createdAt) >= startDate;
    });
  }, [orders, startDate]);

  // 매출 집계 (new 제외 — paid 이상만)
  const revenueOrders = useMemo(() =>
    periodOrders.filter((o) => o.status !== 'new'),
    [periodOrders]
  );

  const stats = useMemo(() => {
    const totalRevenue = revenueOrders.reduce((s, o) => s + (o.price || 0), 0);
    const paidRevenue = periodOrders
      .filter((o) => o.status === 'paid' || o.status === 'shipping' || o.status === 'done')
      .reduce((s, o) => s + (o.price || 0), 0);
    const unpaid = periodOrders
      .filter((o) => o.status === 'new')
      .reduce((s, o) => s + (o.price || 0), 0);

    return {
      totalOrders: periodOrders.length,
      totalRevenue,
      paidRevenue,
      unpaid,
    };
  }, [periodOrders, revenueOrders]);

  // 최근 7일 차트 데이터
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayRevenue = orders
        .filter((o) => {
          if (!o.createdAt || o.status === 'new') return false;
          const t = toDate(o.createdAt);
          return t >= d && t < nextD;
        })
        .reduce((s, o) => s + (o.price || 0), 0);

      days.push({ date: formatDate(d), revenue: dayRevenue, isToday: i === 0 });
    }
    return days;
  }, [orders]);

  // 입금완료 건수 (오늘)
  const todayPaidCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      return toDate(o.createdAt) >= today && o.status === 'paid';
    }).length;
  }, [orders]);

  // 최고 매출 카테고리
  const topCategory = useMemo(() => {
    const map = {};
    revenueOrders.forEach((o) => {
      const cat = o.productName || '기타';
      map[cat] = (map[cat] || 0) + (o.price || 0);
    });
    const entries = Object.entries(map);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return { name: entries[0][0], revenue: entries[0][1] };
  }, [revenueOrders]);

  return (
    <div className="admin-container">
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '0 16px', height: 56, background: 'white',
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>정산</h1>
      </header>

      <div style={{ padding: 16, paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 기간 선택 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                flex: 1, padding: '10px', borderRadius: 10,
                fontSize: '0.875rem', fontWeight: 600, minHeight: 44,
                border: '1.5px solid',
                borderColor: period === p.key ? 'var(--color-pink)' : 'var(--color-gray-200)',
                background: period === p.key ? 'var(--color-pink)' : 'white',
                color: period === p.key ? 'white' : 'var(--color-gray-700)',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 요약 카드 2x2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <SummaryCard label="총 주문" value={`${stats.totalOrders}건`} color="var(--color-gray-900)" />
          <SummaryCard label="총 매출" value={`${stats.totalRevenue.toLocaleString('ko-KR')}원`} color="var(--color-pink)" />
          <SummaryCard label="입금 완료" value={`${stats.paidRevenue.toLocaleString('ko-KR')}원`} color="var(--color-mint)" />
          <SummaryCard label="미입금" value={`${stats.unpaid.toLocaleString('ko-KR')}원`} color="#F59E0B" />
        </div>

        {/* 베스트 상품 */}
        {topCategory && (
          <div style={{
            background: 'linear-gradient(135deg, #FFF0F3, #FFE0E6)', borderRadius: 12,
            padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>&#127942; 베스트 상품</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: 2 }}>{topCategory.name}</div>
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-pink)' }}>
              {topCategory.revenue.toLocaleString('ko-KR')}원
            </div>
          </div>
        )}

        {/* 매출 차트 */}
        <div style={{ background: 'white', borderRadius: 12, padding: '16px 8px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12, paddingLeft: 8 }}>
            최근 7일 매출
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 10000 ? `${Math.floor(v / 10000)}만` : v > 0 ? `${Math.floor(v / 1000)}천` : '0'} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,75,110,0.05)' }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={32}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.isToday ? '#FF4B6E' : '#FFB3C1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 주문 목록 */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>주문 내역</h2>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>로딩 중...</div>
          ) : periodOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
              해당 기간 주문이 없습니다
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              {/* 테이블 헤더 */}
              <div style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 1fr 70px',
                padding: '10px 14px', fontSize: '0.6875rem', color: 'var(--color-gray-500)',
                fontWeight: 600, borderBottom: '1px solid var(--color-gray-100)',
              }}>
                <span>날짜</span><span>구매자</span><span>상품</span><span style={{ textAlign: 'right' }}>금액</span>
              </div>
              {periodOrders.slice(0, 30).map((order, i) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
                const date = order.createdAt ? toDate(order.createdAt) : null;
                return (
                  <div
                    key={order.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '60px 1fr 1fr 70px',
                      padding: '10px 14px', fontSize: '0.8125rem', alignItems: 'center',
                      borderBottom: i < Math.min(periodOrders.length, 30) - 1 ? '1px solid var(--color-gray-50)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--color-gray-500)', fontSize: '0.6875rem' }}>
                      {date ? formatDate(date) : '-'}
                    </span>
                    <div>
                      <span style={{ fontWeight: 600 }}>{order.buyerName}</span>
                      <span className="status-badge" style={{ background: cfg.bg, color: cfg.color, marginLeft: 6, fontSize: '0.625rem', padding: '1px 5px' }}>
                        {cfg.label}
                      </span>
                    </div>
                    <span style={{ color: 'var(--color-gray-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.productName}
                    </span>
                    <span style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-pink)', fontSize: '0.8125rem' }}>
                      {order.price?.toLocaleString('ko-KR')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 배송 라벨 출력 버튼 */}
      <div style={{
        position: 'fixed', bottom: 60, left: 0, right: 0,
        maxWidth: 430, margin: '0 auto',
        padding: '8px 16px', paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(to top, white 70%, transparent)',
        zIndex: 90,
      }}>
        <button
          className="btn-primary"
          onClick={() => alert('배송 용지 출력 기능 준비 중')}
          style={{ width: '100%', padding: '14px', fontSize: '0.9375rem' }}
        >
          &#128230; 오늘 배송 용지 출력 (입금완료 {todayPaidCount}건)
        </button>
      </div>

      <BottomTabBar />
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '14px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.125rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
