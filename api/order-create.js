// Vercel Serverless Function — 비회원 주문 생성 (Admin SDK)
//
// 정식 보안 규칙 하에서는 client 가 orders 생성은 허용되지만 products.stock 수정은 막혀 있습니다.
// 무통장 입금은 주문 생성 즉시 재고 차감이 필요하므로 이 함수가 Admin SDK 로 처리.
// 토스 결제는 paymentStatus=pending 으로 주문만 만들고, 재고 차감은 toss-confirm 에서.

import admin from './_firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const {
    buyerName,
    phone,
    address,
    productId,
    productName,
    price,
    option,
    qty,
    paymentMethod,
  } = body || {};

  if (!buyerName || !phone || !productId || !productName) {
    return res.status(400).json({ error: 'buyerName, phone, productId, productName 필수' });
  }
  if (!Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: 'price 가 올바르지 않아요' });
  }
  const needed = Number(qty) || 1;
  if (needed < 1) {
    return res.status(400).json({ error: 'qty 가 올바르지 않아요' });
  }
  if (paymentMethod !== 'toss' && paymentMethod !== 'bank') {
    return res.status(400).json({ error: 'paymentMethod 는 toss/bank 중 하나' });
  }

  const db = admin.firestore();

  try {
    const productRef = db.collection('products').doc(productId);
    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;

    await db.runTransaction(async (tx) => {
      const p = await tx.get(productRef);
      if (!p.exists) {
        throw new Error('PRODUCT_NOT_FOUND');
      }
      const currentStock = Number(p.data().stock || 0);
      if (currentStock < needed) {
        throw new Error(currentStock === 0 ? 'OUT_OF_STOCK' : 'INSUFFICIENT_STOCK');
      }

      tx.set(orderRef, {
        buyerName,
        phone,
        address: address || '',
        productId,
        productName,
        price: Number(price),
        option: option || '',
        qty: needed,
        paymentMethod,
        paymentStatus: paymentMethod === 'toss' ? 'pending' : 'awaiting_deposit',
        status: paymentMethod === 'toss' ? 'pending_payment' : 'new',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (paymentMethod === 'bank') {
        tx.update(productRef, { stock: currentStock - needed });
      }
    });

    return res.status(200).json({ orderId });
  } catch (err) {
    const code = err.message;
    if (code === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ error: '상품 정보를 찾을 수 없어요' });
    }
    if (code === 'OUT_OF_STOCK') {
      return res.status(409).json({ error: '품절된 상품입니다.' });
    }
    if (code === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({ error: '선택하신 수량으로는 주문할 수 없습니다.' });
    }
    console.error('[order-create] 실패', err);
    return res.status(500).json({ error: '주문 생성 실패: ' + err.message });
  }
}
