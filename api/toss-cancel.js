// Vercel Serverless Function — 토스페이먼츠 결제 취소 + Firestore orders 업데이트
//
// 입력: { orderId, cancelReason }
// 동작:
//   1) Firestore order 문서 조회 → paymentKey, price, 이미 취소된 건 idempotent
//   2) 토스 /v1/payments/{paymentKey}/cancel 호출
//   3) orders 문서 상태/결제 상태 업데이트 (cancelled)
//   4) 재고 복원 (트랜잭션, shippingAt 이전에만)
//
// 필수 env: TOSS_SECRET_KEY, FIREBASE_SERVICE_ACCOUNT_KEY

import admin from './_firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { orderId, cancelReason } = body || {};
  if (!orderId) {
    return res.status(400).json({ error: 'orderId 필수' });
  }

  const secretKey = (process.env.TOSS_SECRET_KEY || '').trim();
  if (!secretKey) {
    return res.status(500).json({ error: 'TOSS_SECRET_KEY 미설정' });
  }

  const db = admin.firestore();
  const orderRef = db.collection('orders').doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) {
    return res.status(404).json({ error: '주문을 찾을 수 없어요' });
  }
  const order = snap.data();

  // 이미 취소된 건 idempotent
  if (order.status === 'cancelled' || order.paymentStatus === 'cancelled') {
    return res.status(200).json({ ok: true, idempotent: true });
  }

  // 토스 결제가 아니면 에러 — 무통장 취소는 별도 경로로
  if (order.paymentMethod !== 'toss' && !order.paymentKey) {
    return res.status(400).json({ error: '토스 결제 건만 자동 취소할 수 있어요' });
  }

  // 결제 승인 전이면 토스 호출 없이 로컬만 처리 (pending_payment)
  if (!order.paymentKey) {
    await orderRef.set({
      status: 'cancelled',
      paymentStatus: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelReason: cancelReason || '결제 전 취소',
    }, { merge: true });
    return res.status(200).json({ ok: true, skippedToss: true });
  }

  const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

  let tossData;
  try {
    const response = await fetch(
      `https://api.tosspayments.com/v1/payments/${encodeURIComponent(order.paymentKey)}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancelReason: cancelReason || '판매자 취소' }),
      },
    );
    tossData = await response.json();
    if (!response.ok) {
      console.error('[toss-cancel] 취소 실패', tossData);
      return res.status(response.status).json({
        error: tossData?.message || '결제 취소 실패',
        code: tossData?.code || '',
      });
    }
  } catch (err) {
    console.error('[toss-cancel] 네트워크 오류', err);
    return res.status(502).json({ error: '토스 API 통신 오류: ' + err.message });
  }

  // Firestore 업데이트 + 재고 복원 (이미 배송 완료면 복원 X)
  try {
    await orderRef.set({
      status: 'cancelled',
      paymentStatus: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelReason: cancelReason || '판매자 취소',
      cancelAmount: tossData.totalAmount || order.price || 0,
    }, { merge: true });

    // 배송 전이면 재고 복원
    const shouldRestock = !order.shippedAt && order.productId && Number(order.qty) > 0;
    if (shouldRestock) {
      const productRef = db.collection('products').doc(order.productId);
      await db.runTransaction(async (tx) => {
        const p = await tx.get(productRef);
        if (!p.exists) return;
        const currentStock = Number(p.data().stock || 0);
        tx.update(productRef, { stock: currentStock + Number(order.qty) });
      });
    }

    return res.status(200).json({ ok: true, restocked: shouldRestock });
  } catch (err) {
    console.error('[toss-cancel] Firestore 업데이트 실패', err);
    return res.status(500).json({
      error: 'DB 업데이트 실패 (토스는 취소됨): ' + err.message,
    });
  }
}
