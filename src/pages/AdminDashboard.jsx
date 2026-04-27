import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useOrders from '../hooks/useOrders';
import useProducts from '../hooks/useProducts';
import useStats from '../hooks/useStats';
import { seedSampleData } from '../lib/seedData';
import AdminHeader from '../components/AdminHeader';
import LiveControlBar from '../components/LiveControlBar';
import StatCards from '../components/StatCards';
import RecentOrders from '../components/RecentOrders';
import ProductList from '../components/ProductList';
import FAB from '../components/FAB';
import QuickAdd from '../components/QuickAdd';
import ShopProductForm from '../components/ShopProductForm';
import BottomSheet from '../components/BottomSheet';
import BottomTabBar from '../components/BottomTabBar';
import '../styles/admin.css';

export default function AdminDashboard() {
  const { orders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts();
  const { todayOrderCount, paidCount, todayRevenue } = useStats(orders);
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [shopFormOpen, setShopFormOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedSampleData();
      alert(`시드 완료: 상품 ${result.products}개, 주문 ${result.orders}개`);
    } catch (err) {
      alert('시드 실패: ' + err.message);
    }
    setSeeding(false);
  };

  return (
    <div className="admin-container">
      <AdminHeader />
      <div className="admin-content">
        <LiveControlBar />
        <StatCards
          todayOrderCount={todayOrderCount}
          paidCount={paidCount}
          todayRevenue={todayRevenue}
        />
        {/* 라이브 방송 시작 카드 */}
        <button
          onClick={() => navigate('/admin/live')}
          style={{
            width: '100%', padding: '16px 18px', borderRadius: 12,
            background: 'linear-gradient(135deg, #FF4B6E, #FF8C00)',
            color: 'white', display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 4px 12px rgba(255, 75, 110, 0.3)',
            minHeight: 56, cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '1.75rem' }}>&#128308;</span>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>라이브 방송 시작</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 2 }}>
              공장에서 즉석 판매를 시작하세요
            </div>
          </div>
        </button>

        {/* 송장 인쇄 카드 */}
        <button
          onClick={() => navigate('/admin/print')}
          style={{
            width: '100%', padding: '14px 18px', borderRadius: 12,
            background: 'white', border: '1.5px solid var(--color-gray-200)',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            minHeight: 56, cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🖨️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-gray-900)' }}>
              송장 인쇄
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
              입금완료 주문 라벨 일괄 출력 · 테스트 가능
            </div>
          </div>
          <span style={{ color: 'var(--color-gray-300)', fontSize: '1.125rem' }}>&#8250;</span>
        </button>

        {/* 고객 화면 바로가기 */}
        <div style={{
          background: 'white', borderRadius: 12, padding: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1.5px solid var(--color-gray-200)',
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 4 }}>
            👀 고객 화면 바로가기
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginBottom: 10 }}>
            고객이 보는 두 탭 확인
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href="/shop/샤방이"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: '10px', borderRadius: 8,
                background: 'var(--color-teal)', color: 'white',
                textAlign: 'center', fontSize: '0.8125rem', fontWeight: 700,
                textDecoration: 'none', minHeight: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              🛍️ 쇼핑몰
            </a>
            <a
              href="/shop/샤방이/live"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: '10px', borderRadius: 8,
                background: 'var(--color-pink)', color: 'white',
                textAlign: 'center', fontSize: '0.8125rem', fontWeight: 700,
                textDecoration: 'none', minHeight: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              🔴 라이브몰
            </a>
          </div>
        </div>

        <RecentOrders orders={orders} loading={ordersLoading} />
        <ProductList products={products} loading={productsLoading} refetch={refetchProducts} />

        {orders.length === 0 && products.length === 0 && !ordersLoading && (
          <button
            className="btn-secondary"
            onClick={handleSeed}
            disabled={seeding}
            style={{ width: '100%', marginTop: 8 }}
          >
            {seeding ? '데이터 생성 중...' : '샘플 데이터 생성'}
          </button>
        )}
      </div>
      <FAB onClick={() => setPickerOpen(true)} />

      {/* 등록 방식 선택 시트 */}
      <BottomSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="상품 등록"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)', textAlign: 'center', marginBottom: 4 }}>
            어떤 방식으로 등록할까요?
          </div>

          {/* 라이브 빠른 등록 */}
          <button
            onClick={() => { setPickerOpen(false); setQuickAddOpen(true); }}
            style={pickerCardPrimary}
          >
            <div style={pickerIcon('rgba(255,255,255,0.2)')}>🔴</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>라이브 빠른 등록</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 2 }}>
                사진 + 이름/가격만 빠르게 (라이브몰)
              </div>
            </div>
            <span style={{ fontSize: '1.25rem', opacity: 0.7 }}>›</span>
          </button>

          {/* 쇼핑몰 정식 등록 */}
          <button
            onClick={() => { setPickerOpen(false); setShopFormOpen(true); }}
            style={pickerCardSecondary}
          >
            <div style={pickerIcon('var(--color-gray-100)', 'var(--color-gray-700)')}>🛍</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                쇼핑몰 정식 등록
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                옵션 · 상세이미지 · 상품정보 (쇼핑몰)
              </div>
            </div>
            <span style={{ fontSize: '1.25rem', color: 'var(--color-gray-400)' }}>›</span>
          </button>
        </div>
      </BottomSheet>

      {quickAddOpen && (
        <QuickAdd
          onClose={() => setQuickAddOpen(false)}
          onSuccess={() => { setQuickAddOpen(false); refetchProducts(); }}
          defaultIsLive={true}
        />
      )}
      {shopFormOpen && (
        <ShopProductForm
          onClose={() => setShopFormOpen(false)}
          onSuccess={() => { setShopFormOpen(false); refetchProducts(); }}
        />
      )}

      <BottomTabBar />
    </div>
  );
}

const pickerCardPrimary = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '16px 16px', minHeight: 72,
  borderRadius: 12, border: 'none',
  background: 'var(--color-pink)', color: 'white',
  cursor: 'pointer', width: '100%',
  boxShadow: '0 4px 12px rgba(255,75,110,0.25)',
};

const pickerCardSecondary = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '16px 16px', minHeight: 72,
  borderRadius: 12,
  border: '1px solid var(--color-gray-200)',
  background: 'white',
  cursor: 'pointer', width: '100%',
};

function pickerIcon(bg, color = 'white') {
  return {
    width: 44, height: 44, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: bg, color, fontSize: '1.375rem',
    flexShrink: 0,
  };
}
