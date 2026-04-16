import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function useLiveProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const data = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.isLive === true);
      setProducts(data);
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
