import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import OrderManagement from './pages/OrderManagement';
import Settlement from './pages/Settlement';
import ShopHome from './pages/ShopHome';
import OrderForm from './pages/OrderForm';
import OrderComplete from './pages/OrderComplete';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<OrderManagement />} />
        <Route path="/admin/settlement" element={<Settlement />} />
        <Route path="/shop/:sellerSlug" element={<ShopHome />} />
        <Route path="/shop/:sellerSlug/order/:productId" element={<OrderForm />} />
        <Route path="/shop/:sellerSlug/order-complete" element={<OrderComplete />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
