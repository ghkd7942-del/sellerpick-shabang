import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SESSION_REF = doc(db, 'liveSession', 'current');

export default function useLiveSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      SESSION_REF,
      (snap) => {
        setSession(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        console.error('LiveSession error:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const startSession = useCallback(async (productIds, youtubeVideoId = '') => {
    await setDoc(SESSION_REF, {
      isActive: true,
      currentProductId: productIds[0] || '',
      productOrder: productIds,
      youtubeVideoId,
      startedAt: Timestamp.now(),
    });
  }, []);

  const updateYoutubeId = useCallback(async (youtubeVideoId) => {
    await setDoc(SESSION_REF, { youtubeVideoId }, { merge: true });
  }, []);

  const endSession = useCallback(async () => {
    await setDoc(SESSION_REF, { isActive: false }, { merge: true });
  }, []);

  const setCurrentProduct = useCallback(async (productId) => {
    await setDoc(SESSION_REF, { currentProductId: productId }, { merge: true });
  }, []);

  const nextProduct = useCallback(async () => {
    if (!session?.productOrder) return;
    const idx = session.productOrder.indexOf(session.currentProductId);
    const next = session.productOrder[(idx + 1) % session.productOrder.length];
    await setDoc(SESSION_REF, { currentProductId: next }, { merge: true });
  }, [session]);

  const prevProduct = useCallback(async () => {
    if (!session?.productOrder) return;
    const idx = session.productOrder.indexOf(session.currentProductId);
    const prev = session.productOrder[(idx - 1 + session.productOrder.length) % session.productOrder.length];
    await setDoc(SESSION_REF, { currentProductId: prev }, { merge: true });
  }, [session]);

  return { session, loading, startSession, endSession, setCurrentProduct, nextProduct, prevProduct, updateYoutubeId };
}
