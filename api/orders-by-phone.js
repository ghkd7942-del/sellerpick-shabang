// Vercel Serverless Function — 전화번호로 본인 주문 조회 (Admin SDK)
//
// 정식 보안 규칙 하에서는 orders read 가 관리자만 가능합니다.
// 고객의 주문 조회 페이지(OrderTrack)는 전화번호를 입력해서 본인 주문을 검색해야 하므로,
// 이 함수가 Admin SDK 로 phone 일치하는 주문만 반환합니다.

import admin from './_firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const phone = (body?.phone || '').trim();
  if (!phone) {
    return res.status(400).json({ error: 'phone 필수' });
  }

  try {
    const snap = await admin.firestore()
      .collection('orders')
      .where('phone', '==', phone)
      .limit(200)
      .get();

    const orders = snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toDate?.()?.toISOString() || null;
      return { ...data, id: d.id, createdAt };
    });

    return res.status(200).json({ orders });
  } catch (err) {
    console.error('[orders-by-phone] 실패', err);
    return res.status(500).json({ error: '주문 조회 실패: ' + err.message });
  }
}
