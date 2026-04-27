// 알림톡 클라이언트 헬퍼 — /api/send-alimtalk 호출
// 템플릿 ID는 카카오 비즈메시지 센터에서 승인 받은 후 실제 ID로 교체 필요
// (현재는 placeholder ID 사용 + SMS fallback 으로 발송됨)

import { getCourier, getTrackingUrl } from './couriers';

// 템플릿 ID (카카오 심사 승인 후 실제 ID로 교체)
// TODO: 승인 완료되면 여기만 바꾸면 됨
export const ALIMTALK_TEMPLATES = {
  ORDER_RECEIVED: 'ORDER_RECEIVED_V1',       // 주문 접수 (무통장 입금 안내)
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED_V1', // 결제 완료
  SHIPPING_STARTED: 'SHIPPING_STARTED_V1',   // 배송 시작 (송장 있음)
  SHIPPING_DELIVERED: 'SHIPPING_DELIVERED_V1', // 배송 완료
  ORDER_CANCELLED: 'ORDER_CANCELLED_V1',     // 주문/결제 취소
};

// 사람이 읽기 좋은 라벨 (UI에서 사용)
export const ALIMTALK_LABELS = {
  [ALIMTALK_TEMPLATES.ORDER_RECEIVED]: '주문 접수 안내',
  [ALIMTALK_TEMPLATES.PAYMENT_CONFIRMED]: '결제 완료 알림',
  [ALIMTALK_TEMPLATES.SHIPPING_STARTED]: '배송 시작 알림',
  [ALIMTALK_TEMPLATES.SHIPPING_DELIVERED]: '배송 완료 알림',
  [ALIMTALK_TEMPLATES.ORDER_CANCELLED]: '주문 취소 알림',
};

async function callApi(payload) {
  try {
    const res = await fetch('/api/send-alimtalk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn('알림톡 응답 에러:', json);
      return { ok: false, ...json };
    }
    return { ok: true, ...json };
  } catch (err) {
    console.warn('알림톡 호출 실패:', err);
    return { ok: false, error: err.message };
  }
}

// 주문 접수 (무통장 입금 대기) ----------------------------------
export function notifyOrderReceived(order) {
  if (!order?.phone) return Promise.resolve({ ok: false, error: 'no phone' });
  const price = (order.price || 0).toLocaleString('ko-KR');
  return callApi({
    to: order.phone,
    orderId: order.id || '',
    templateId: ALIMTALK_TEMPLATES.ORDER_RECEIVED,
    variables: {
      '#{name}': order.buyerName || '',
      '#{product}': order.productName || '',
      '#{price}': price,
    },
    text: `[샤방이] ${order.buyerName || '고객'}님 주문 접수됐어요.\n${order.productName || ''} · ${price}원\n국민은행 000-0000-0000 (예금주: 샤방이)로 입금해주세요.`,
  });
}

// 결제 완료 (토스 승인 또는 무통장 확인) ------------------------
export function notifyPaymentConfirmed(order) {
  if (!order?.phone) return Promise.resolve({ ok: false, error: 'no phone' });
  return callApi({
    to: order.phone,
    orderId: order.id || '',
    templateId: ALIMTALK_TEMPLATES.PAYMENT_CONFIRMED,
    variables: {
      '#{name}': order.buyerName || '',
      '#{product}': order.productName || '',
      '#{price}': (order.price || 0).toLocaleString('ko-KR'),
    },
    text: `[샤방이] ${order.buyerName || '고객'}님, 결제가 확인됐어요. 곧 배송이 시작됩니다.`,
  });
}

// 배송 시작 -----------------------------------------------------
export function notifyShippingStarted(order, courierCode, trackingNumber) {
  if (!order?.phone) return Promise.resolve({ ok: false, error: 'no phone' });
  const courier = getCourier(courierCode);
  const trackingUrl = getTrackingUrl(courierCode, trackingNumber) || '';
  return callApi({
    to: order.phone,
    orderId: order.id || '',
    templateId: ALIMTALK_TEMPLATES.SHIPPING_STARTED,
    variables: {
      '#{name}': order.buyerName || '',
      '#{product}': order.productName || '',
      '#{courier}': courier?.name || '택배',
      '#{trackingNumber}': trackingNumber || '',
      '#{trackingUrl}': trackingUrl,
    },
    text: `[샤방이] ${order.buyerName || '고객'}님 주문 배송 시작.\n${courier?.name || ''} ${trackingNumber || ''}${trackingUrl ? `\n조회: ${trackingUrl}` : ''}`,
  });
}

// 배송 완료 -----------------------------------------------------
export function notifyShippingDelivered(order) {
  if (!order?.phone) return Promise.resolve({ ok: false, error: 'no phone' });
  return callApi({
    to: order.phone,
    orderId: order.id || '',
    templateId: ALIMTALK_TEMPLATES.SHIPPING_DELIVERED,
    variables: {
      '#{name}': order.buyerName || '',
      '#{product}': order.productName || '',
    },
    text: `[샤방이] ${order.buyerName || '고객'}님, 배송이 완료됐어요. 제품이 마음에 드시길 바라요! 🎀`,
  });
}

// 주문/결제 취소 ------------------------------------------------
export function notifyOrderCancelled(order, reason) {
  if (!order?.phone) return Promise.resolve({ ok: false, error: 'no phone' });
  return callApi({
    to: order.phone,
    orderId: order.id || '',
    templateId: ALIMTALK_TEMPLATES.ORDER_CANCELLED,
    variables: {
      '#{name}': order.buyerName || '',
      '#{product}': order.productName || '',
      '#{price}': (order.price || 0).toLocaleString('ko-KR'),
      '#{reason}': reason || '',
    },
    text: `[샤방이] ${order.buyerName || '고객'}님 주문이 취소됐어요.\n${order.productName || ''}${reason ? `\n사유: ${reason}` : ''}`,
  });
}

// 상태별 알림 재전송 — OrderDetail "다시 보내기" 버튼용
export function resendForStatus(order) {
  if (order.status === 'new') return notifyOrderReceived(order);
  if (order.status === 'paid') return notifyPaymentConfirmed(order);
  if (order.status === 'shipping') return notifyShippingStarted(order, order.courier, order.trackingNumber);
  if (order.status === 'done') return notifyShippingDelivered(order);
  if (order.status === 'cancelled') return notifyOrderCancelled(order, order.cancelReason);
  return Promise.resolve({ ok: false, error: '재전송 가능한 상태가 아니에요' });
}
