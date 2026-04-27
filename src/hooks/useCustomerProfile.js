import { useState, useEffect, useCallback } from 'react';
import { getDocument, setDocument, updateDocument } from '../lib/firestoreAPI';
import useAuth from './useAuth';

function inferProvider(user) {
  if (user.uid?.startsWith('kakao:')) return 'kakao';
  const providerId = user.providerData?.[0]?.providerId || '';
  if (providerId === 'google.com') return 'google';
  return providerId || 'unknown';
}

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
        if (!data.provider) {
          const provider = inferProvider(user);
          await updateDocument('customers', user.uid, { provider });
          setProfile({ ...data, provider });
        } else {
          setProfile(data);
        }
      } else {
        const newProfile = {
          name: user.displayName || '',
          phone: '',
          address: '',
          email: user.email || '',
          provider: inferProvider(user),
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
