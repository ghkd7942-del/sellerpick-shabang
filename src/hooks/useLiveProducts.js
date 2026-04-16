import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function useLiveProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'products'),
        where('isLive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setProducts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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
