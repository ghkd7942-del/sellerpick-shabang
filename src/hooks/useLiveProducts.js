import { useState, useEffect, useCallback } from 'react';
import { getCollection } from '../lib/firestoreAPI';

// filter: 'all' | 'live' | 'shop'
//   live — isLive === true 만 (라이브몰)
//   shop — isLive !== true 만 (쇼핑몰)
//   all  — 전체
// 고객 대상 hook이므로 hidden === true 인 상품은 항상 제외
export default function useLiveProducts({ filter = 'all' } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getCollection('products');
      // 고객에게 보여지면 안 되는 숨김 상품 제외
      let filtered = data.filter((p) => p.hidden !== true);
      if (filter === 'live') filtered = filtered.filter((p) => p.isLive === true);
      else if (filter === 'shop') filtered = filtered.filter((p) => p.isLive !== true);
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProducts(filtered);
    } catch (err) {
      console.error('Products fetch error:', err);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  return { products, loading };
}
