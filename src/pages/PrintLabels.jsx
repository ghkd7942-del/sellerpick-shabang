import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useOrders from '../hooks/useOrders';
import '../styles/admin.css';

const FILTER_OPTIONS = [
  { key: 'paid', label: '입금완료' },
  { key: 'shipping', label: '배송중' },
  { key: 'all-printable', label: '전체 (입금+배송)' },
];

const DUMMY_ORDERS = [
  {
    id: 'test-1',
    buyerName: '홍길동',
    phone: '010-1234-5678',
    address: '서울특별시 강남구 테헤란로 123, 456호 (역삼동)',
    productName: '원피스',
    option: 'M',
    price: 29000,
  },
  {
    id: 'test-2',
    buyerName: '김영희',
    phone: '010-9876-5432',
    address: '경기도 성남시 분당구 정자일로 95, 102동 1203호',
    productName: '가디건',
    option: '베이지 / L',
    price: 45000,
  },
  {
    id: 'test-3',
    buyerName: '이철수',
    phone: '010-5555-1234',
    address: '부산광역시 해운대구 우동 100-5',
    productName: '스니커즈',
    option: '270mm',
    price: 89000,
  },
];

export default function PrintLabels() {
  const navigate = useNavigate();
  const { orders, loading } = useOrders(500);
  const [filter, setFilter] = useState('paid');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const printableOrders = useMemo(() => {
    return orders.filter((o) => {
      const t = o.createdAt?.toDate?.() || new Date(o.createdAt);
      if (t < today) return false;
      if (filter === 'paid') return o.status === 'paid';
      if (filter === 'shipping') return o.status === 'shipping';
      return o.status === 'paid' || o.status === 'shipping';
    });
  }, [orders, filter, today]);

  // 전체 선택/해제 동기화
  useMemo(() => {
    if (selectAll) {
      setSelectedIds(new Set(printableOrders.map((o) => o.id)));
    }
  }, [printableOrders, selectAll]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectAll(false);
  };

  const toggleAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(printableOrders.map((o) => o.id)));
      setSelectAll(true);
    }
  };

  const selectedOrders = printableOrders.filter((o) => selectedIds.has(o.id));

  const [testPrinting, setTestPrinting] = useState(false);
  const ordersToPrint = testPrinting ? DUMMY_ORDERS : selectedOrders;

  const handlePrint = () => {
    window.print();
  };

  const handleTestPrint = () => {
    setTestPrinting(true);
  };

  // testPrinting이 true로 바뀐 후 렌더 끝나면 print 호출
  useEffect(() => {
    if (!testPrinting) return;
    const timer = setTimeout(() => {
      window.print();
      setTestPrinting(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [testPrinting]);

  return (
    <div className="admin-container">
      {/* 화면용 헤더 — 인쇄 시 숨김 */}
      <div className="no-print">
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 16px', height: 56, background: 'white',
          borderBottom: '1px solid var(--color-gray-200)',
        }}>
          <button onClick={() => navigate(-1)} style={{ fontSize: '1.25rem', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center' }}>
            &#8592;
          </button>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>배송 라벨 인쇄</h1>
          <button
            onClick={handleTestPrint}
            style={{
              marginLeft: 'auto', padding: '8px 12px', borderRadius: 8,
              fontSize: '0.75rem', fontWeight: 700, minHeight: 36,
              border: '1.5px dashed var(--color-pink)',
              background: 'white', color: 'var(--color-pink)',
              cursor: 'pointer',
            }}
          >
            🧪 테스트 인쇄
          </button>
        </header>

        {/* 필터 */}
        <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                flex: 1, padding: '8px', borderRadius: 8,
                fontSize: '0.75rem', fontWeight: 600, minHeight: 40,
                border: '1.5px solid',
                borderColor: filter === f.key ? 'var(--color-pink)' : 'var(--color-gray-200)',
                background: filter === f.key ? 'var(--color-pink)' : 'white',
                color: filter === f.key ? 'white' : 'var(--color-gray-700)',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 전체 선택 + 카운트 */}
        <div style={{
          padding: '12px 16px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button onClick={toggleAll} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-gray-700)',
            minHeight: 44, padding: '0 4px',
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: 4,
              border: '2px solid',
              borderColor: selectAll ? 'var(--color-pink)' : 'var(--color-gray-300)',
              background: selectAll ? 'var(--color-pink)' : 'white',
              color: 'white', fontSize: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selectAll ? '✓' : ''}
            </span>
            전체 선택
          </button>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)' }}>
            {selectedIds.size}건 선택
          </span>
        </div>

        {/* 주문 목록 */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>로딩 중...</div>
        ) : printableOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>&#128230;</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-gray-700)' }}>
              인쇄할 주문이 없어요
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
              오늘 입금완료된 주문이 여기 표시됩니다
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
            {printableOrders.map((order) => {
              const selected = selectedIds.has(order.id);
              return (
                <button
                  key={order.id}
                  onClick={() => toggleSelect(order.id)}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 14px',
                    background: selected ? '#FFF0F3' : 'white',
                    borderRadius: 10, textAlign: 'left',
                    border: selected ? '1.5px solid var(--color-pink)' : '1.5px solid var(--color-gray-100)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
                    border: '2px solid',
                    borderColor: selected ? 'var(--color-pink)' : 'var(--color-gray-300)',
                    background: selected ? 'var(--color-pink)' : 'white',
                    color: 'white', fontSize: '0.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected ? '✓' : ''}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{order.buyerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                      {order.phone} · {order.productName}{order.option ? ` (${order.option})` : ''}
                    </div>
                    <div style={{
                      fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {order.address || '주소 미입력'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 인쇄 버튼 */}
        {selectedIds.size > 0 && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            maxWidth: 430, margin: '0 auto',
            padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            background: 'white', borderTop: '1px solid var(--color-gray-200)',
          }}>
            <button
              className="btn-primary"
              onClick={handlePrint}
              style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
            >
              &#128424; 라벨 인쇄하기 ({selectedIds.size}건)
            </button>
          </div>
        )}
      </div>

      {/* ===== 인쇄 영역 — 화면에서는 숨김, 인쇄 시에만 표시 ===== */}
      <div className="print-only">
        {ordersToPrint.map((order, i) => (
          <div key={order.id} className="label-card" style={{
            pageBreakInside: 'avoid',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: '12mm 10mm',
            marginBottom: i < ordersToPrint.length - 1 ? '4mm' : 0,
            fontFamily: "'Pretendard', sans-serif",
          }}>
            {/* 보내는 분 */}
            <div style={{ fontSize: '8pt', color: '#888', marginBottom: '3mm' }}>
              보내는 분: 샤방이{testPrinting ? ' · TEST' : ''}
            </div>

            {/* 받는 분 */}
            <div style={{ fontSize: '14pt', fontWeight: 700, marginBottom: '2mm' }}>
              {order.buyerName}
            </div>
            <div style={{ fontSize: '11pt', marginBottom: '1mm' }}>
              {order.phone}
            </div>
            <div style={{ fontSize: '10pt', color: '#333', marginBottom: '4mm' }}>
              {order.address || '주소 미입력 — 고객에게 확인 필요'}
            </div>

            {/* 구분선 */}
            <div style={{ borderTop: '1px dashed #ccc', margin: '3mm 0' }} />

            {/* 상품 정보 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt' }}>
              <span style={{ fontWeight: 600 }}>
                {order.productName}{order.option ? ` (${order.option})` : ''}
              </span>
              <span style={{ fontWeight: 700, color: '#FF4B6E' }}>
                {order.price?.toLocaleString('ko-KR')}원
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
