// 알림톡 클라이언트 헬퍼 — /api/send-alimtalk 호출
// 템플릿 ID는 카카오 비즈메시지 센터에서 승인 받은 후 교체 필요
// 환경변수(클라이언트용)가 아닌 서버리스 함수에서 env 읽음

import { getCourier, getTrackingUrl } from './couriers';

// 템플릿 ID (카카오 심사 승인 후 실제 ID로 교체)
export const ALIMTALK_TEMPLATES = {
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED_V1',
  SHIPPING_STARTED: 'SHIPPING_STARTED_V1',
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

// 입금 확인 알림
export function notifyPaymentConfirmed(order) {
  if (!order?.phone) return Promise.resolve({ ok: false, error: 'no phone' });
  return callApi({
    to: order.phone,
    templateId: ALIMTALK_TEMPLATES.PAYMENT_CONFIRMED,
    variables: {
      '#{name}': order.buyerName || '',
      '#{product}': order.productName || '',
      '#{price}': (order.price || 0).toLocaleString('ko-KR'),
    },
    text: `[샤방이] ${order.buyerName || '고객'}님, 입금이 확인되었습니다. 곧 배송이 시작됩니다.`,
  });
}

// 배송 시작 알림
export function notifyShippingStarted(order, courierCode, trackingNumber) {
  if (!order?.phone) return Promise.resolve({ ok: false, error: 'no phone' });
  const courier = getCourier(courierCode);
  const trackingUrl = getTrackingUrl(courierCode, trackingNumber) || '';
  return callApi({
    to: order.phone,
    templateId: ALIMTALK_TEMPLATES.SHIPPING_STARTED,
    variables: {
      '#{name}': order.buyerName || '',
      '#{product}': order.productName || '',
      '#{courier}': courier?.name || '택배',
      '#{trackingNumber}': trackingNumber || '',
      '#{trackingUrl}': trackingUrl,
    },
    text: `[샤방이] ${order.buyerName || '고객'}님 주문 배송 시작. ${courier?.name || ''} ${trackingNumber || ''}`,
  });
}
