import { useState, useEffect, useMemo } from 'react';
import { getCollection } from '../lib/firestoreAPI';
import useOrders from '../hooks/useOrders';
import BottomTabBar from '../components/BottomTabBar';
import '../styles/admin.css';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const { orders } = useOrders(500);

  useEffect(() => {
    let cancelled = false;
    const fetchCustomers = async () => {
      try {
        const data = await getCollection('customers');
        if (!cancelled) {
          setCustomers(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCustomers();
    const interval = setInterval(fetchCustomers, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // 고객별 주문 통계
  const customerStats = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const key = o.phone;
      if (!key) return;
      if (!map[key]) map[key] = { orderCount: 0, totalSpent: 0, lastOrder: null };
      map[key].orderCount++;
      map[key].totalSpent += o.price || 0;
      const t = o.createdAt?.toDate?.() || new Date(o.createdAt);
      if (!map[key].lastOrder || t > map[key].lastOrder) map[key].lastOrder = t;
    });
    return map;
  }, [orders]);

  // 비회원 주문자도 포함
  const allCustomers = useMemo(() => {
    const phoneSet = new Set(customers.map((c) => c.phone).filter(Boolean));
    const guestPhones = new Set();
    orders.forEach((o) => {
      if (o.phone && !phoneSet.has(o.phone) && !guestPhones.has(o.phone)) {
        guestPhones.add(o.phone);
      }
    });

    const guests = [...guestPhones].map((phone) => {
      const firstOrder = orders.filter((o) => o.phone === phone).pop();
      return {
        id: `guest_${phone}`,
        name: firstOrder?.buyerName || '비회원',
        phone,
        address: firstOrder?.address || '',
        isGuest: true,
      };
    });

    return [...customers.map((c) => ({ ...c, isGuest: false })), ...guests];
  }, [customers, orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allCustomers;
    const s = search.trim().toLowerCase();
    return allCustomers.filter((c) =>
      (c.name || '').toLowerCase().includes(s) ||
      (c.phone || '').includes(s) ||
      (c.email || '').toLowerCase().includes(s)
    );
  }, [allCustomers, search]);

  // 정렬: 주문 많은 순
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const sa = customerStats[a.phone]?.totalSpent || 0;
      const sb = customerStats[b.phone]?.totalSpent || 0;
      return sb - sa;
    });
  }, [filtered, customerStats]);

  const totalRevenue = Object.values(customerStats).reduce((s, v) => s + v.totalSpent, 0);

  return (
    <div className="admin-container">
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 56, background: 'white',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>고객 관리</h1>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
          총 {allCustomers.length}명
        </span>
      </header>

      <div style={{ padding: '12px 16px 0' }}>
        {/* 요약 카드 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <MiniCard label="전체 고객" value={`${allCustomers.length}명`} color="var(--color-gray-900)" />
          <MiniCard label="회원" value={`${customers.length}명`} color="var(--color-teal)" />
          <MiniCard label="총 매출" value={`${(totalRevenue / 10000).toFixed(0)}만원`} color="var(--color-pink)" />
        </div>

        {/* 검색 */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 전화번호, 이메일 검색"
          style={{
            width: '100%', padding: '10px 14px',
            border: '1px solid var(--color-gray-200)', borderRadius: 10,
            fontSize: '0.875rem', outline: 'none', minHeight: 40,
            marginBottom: 12,
          }}
        />
      </div>

      {/* 고객 목록 */}
      <div style={{
        padding: '0 16px',
        paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            로딩 중...
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>&#128100;</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-gray-700)' }}>
              아직 고객이 없어요
            </div>
          </div>
        ) : (
          sorted.map((customer) => {
            const stats = customerStats[customer.phone] || { orderCount: 0, totalSpent: 0, lastOrder: null };
            const expanded = expandedId === customer.id;
            const customerOrders = orders.filter((o) => o.phone === customer.phone);

            return (
              <div key={customer.id} style={{
                background: 'white', borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <button
                  onClick={() => setExpandedId(expanded ? null : customer.id)}
                  style={{
                    width: '100%', padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 56,
                  }}
                >
                  {/* 아바타 */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: customer.isGuest
                      ? 'var(--color-gray-200)'
                      : 'linear-gradient(135deg, var(--color-pink), #FF8C00)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.875rem', fontWeight: 700,
                  }}>
                    {(customer.name || '?')[0]}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{customer.name || '이름없음'}</span>
                      {customer.isGuest && (
                        <span style={{
                          fontSize: '0.5625rem', background: 'var(--color-gray-100)',
                          color: 'var(--color-gray-500)', padding: '1px 5px', borderRadius: 4,
                        }}>비회원</span>
                      )}
                      {stats.orderCount >= 3 && (
                        <span style={{
                          fontSize: '0.5625rem', background: '#FEF3C7',
                          color: '#92400E', padding: '1px 5px', borderRadius: 4,
                        }}>단골</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                      {customer.phone || '번호없음'} · 주문 {stats.orderCount}건 · {stats.totalSpent.toLocaleString('ko-KR')}원
                    </div>
                  </div>

                  <span style={{ color: 'var(--color-gray-300)', fontSize: '0.875rem' }}>
                    {expanded ? '▲' : '▼'}
                  </span>
                </button>

                {/* 펼침 */}
                {expanded && (
                  <div style={{ padding: '0 16px 16px' }}>
                    {/* 고객 정보 */}
                    <div style={{
                      background: 'var(--color-gray-50)', borderRadius: 8,
                      padding: '10px 14px', marginBottom: 10,
                      display: 'flex', flexDirection: 'column', gap: 4,
                      fontSize: '0.75rem',
                    }}>
                      {customer.email && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-gray-500)' }}>이메일</span>
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-gray-500)' }}>주소</span>
                          <span>{customer.address}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-gray-500)' }}>총 구매액</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-pink)' }}>
                          {stats.totalSpent.toLocaleString('ko-KR')}원
                        </span>
                      </div>
                    </div>

                    {/* 주문 이력 */}
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-gray-700)' }}>
                      최근 주문
                    </div>
                    {customerOrders.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>주문 없음</div>
                    ) : (
                      customerOrders.slice(0, 5).map((o) => (
                        <div key={o.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '6px 0', borderBottom: '1px solid var(--color-gray-50)',
                          fontSize: '0.75rem',
                        }}>
                          <span>{o.productName}{o.option ? ` (${o.option})` : ''}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600 }}>{o.price?.toLocaleString('ko-KR')}원</span>
                            <span className="status-badge" style={{
                              background: o.status === 'new' ? '#FEF3C7' : o.status === 'paid' ? '#D1FAE5' : o.status === 'shipping' ? '#DBEAFE' : 'var(--color-gray-100)',
                              color: o.status === 'new' ? '#92400E' : o.status === 'paid' ? '#065F46' : o.status === 'shipping' ? '#1E40AF' : 'var(--color-gray-500)',
                              fontSize: '0.5625rem', padding: '1px 5px',
                            }}>
                              {o.status === 'new' ? '접수' : o.status === 'paid' ? '결제' : o.status === 'shipping' ? '배송' : '완료'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <BottomTabBar />
    </div>
  );
}

function MiniCard({ label, value, color }) {
  return (
    <div style={{
      flex: 1, background: 'white', borderRadius: 10, padding: '10px 12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)' }}>{label}</div>
      <div style={{ fontSize: '1.125rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
