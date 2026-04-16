import { useState, useEffect, useCallback } from 'react';
import { getCollection } from '../lib/firestoreAPI';

export default function useOrders(limitCount = 50) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getCollection('orders');
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(data.slice(0, limitCount));
    } catch (err) {
      console.error('Orders fetch error:', err);
    }
    setLoading(false);
  }, [limitCount]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  return { orders, loading, refetch: fetchOrders };
}
