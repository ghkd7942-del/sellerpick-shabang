import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useOrders from '../hooks/useOrders';

const STATUS_LABEL = {
  new: '신규',
  paid: '입금완료',
  shipped: '배송중',
  done: '완료',
  cancelled: '취소',
};

const STATUS_COLOR = {
  new: { bg: '#FEF3C7', fg: '#92400E' },
  paid: { bg: '#D1FAE5', fg: '#065F46' },
  shipped: { bg: '#DBEAFE', fg: '#1E40AF' },
  done: { bg: '#E5E7EB', fg: '#374151' },
  cancelled: { bg: '#FEE2E2', fg: '#991B1B' },
};

function formatWhen(ts) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}

export default function ProductDetailView({ product }) {
  const navigate = useNavigate();
  const { orders, loading } = useOrders(200);

  const productOrders = useMemo(
    () => orders.filter((o) => o.productId === product.id),
    [orders, product.id]
  );

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const totalSold = productOrders.reduce((s, o) => s + (o.qty || 1), 0);

  // 오늘 주문 수
  const todayOrderCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return productOrders.filter((o) => {
      const t = o.createdAt?.toDate?.() || new Date(o.createdAt);
      return t >= today;
    }).length;
  }, [productOrders]);

  // 옵션별 판매 수 집계
  const optionSales = useMemo(() => {
    const map = {};
    productOrders.forEach((o) => {
      const key = o.option || '(옵션 없음)';
      map[key] = (map[key] || 0) + (o.qty || 1);
    });
    return map;
  }, [productOrders]);

  // 색상 정규화 — 문자열 배열 OR {name, stock} 배열 모두 지원
  const colors = useMemo(() => {
    const raw = product.colors || [];
    return raw.map((c) => {
      if (typeof c === 'string') return { name: c };
      return { name: c.name || '' };
    }).filter((c) => c.name);
  }, [product.colors]);

  // (색상 × 사이즈) 재고 매트릭스 — product.stockMatrix 우선, 없으면 기본 50
  const matrix = useMemo(() => {
    const m = {};
    colors.forEach((c) => {
      m[c.name] = {};
      variants.forEach((v) => {
        m[c.name][v.name] = product.stockMatrix?.[c.name]?.[v.name] ?? (v.stock ?? 50);
      });
    });
    return m;
  }, [colors, variants, product.stockMatrix]);

  const colorTotals = useMemo(
    () => colors.map((c) => variants.reduce((s, v) => s + (matrix[c.name]?.[v.name] ?? 0), 0)),
    [colors, variants, matrix]
  );
  const sizeTotals = useMemo(
    () => variants.map((v) => colors.reduce((s, c) => s + (matrix[c.name]?.[v.name] ?? 0), 0)),
    [colors, variants, matrix]
  );
  const grandTotal = useMemo(
    () => colorTotals.reduce((a, b) => a + b, 0),
    [colorTotals]
  );

  // 매트릭스 있으면 매트릭스 합계, 아니면 variants stock 합계, 아니면 product.stock
  const totalStock = colors.length > 0 && variants.length > 0
    ? grandTotal
    : variants.length > 0
      ? variants.reduce((s, v) => s + (v.stock ?? 0), 0)
      : (product.stock ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 10, flexShrink: 0,
          background: product.imageUrl
            ? `url(${product.imageUrl}) center/cover`
            : 'var(--color-gray-200)',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>{product.name}</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-pink)', marginTop: 2 }}>
            {product.price?.toLocaleString('ko-KR')}원
            {variants.length > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-gray-500)', marginLeft: 4 }}>
                부터
              </span>
            )}
          </div>
          {product.category && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
              {product.category}
            </div>
          )}
        </div>
      </div>

      {/* 판매 요약 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={summaryCard('var(--color-teal)')}>
          <div style={summaryLabel}>총 재고</div>
          <div style={summaryValue}>{totalStock}</div>
        </div>
        <div style={summaryCard('var(--color-pink)')}>
          <div style={summaryLabel}>총 판매수</div>
          <div style={summaryValue}>{totalSold}</div>
        </div>
        <div style={summaryCard('#3B82F6')}>
          <div style={summaryLabel}>오늘 주문</div>
          <div style={summaryValue}>{todayOrderCount}건</div>
        </div>
      </div>

      {/* 색상 × 사이즈 재고 매트릭스 */}
      {colors.length > 0 && variants.length > 0 && (
        <section>
          <h3 style={sectionTitle}>색상 × 사이즈 재고</h3>
          <div style={{
            background: 'white', borderRadius: 10,
            border: '1px solid var(--color-gray-200)', overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse',
                fontSize: '0.75rem',
              }}>
                <thead>
                  <tr style={{ background: 'var(--color-gray-50)' }}>
                    <th style={thCorner}>색상 \ 사이즈</th>
                    {variants.map((v) => (
                      <th key={v.name} style={thCell}>{v.name}</th>
                    ))}
                    <th style={thTotal}>합계</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.map((c, ri) => (
                    <tr key={c.name} style={{
                      borderTop: '1px solid var(--color-gray-100)',
                    }}>
                      <td style={tdRowHeader}>
                        <span style={{
                          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                          background: 'var(--color-pink)', marginRight: 6,
                        }} />
                        {c.name}
                      </td>
                      {variants.map((v) => {
                        const cell = matrix[c.name]?.[v.name] ?? 0;
                        const isOut = cell <= 0;
                        return (
                          <td key={v.name} style={{
                            ...tdCell,
                            color: isOut ? '#991B1B' : 'var(--color-gray-700)',
                            background: isOut ? '#FEF2F2' : 'transparent',
                          }}>
                            {isOut ? '품절' : cell}
                          </td>
                        );
                      })}
                      <td style={{
                        ...tdTotal,
                        color: colorTotals[ri] <= 0 ? '#991B1B' : 'var(--color-pink)',
                      }}>
                        {colorTotals[ri]}
                      </td>
                    </tr>
                  ))}
                  <tr style={{
                    borderTop: '1.5px solid var(--color-gray-200)',
                    background: 'var(--color-gray-50)',
                  }}>
                    <td style={tdRowHeader}>합계</td>
                    {sizeTotals.map((total, i) => (
                      <td key={i} style={{
                        ...tdTotal,
                        color: total <= 0 ? '#991B1B' : 'var(--color-gray-700)',
                      }}>
                        {total}
                      </td>
                    ))}
                    <td style={{
                      ...tdTotal,
                      color: 'var(--color-pink)', fontSize: '0.875rem',
                    }}>
                      {grandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* 사이즈별 가격 */}
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10,
          }}>
            {variants.map((v) => {
              const sold = optionSales[v.name] || 0;
              return (
                <div key={v.name} style={{
                  flex: 1, minWidth: 100,
                  background: 'white', borderRadius: 8,
                  border: '1px solid var(--color-gray-200)',
                  padding: '8px 10px',
                }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600 }}>{v.name}</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-pink)', marginTop: 2 }}>
                    {v.price?.toLocaleString('ko-KR')}원
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                    판매 {sold}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 사이즈만 있고 색상 없음 (폴백) */}
      {colors.length === 0 && variants.length > 0 && (
        <section>
          <h3 style={sectionTitle}>사이즈별 재고</h3>
          <div style={{
            background: 'white', borderRadius: 10,
            border: '1px solid var(--color-gray-200)', overflow: 'hidden',
          }}>
            {variants.map((v, i) => {
              const sold = optionSales[v.name] || 0;
              const isSoldOut = (v.stock ?? 0) <= 0;
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
                  gap: 8, padding: '10px 12px',
                  borderBottom: i < variants.length - 1 ? '1px solid var(--color-gray-100)' : 'none',
                  alignItems: 'center',
                  background: isSoldOut ? '#FEF2F2' : 'white',
                }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{v.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                    {v.price?.toLocaleString('ko-KR')}원
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                    판매 <strong style={{ color: 'var(--color-gray-700)' }}>{sold}</strong>
                  </div>
                  <div style={{
                    fontSize: '0.8125rem', fontWeight: 700, textAlign: 'right',
                    color: isSoldOut ? '#991B1B' : 'var(--color-pink)',
                  }}>
                    {isSoldOut ? '품절' : `${v.stock}개`}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 주문 내역 */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={sectionTitle}>최근 주문</h3>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)' }}>
            5초마다 자동 갱신
          </span>
        </div>

        {loading ? (
          <div style={emptyBox}>로딩 중...</div>
        ) : productOrders.length === 0 ? (
          <div style={emptyBox}>
            <div style={{ fontSize: '1.75rem', marginBottom: 6 }}>📭</div>
            <div>이 상품 주문은 아직 없어요</div>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 10,
            border: '1px solid var(--color-gray-200)', overflow: 'hidden',
          }}>
            {productOrders.slice(0, 20).map((o, i) => {
              const status = STATUS_COLOR[o.status] || STATUS_COLOR.new;
              return (
                <div key={o.id} style={{
                  display: 'flex', gap: 10, padding: '10px 12px',
                  borderBottom: i < Math.min(productOrders.length, 20) - 1
                    ? '1px solid var(--color-gray-100)' : 'none',
                  alignItems: 'center',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                        {o.buyerName || '이름 없음'}
                      </span>
                      <span style={{
                        fontSize: '0.625rem', fontWeight: 700,
                        padding: '1px 6px', borderRadius: 4,
                        background: status.bg, color: status.fg,
                      }}>
                        {STATUS_LABEL[o.status] || o.status || '신규'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                      {o.option && <span>{o.option} · </span>}
                      <span>수량 {o.qty || 1}</span>
                      {o.phone && <span> · {o.phone}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-pink)' }}>
                      {(o.price || 0).toLocaleString('ko-KR')}원
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--color-gray-400)', marginTop: 2 }}>
                      {formatWhen(o.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            {productOrders.length > 20 && (
              <div style={{
                padding: '8px', textAlign: 'center',
                fontSize: '0.6875rem', color: 'var(--color-gray-500)',
                background: 'var(--color-gray-50)',
              }}>
                + {productOrders.length - 20}건 더 — 주문내역 탭에서 전체 확인
              </div>
            )}
          </div>
        )}
      </section>

      {/* 오늘 주문 프린팅 */}
      <button
        onClick={() => navigate(`/admin/print?productId=${product.id}`)}
        disabled={todayOrderCount === 0}
        style={{
          width: '100%', padding: '14px', borderRadius: 12,
          background: todayOrderCount === 0 ? 'var(--color-gray-100)' : 'var(--color-pink)',
          color: todayOrderCount === 0 ? 'var(--color-gray-400)' : 'white',
          fontSize: '1rem', fontWeight: 700, minHeight: 52,
          border: 'none',
          cursor: todayOrderCount === 0 ? 'not-allowed' : 'pointer',
          boxShadow: todayOrderCount === 0 ? 'none' : '0 4px 12px rgba(255,75,110,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        🖨 오늘 주문 프린팅하기
        {todayOrderCount > 0 && (
          <span style={{
            background: 'rgba(255,255,255,0.25)',
            padding: '2px 10px', borderRadius: 9999,
            fontSize: '0.8125rem', fontWeight: 700,
          }}>
            {todayOrderCount}건
          </span>
        )}
      </button>
    </div>
  );
}

const sectionTitle = {
  fontSize: '0.875rem',
  fontWeight: 700,
  margin: 0,
  marginBottom: 8,
};

function summaryCard(accent) {
  return {
    flex: 1,
    background: 'white',
    border: '1px solid var(--color-gray-200)',
    borderTop: `3px solid ${accent}`,
    borderRadius: 10,
    padding: '10px 8px',
    textAlign: 'center',
  };
}

const summaryLabel = {
  fontSize: '0.6875rem',
  color: 'var(--color-gray-500)',
  fontWeight: 500,
};

const summaryValue = {
  fontSize: '1.125rem',
  fontWeight: 700,
  marginTop: 2,
};

const thCorner = {
  fontSize: '0.6875rem', fontWeight: 600,
  padding: '8px 10px', textAlign: 'left',
  color: 'var(--color-gray-500)',
  whiteSpace: 'nowrap',
};
const thCell = {
  fontSize: '0.6875rem', fontWeight: 600,
  padding: '8px 6px', textAlign: 'center',
  color: 'var(--color-gray-700)',
  whiteSpace: 'nowrap',
};
const thTotal = {
  fontSize: '0.6875rem', fontWeight: 700,
  padding: '8px 10px', textAlign: 'center',
  color: 'var(--color-gray-700)',
  borderLeft: '1px solid var(--color-gray-200)',
  whiteSpace: 'nowrap',
};
const tdRowHeader = {
  fontSize: '0.75rem', fontWeight: 600,
  padding: '10px',
  color: 'var(--color-gray-700)',
  whiteSpace: 'nowrap',
};
const tdCell = {
  fontSize: '0.8125rem', fontWeight: 600,
  padding: '10px 6px', textAlign: 'center',
};
const tdTotal = {
  fontSize: '0.8125rem', fontWeight: 700,
  padding: '10px',
  textAlign: 'center',
  borderLeft: '1px solid var(--color-gray-200)',
};

const emptyBox = {
  padding: 28,
  textAlign: 'center',
  color: 'var(--color-gray-500)',
  fontSize: '0.8125rem',
  background: 'var(--color-gray-50)',
  borderRadius: 10,
};
