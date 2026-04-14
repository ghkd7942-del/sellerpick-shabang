import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
      const snap = await getDoc(doc(db, 'customers', user.uid));
      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        // 새 고객 — 기본 프로필 생성
        const newProfile = {
          name: user.displayName || '',
          phone: '',
          address: '',
          email: user.email || '',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'customers', user.uid), newProfile);
        setProfile(newProfile);
      }
      setLoading(false);
    })();
  }, [user]);

  const updateProfile = useCallback(async (data) => {
    if (!user) return;
    await setDoc(doc(db, 'customers', user.uid), data, { merge: true });
    setProfile((prev) => ({ ...prev, ...data }));
  }, [user]);

  return { profile, loading, updateProfile };
}
