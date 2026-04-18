import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import OrderManagement from './pages/OrderManagement';
import Settlement from './pages/Settlement';
import LiveMode from './pages/LiveMode';
import PrintLabels from './pages/PrintLabels';
import ProductManagement from './pages/ProductManagement';
import SellerSettings from './pages/SellerSettings';
import CustomerManagement from './pages/CustomerManagement';
import ShopHome from './pages/ShopHome';
import LiveMall from './pages/LiveMall';
import OrderForm from './pages/OrderForm';
import Checkout from './pages/Checkout';
import OrderComplete from './pages/OrderComplete';
import OrderTrack from './pages/OrderTrack';
import CustomerLogin from './pages/CustomerLogin';
import MyPage from './pages/MyPage';
import Legal from './pages/Legal';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* 관리자 — 로그인 필수 */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><OrderManagement /></ProtectedRoute>} />
          <Route path="/admin/settlement" element={<ProtectedRoute><Settlement /></ProtectedRoute>} />
          <Route path="/admin/live" element={<ProtectedRoute><LiveMode /></ProtectedRoute>} />
          <Route path="/admin/print" element={<ProtectedRoute><PrintLabels /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><SellerSettings /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute><CustomerManagement /></ProtectedRoute>} />

          {/* 법적 페이지 (토스 심사용) */}
          <Route path="/legal/:slug" element={<Legal />} />

          {/* 고객 — 로그인 불필요 */}
          <Route path="/shop/:sellerSlug" element={<ShopHome />} />
          <Route path="/shop/:sellerSlug/live" element={<LiveMall />} />
          <Route path="/shop/:sellerSlug/order/:productId" element={<OrderForm />} />
          <Route path="/shop/:sellerSlug/checkout/:productId" element={<Checkout />} />
          <Route path="/shop/:sellerSlug/order-complete" element={<OrderComplete />} />
          <Route path="/shop/:sellerSlug/orders" element={<OrderTrack />} />
          <Route path="/shop/:sellerSlug/login" element={<CustomerLogin />} />
          <Route path="/shop/:sellerSlug/my" element={<MyPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
