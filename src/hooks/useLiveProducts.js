import { useState, useEffect, useCallback } from 'react';
import { getCollection } from '../lib/firestoreAPI';

export default function useLiveProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getCollection('products');
      setProducts(data.filter((p) => p.isLive === true));
    } catch (err) {
      console.error('Live products fetch error:', err);
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
