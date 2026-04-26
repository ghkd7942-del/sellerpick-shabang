// Vercel Serverless Function — 토스페이먼츠 결제 승인 + Firestore orders 업데이트
//
// 클라이언트가 successUrl로 돌아오면 { paymentKey, orderId, amount }를 POST.
// 서버가 TOSS_SECRET_KEY 로 승인 API 호출 → orders 문서에 결제 상태 반영.
//
// 필수 env: TOSS_SECRET_KEY, FIREBASE_SERVICE_ACCOUNT_KEY

import admin from './_firebaseAdmin.js';

const TOSS_URL = 'https://api.tosspayments.com/v1/payments/confirm';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { paymentKey, orderId, amount } = body || {};
  if (!paymentKey || !orderId || !amount) {
    return res.status(400).json({ error: 'paymentKey, orderId, amount 필수' });
  }

  const secretKey = (process.env.TOSS_SECRET_KEY || '').trim();
  if (!secretKey) {
    return res.status(500).json({ error: 'TOSS_SECRET_KEY 미설정' });
  }

  // 토스 승인 API — Basic 인증 헤더는 `base64(secretKey + ":")`
  const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

  let tossData;
  try {
    const response = await fetch(TOSS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });
    tossData = await response.json();
    if (!response.ok) {
      console.error('[toss-confirm] 승인 실패', tossData);
      // Firestore 주문은 pending 그대로 두고, 결제 실패 내역 기록
      try {
        const db = admin.firestore();
        await db.collection('orders').doc(orderId).set({
          paymentStatus: 'failed',
          paymentFailReason: tossData?.message || tossData?.code || '승인 실패',
          paymentFailCode: tossData?.code || '',
          paymentAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.error('[toss-confirm] fail log 저장 실패', e);
      }
      return res.status(response.status).json({
        error: tossData?.message || '결제 승인 실패',
        code: tossData?.code || '',
      });
    }
  } catch (err) {
    console.error('[toss-confirm] 네트워크 오류', err);
    return res.status(502).json({ error: '토스 API 통신 오류: ' + err.message });
  }

  // 승인 성공 → Firestore orders 업데이트
  try {
    const db = admin.firestore();
    const orderRef = db.collection('orders').doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) {
      console.error('[toss-confirm] 주문 문서 없음', orderId);
      return res.status(404).json({ error: '주문 정보를 찾을 수 없어요' });
    }

    const order = snap.data();

    // 금액 검증 — 클라이언트 조작 방지
    if (Number(order.price) !== Number(amount)) {
      console.error('[toss-confirm] 금액 불일치', { orderAmount: order.price, requestAmount: amount });
      // 이미 승인돼 버렸으니 즉시 취소
      try {
        await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cancelReason: '금액 검증 실패' }),
        });
      } catch (e) {
        console.error('[toss-confirm] 자동 취소 실패', e);
      }
      return res.status(400).json({ error: '주문 금액 불일치로 결제가 취소되었어요' });
    }

    // 이미 paid면 멱등 처리
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({ ok: true, idempotent: true, order });
    }

    await orderRef.set({
      paymentStatus: 'paid',
      // paymentMethod는 시스템 값('toss')으로 유지 — 필터/취소 로직에서 사용
      paymentMethod: 'toss',
      // 한국어 결제수단 라벨(카드/간편결제/계좌이체 등)은 별도 필드
      paymentMethodLabel: tossData.method || '카드·간편결제',
      paymentKey,
      tossOrderId: orderId,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'paid',
      rawPayment: {
        method: tossData.method,
        totalAmount: tossData.totalAmount,
        balanceAmount: tossData.balanceAmount,
        approvedAt: tossData.approvedAt,
        receipt: tossData.receipt?.url || '',
      },
    }, { merge: true });

    // 재고 차감 — 결제 승인 후
    if (order.productId && Number(order.qty) > 0) {
      const productRef = db.collection('products').doc(order.productId);
      await db.runTransaction(async (tx) => {
        const p = await tx.get(productRef);
        if (!p.exists) return;
        const currentStock = Number(p.data().stock || 0);
        const nextStock = Math.max(0, currentStock - Number(order.qty));
        tx.update(productRef, { stock: nextStock });
      });
    }

    return res.status(200).json({ ok: true, orderId, receiptUrl: tossData.receipt?.url });
  } catch (err) {
    console.error('[toss-confirm] Firestore 업데이트 실패', err);
    return res.status(500).json({ error: 'DB 업데이트 실패: ' + err.message });
  }
}
