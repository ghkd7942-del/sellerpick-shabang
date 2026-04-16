import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useOrders from '../hooks/useOrders';
import useProducts from '../hooks/useProducts';
import useStats from '../hooks/useStats';
import { seedSampleData } from '../lib/seedData';
import AdminHeader from '../components/AdminHeader';
import StatCards from '../components/StatCards';
import RecentOrders from '../components/RecentOrders';
import ProductList from '../components/ProductList';
import FAB from '../components/FAB';
import QuickAdd from '../components/QuickAdd';
import BottomTabBar from '../components/BottomTabBar';
import '../styles/admin.css';

export default function AdminDashboard() {
  const { orders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts();
  const { todayOrderCount, paidCount, todayRevenue } = useStats(orders);
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

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
      <FAB onClick={() => setQuickAddOpen(true)} />
      {quickAddOpen && (
        <QuickAdd
          onClose={() => setQuickAddOpen(false)}
          onSuccess={() => {}}
        />
      )}
      <BottomTabBar />
    </div>
  );
}
