import { useMemo } from 'react';

export default function useStats(orders) {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((o) => {
      const t = o.createdAt?.toDate?.() || new Date(o.createdAt);
      return t >= today;
    });

    return {
      todayOrderCount: todayOrders.length,
      paidCount: todayOrders.filter((o) => o.status === 'paid').length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + (o.price || 0), 0),
    };
  }, [orders]);
}
