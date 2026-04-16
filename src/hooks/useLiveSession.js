import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addDocument, updateDocument } from '../lib/firestoreWrite';

export default function useLiveSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'liveSession', 'current'));
      setSession(snap.exists() ? snap.data() : null);
    } catch (err) {
      console.error('LiveSession fetch error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const startSession = useCallback(async (productIds, youtubeVideoId = '') => {
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/liveSession?documentId=current&key=${import.meta.env.VITE_FIREBASE_API_KEY}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            isActive: { booleanValue: true },
            currentProductId: { stringValue: productIds[0] || '' },
            productOrder: { arrayValue: { values: productIds.map(id => ({ stringValue: id })) } },
            youtubeVideoId: { stringValue: youtubeVideoId },
            startedAt: { timestampValue: new Date().toISOString() },
          },
        }),
      }
    );
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
    const arr = session.productOrder.map ? session.productOrder : [];
    const idx = arr.indexOf(session.currentProductId);
    const next = arr[(idx + 1) % arr.length];
    await updateDocument('liveSession', 'current', { currentProductId: next });
    fetchSession();
  }, [session, fetchSession]);

  const prevProduct = useCallback(async () => {
    if (!session?.productOrder) return;
    const arr = session.productOrder.map ? session.productOrder : [];
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
