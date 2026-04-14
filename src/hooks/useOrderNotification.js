import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function useOrderNotification() {
  const [latestOrder, setLatestOrder] = useState(null);
  const [hasNew, setHasNew] = useState(false);
  const lastSeenId = useRef(null);
  const audioCtxRef = useRef(null);
  const isFirstSnapshot = useRef(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      const order = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

      // 첫 스냅샷은 기존 데이터이므로 알림 안 함
      if (isFirstSnapshot.current) {
        lastSeenId.current = order.id;
        isFirstSnapshot.current = false;
        return;
      }

      if (order.id !== lastSeenId.current) {
        lastSeenId.current = order.id;
        setLatestOrder(order);
        setHasNew(true);
        playNotificationSound();
      }
    });

    return () => unsubscribe();
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
