import { useState, useEffect, useCallback } from 'react';
import { getCollection } from '../lib/firestoreAPI';

export default function useLiveProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getCollection('products');
      // 모든 상품 노출 (쇼핑몰 모드). 라이브 방송 시엔 session.currentProductId가 상단으로 정렬됨.
      // 품절이어도 보이고 "품절" 뱃지로 표시 — 재고 0이라고 숨기진 않음.
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProducts(data);
    } catch (err) {
      console.error('Shop products fetch error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  return { products, loading };
}
