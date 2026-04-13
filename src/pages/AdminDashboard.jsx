import { useState } from 'react';
import useOrders from '../hooks/useOrders';
import useProducts from '../hooks/useProducts';
import useStats from '../hooks/useStats';
import { seedSampleData } from '../lib/seedData';
import AdminHeader from '../components/AdminHeader';
import StatCards from '../components/StatCards';
import LiveBanner from '../components/LiveBanner';
import RecentOrders from '../components/RecentOrders';
import ProductList from '../components/ProductList';
import FAB from '../components/FAB';
import BottomSheet from '../components/BottomSheet';
import ProductForm from '../components/ProductForm';
import BottomTabBar from '../components/BottomTabBar';
import '../styles/admin.css';

export default function AdminDashboard() {
  const { orders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading } = useProducts();
  const { todayOrderCount, paidCount, todayRevenue } = useStats(orders);
  const [seeding, setSeeding] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

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
        <LiveBanner />
        <RecentOrders orders={orders} loading={ordersLoading} />
        <ProductList products={products} loading={productsLoading} />

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
      <FAB onClick={() => setSheetOpen(true)} />
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="즉석 상품 등록"
      >
        <ProductForm
          onClose={() => setSheetOpen(false)}
          onSuccess={() => {}}
        />
      </BottomSheet>
      <BottomTabBar />
    </div>
  );
}
