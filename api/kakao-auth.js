import admin from './_firebaseAdmin.js';

const dbAdmin = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirectUri, sellerSlug } = req.body || {};
  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'code, redirectUri 필수' });
  }

  const restKey = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  if (!restKey) {
    return res.status(500).json({ error: 'KAKAO_REST_API_KEY 미설정' });
  }

  try {
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: restKey,
      redirect_uri: redirectUri,
      code,
    });
    if (clientSecret) tokenParams.set('client_secret', clientSecret);

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[kakao-auth] token exchange failed:', tokenData);
      return res.status(400).json({
        error: '카카오 토큰 발급 실패',
        detail: tokenData,
        debug: {
          client_id_used: restKey ? restKey.slice(0, 8) + '...' + restKey.slice(-4) : 'MISSING',
          client_secret_used: clientSecret ? 'YES (len=' + clientSecret.length + ')' : 'NO',
          redirect_uri: redirectUri,
        },
      });
    }

    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const kakaoUser = await userRes.json();
    if (!userRes.ok || !kakaoUser.id) {
      console.error('[kakao-auth] user info failed:', kakaoUser);
      return res.status(400).json({ error: '카카오 사용자 정보 조회 실패', detail: kakaoUser });
    }

    const kakaoId = String(kakaoUser.id);
    const uid = `kakao:${kakaoId}`;
    const kakaoAccount = kakaoUser.kakao_account || {};
    const profile = kakaoAccount.profile || {};
    const name = profile.nickname || '';
    const photoURL = profile.profile_image_url || '';
    const email = kakaoAccount.email || '';

    try {
      await admin.auth().updateUser(uid, {
        displayName: name || undefined,
        photoURL: photoURL || undefined,
        ...(email ? { email } : {}),
      });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid,
          displayName: name || undefined,
          photoURL: photoURL || undefined,
          ...(email ? { email } : {}),
        });
      } else if (e.code === 'auth/email-already-exists') {
        await admin.auth().updateUser(uid, {
          displayName: name || undefined,
          photoURL: photoURL || undefined,
        });
      } else {
        throw e;
      }
    }

    // customers 컬렉션에 기록 (샤방이 스키마에 맞춤)
    const userRef = dbAdmin.collection('customers').doc(uid);
    const snap = await userRef.get();
    let isNew = false;
    let profileData;
    if (!snap.exists) {
      isNew = true;
      profileData = {
        uid,
        name,
        email,
        photoURL,
        provider: 'kakao',
        kakaoId,
        sellerSlug: sellerSlug || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await userRef.set(profileData);
    } else {
      const existing = snap.data();
      const updates = {};
      if (name && existing.name !== name) updates.name = name;
      if (photoURL && existing.photoURL !== photoURL) updates.photoURL = photoURL;
      if (email && existing.email !== email) updates.email = email;
      if (!existing.provider) updates.provider = 'kakao';
      if (Object.keys(updates).length) await userRef.set(updates, { merge: true });
      profileData = { ...existing, ...updates };
    }

    const firebaseToken = await admin.auth().createCustomToken(uid);

    return res.status(200).json({ firebaseToken, profile: profileData, isNew });
  } catch (err) {
    console.error('[kakao-auth] error:', err);
    return res.status(500).json({ error: '카카오 로그인 실패', detail: err.message });
  }
}
