import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getCollection } from '../lib/firestoreAPI';
import useAuth from '../hooks/useAuth';
import useCustomerProfile from '../hooks/useCustomerProfile';
import ShopTabBar from '../components/ShopTabBar';
import { getCourier, getTrackingUrl } from '../lib/couriers';
import '../styles/admin.css';

const STEPS = [
  { key: 'new', label: '주문접수', icon: '📋' },
  { key: 'paid', label: '입금확인', icon: '✅' },
  { key: 'shipping', label: '배송중', icon: '🚚' },
  { key: 'done', label: '배송완료', icon: '📦' },
];

const STATUS_INDEX = { new: 0, paid: 1, shipping: 2, done: 3 };

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function OrderTrack() {
  const { sellerSlug } = useParams();
  const { user } = useAuth();
  const { profile } = useCustomerProfile();
  const [phone, setPhone] = useState('');
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // 로그인 + 프로필에 전화번호 있으면 자동 조회
  useEffect(() => {
    if (user && profile?.phone) {
      setPhone(profile.phone);
      searchByPhone(profile.phone);
    }
  }, [user, profile]);

  const intervalRef = useRef(null);

  const searchByPhone = (phoneNum) => {
    setSearched(true);
    setLoading(true);
    const trimmed = phoneNum.trim();

    const fetchOrders = async () => {
      try {
        const allOrders = await getCollection('orders');
        const filtered = allOrders
          .filter((o) => o.phone === trimmed)
          .sort((a, b) => {
            const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return tb - ta;
          });
        setOrders(filtered);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    if (intervalRef.current) clearInterval(intervalRef.current);
    fetchOrders();
    intervalRef.current = setInterval(fetchOrders, 10000);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleSearch = () => {
    if (!phone.trim()) return;
    searchByPhone(phone);
  };

  return (
    <div className="admin-container">
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: '0 16px', height: 56, background: 'white',
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>주문내역</h1>
      </header>

      <div className="admin-content">
        {/* 전화번호 검색 */}
        <div style={{
          background: 'white', borderRadius: 12, padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 10 }}>
            주문 조회
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="010-0000-0000"
              inputMode="tel"
              style={{
                flex: 1, padding: '12px 14px',
                border: '1px solid var(--color-gray-200)', borderRadius: 10,
                fontSize: '0.9375rem', outline: 'none', minHeight: 44,
              }}
            />
            <button
              onClick={handleSearch}
              className="btn-primary"
              style={{ padding: '0 20px', borderRadius: 10, fontSize: '0.875rem', minHeight: 44 }}
            >
              조회
            </button>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 6 }}>
            주문 시 입력한 연락처로 조회하세요
          </p>
        </div>

        {/* 결과 */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            조회 중...
          </div>
        ) : searched && orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>&#128269;</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-gray-700)' }}>
              주문 내역이 없어요
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
              전화번호를 다시 확인해주세요
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order) => {
              const stepIdx = STATUS_INDEX[order.status] ?? 0;
              const expanded = expandedId === order.id;

              return (
                <div key={order.id} style={{
                  background: 'white', borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                  {/* 카드 헤더 — 탭으로 펼치기 */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    style={{
                      width: '100%', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 56,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{order.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                        {order.price?.toLocaleString('ko-KR')}원
                        {order.option ? ` · ${order.option}` : ''}
                        {order.qty > 1 ? ` · ${order.qty}개` : ''}
                        <span style={{ marginLeft: 8 }}>{timeAgo(order.createdAt)}</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700,
                      padding: '4px 10px', borderRadius: 9999,
                      background: stepIdx >= 3 ? 'var(--color-gray-100)' :
                        stepIdx >= 2 ? '#DBEAFE' :
                        stepIdx >= 1 ? '#D1FAE5' : '#FEF3C7',
                      color: stepIdx >= 3 ? 'var(--color-gray-500)' :
                        stepIdx >= 2 ? '#1E40AF' :
                        stepIdx >= 1 ? '#065F46' : '#92400E',
                    }}>
                      {STEPS[stepIdx].label}
                    </span>
                  </button>

                  {/* 펼쳐진 상세 — 배송 트래커 */}
                  {expanded && (
                    <div style={{ padding: '0 16px 16px' }}>
                      {/* 스텝 트래커 */}
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                        padding: '16px 0', position: 'relative',
                      }}>
                        {/* 배경 라인 */}
                        <div style={{
                          position: 'absolute', top: 34, left: 28, right: 28,
                          height: 3, background: 'var(--color-gray-100)', zIndex: 0,
                        }} />
                        {/* 진행 라인 */}
                        <div style={{
                          position: 'absolute', top: 34, left: 28,
                          width: `${(stepIdx / 3) * (100 - 18)}%`,
                          height: 3, background: 'var(--color-pink)', zIndex: 1,
                          transition: 'width 0.3s',
                        }} />

                        {STEPS.map((step, i) => {
                          const active = i <= stepIdx;
                          const current = i === stepIdx;
                          return (
                            <div key={step.key} style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center',
                              gap: 6, zIndex: 2, flex: 1,
                            }}>
                              <div style={{
                                width: current ? 36 : 28, height: current ? 36 : 28,
                                borderRadius: '50%',
                                background: active ? 'var(--color-pink)' : 'var(--color-gray-100)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: current ? '1rem' : '0.8125rem',
                                transition: 'all 0.3s',
                                boxShadow: current ? '0 0 0 4px rgba(255,75,110,0.2)' : 'none',
                              }}>
                                {step.icon}
                              </div>
                              <span style={{
                                fontSize: '0.625rem', fontWeight: active ? 700 : 400,
                                color: active ? 'var(--color-pink)' : 'var(--color-gray-500)',
                              }}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* 상태 메시지 */}
                      <div style={{
                        background: 'var(--color-gray-50)', borderRadius: 10,
                        padding: '12px 14px', fontSize: '0.8125rem',
                        color: 'var(--color-gray-700)', lineHeight: 1.6,
                      }}>
                        {order.status === 'new' && (
                          <>
                            &#128172; 주문이 접수되었습니다.<br />
                            입금 후 자동으로 상태가 변경됩니다.
                          </>
                        )}
                        {order.status === 'paid' && (
                          <>
                            &#10003; 입금이 확인되었습니다!<br />
                            곧 배송이 시작됩니다.
                          </>
                        )}
                        {order.status === 'shipping' && (
                          <>
                            &#128666; 상품이 배송 중입니다!<br />
                            1~3일 이내 도착 예정입니다.
                          </>
                        )}
                        {order.status === 'done' && (
                          <>
                            &#128230; 배송이 완료되었습니다.<br />
                            감사합니다! 다음에 또 만나요 &#128150;
                          </>
                        )}
                      </div>

                      {/* 송장번호 카드 */}
                      {(order.status === 'shipping' || order.status === 'done') && order.trackingNumber && (
                        <div style={{
                          marginTop: 12, padding: '12px 14px', borderRadius: 10,
                          border: '1.5px solid var(--color-pink)',
                          background: '#FFF0F3',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>
                                {getCourier(order.courier)?.name || '택배'}
                              </div>
                              <div style={{
                                fontSize: '0.9375rem', fontWeight: 700, marginTop: 2,
                                fontFamily: 'monospace',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {order.trackingNumber}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard?.writeText(order.trackingNumber);
                                  alert('송장번호가 복사되었습니다');
                                }}
                                style={{
                                  padding: '8px 10px', borderRadius: 8,
                                  fontSize: '0.75rem', fontWeight: 600, minHeight: 36,
                                  border: '1px solid var(--color-gray-200)',
                                  background: 'white', color: 'var(--color-gray-700)',
                                  cursor: 'pointer',
                                }}
                              >
                                복사
                              </button>
                              {getTrackingUrl(order.courier, order.trackingNumber) && (
                                <a
                                  href={getTrackingUrl(order.courier, order.trackingNumber)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    padding: '8px 12px', borderRadius: 8,
                                    fontSize: '0.75rem', fontWeight: 700, minHeight: 36,
                                    background: 'var(--color-pink)', color: 'white',
                                    textDecoration: 'none',
                                    display: 'flex', alignItems: 'center',
                                  }}
                                >
                                  택배조회
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 주문 정보 */}
                      <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span>주문자</span><span style={{ color: 'var(--color-gray-700)' }}>{order.buyerName}</span>
                        </div>
                        {order.address && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                            <span>배송지</span><span style={{ color: 'var(--color-gray-700)' }}>{order.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ShopTabBar />
    </div>
  );
}
