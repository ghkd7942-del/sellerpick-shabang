import { useState, useEffect, useCallback } from 'react';
import { getDocument, setDocument } from '../lib/firestoreAPI';
import useAuth from './useAuth';

export default function useCustomerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    (async () => {
      const data = await getDocument('customers', user.uid);
      if (data) {
        setProfile(data);
      } else {
        // 새 고객 — 기본 프로필 생성
        const newProfile = {
          name: user.displayName || '',
          phone: '',
          address: '',
          email: user.email || '',
          createdAt: new Date().toISOString(),
        };
        await setDocument('customers', user.uid, newProfile);
        setProfile(newProfile);
      }
      setLoading(false);
    })();
  }, [user]);

  const updateProfile = useCallback(async (data) => {
    if (!user) return;
    await setDocument('customers', user.uid, data);
    setProfile((prev) => ({ ...prev, ...data }));
  }, [user]);

  return { profile, loading, updateProfile };
}
