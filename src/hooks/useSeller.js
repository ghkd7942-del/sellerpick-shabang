import { useState, useEffect, useCallback } from 'react';
import { getDocument, updateDocument } from '../lib/firestoreAPI';
import { resolveSellerSlug, DEFAULT_SELLER_SLUG } from '../lib/sellers';

const POLL_MS = 3000;

export default function useSeller(rawSlug) {
  const slug = resolveSellerSlug(rawSlug || DEFAULT_SELLER_SLUG);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSeller = useCallback(async () => {
    try {
      const data = await getDocument('sellers', slug);
      setSeller(data);
    } catch (err) {
      console.error('Seller fetch error:', err);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchSeller();
    const t = setInterval(fetchSeller, POLL_MS);
    return () => clearInterval(t);
  }, [fetchSeller]);

  const toggleLive = useCallback(async (next) => {
    const patch = { isLive: !!next };
    if (next) patch.liveStartedAt = new Date();
    await updateDocument('sellers', slug, patch);
    setSeller((prev) => ({ ...(prev || {}), ...patch }));
  }, [slug]);

  return { seller, slug, loading, toggleLive, refetch: fetchSeller };
}
