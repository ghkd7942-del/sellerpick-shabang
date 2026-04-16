import { useState, useEffect, useRef, useCallback } from 'react';
import { getCollection } from '../lib/firestoreAPI';

export default function useOrderNotification() {
  const [latestOrder, setLatestOrder] = useState(null);
  const [hasNew, setHasNew] = useState(false);
  const lastSeenId = useRef(null);
  const audioCtxRef = useRef(null);
  const isFirstPoll = useRef(true);

  useEffect(() => {
    let cancelled = false;

    const pollOrders = async () => {
      try {
        const orders = await getCollection('orders');
        if (cancelled || orders.length === 0) return;

        // Sort by createdAt desc, take first
        const sorted = [...orders].sort((a, b) => {
          const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return tb - ta;
        });
        const order = sorted[0];

        if (isFirstPoll.current) {
          lastSeenId.current = order.id;
          isFirstPoll.current = false;
          return;
        }

        if (order.id !== lastSeenId.current) {
          lastSeenId.current = order.id;
          setLatestOrder(order);
          setHasNew(true);
          playNotificationSound();
        }
      } catch {
        // polling error, ignore
      }
    };

    pollOrders();
    const interval = setInterval(pollOrders, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const playNotificationSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // 오디오 실패해도 무시
    }
  };

  const clearNew = useCallback(() => setHasNew(false), []);

  return { latestOrder, hasNew, clearNew };
}
