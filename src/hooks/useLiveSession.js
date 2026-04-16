import { useState, useEffect, useCallback } from 'react';
import { getDocument, setDocument, updateDocument } from '../lib/firestoreAPI';

export default function useLiveSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getDocument('liveSession', 'current');
      setSession(data);
    } catch (err) {
      console.error('LiveSession error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const startSession = useCallback(async (productIds, youtubeVideoId = '') => {
    await setDocument('liveSession', 'current', {
      isActive: true,
      currentProductId: productIds[0] || '',
      productOrder: productIds,
      youtubeVideoId,
      startedAt: new Date(),
    });
    fetchSession();
  }, [fetchSession]);

  const endSession = useCallback(async () => {
    await updateDocument('liveSession', 'current', { isActive: false });
    fetchSession();
  }, [fetchSession]);

  const setCurrentProduct = useCallback(async (productId) => {
    await updateDocument('liveSession', 'current', { currentProductId: productId });
    fetchSession();
  }, [fetchSession]);

  const nextProduct = useCallback(async () => {
    if (!session?.productOrder) return;
    const arr = Array.isArray(session.productOrder) ? session.productOrder : [];
    const idx = arr.indexOf(session.currentProductId);
    const next = arr[(idx + 1) % arr.length];
    await updateDocument('liveSession', 'current', { currentProductId: next });
    fetchSession();
  }, [session, fetchSession]);

  const prevProduct = useCallback(async () => {
    if (!session?.productOrder) return;
    const arr = Array.isArray(session.productOrder) ? session.productOrder : [];
    const idx = arr.indexOf(session.currentProductId);
    const prev = arr[(idx - 1 + arr.length) % arr.length];
    await updateDocument('liveSession', 'current', { currentProductId: prev });
    fetchSession();
  }, [session, fetchSession]);

  const updateYoutubeId = useCallback(async (youtubeVideoId) => {
    await updateDocument('liveSession', 'current', { youtubeVideoId });
    fetchSession();
  }, [fetchSession]);

  return { session, loading, startSession, endSession, setCurrentProduct, nextProduct, prevProduct, updateYoutubeId };
}
