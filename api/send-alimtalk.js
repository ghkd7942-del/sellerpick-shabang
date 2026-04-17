// Vercel Serverless Function — Solapi 알림톡 발송
// 필수 env vars: SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER, SOLAPI_PFID
// 키 미설정 시 mock 응답 (개발/테스트용)

import crypto from 'crypto';

const SOLAPI_URL = 'https://api.solapi.com/messages/v4/send';

function signAuth(apiKey, apiSecret) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    SOLAPI_API_KEY,
    SOLAPI_API_SECRET,
    SOLAPI_SENDER,
    SOLAPI_PFID,
  } = process.env;

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { to, templateId, variables = {}, text = '' } = body || {};

  if (!to || !templateId) {
    return res.status(400).json({ error: 'to, templateId 필수' });
  }

  // 키 미설정 → mock
  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER || !SOLAPI_PFID) {
    console.log('[알림톡 mock]', { to, templateId, variables, text });
    return res.status(200).json({ mock: true, to, templateId, variables });
  }

  const normalized = String(to).replace(/[^0-9]/g, '');

  // pfId 없으면 SMS/LMS로 폴백 (알림톡 템플릿 심사 전 테스트용)
  const useSms = !SOLAPI_PFID;
  const smsText = text || `[알림] ${Object.values(variables).join(' / ')}`;
  // 90바이트 이하면 SMS, 이상이면 LMS
  const byteLen = new TextEncoder().encode(smsText).length;
  const message = useSms
    ? {
        to: normalized,
        from: SOLAPI_SENDER,
        type: byteLen > 90 ? 'LMS' : 'SMS',
        text: smsText,
      }
    : {
        to: normalized,
        from: SOLAPI_SENDER,
        type: 'ATA',
        text,
        kakaoOptions: {
          pfId: SOLAPI_PFID,
          templateId,
          variables,
        },
      };

  try {
    const response = await fetch(SOLAPI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: signAuth(SOLAPI_API_KEY, SOLAPI_API_SECRET),
      },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('[메시지 발송 실패]', data);
      return res.status(response.status).json(data);
    }
    return res.status(200).json({ ...data, fallback: useSms ? 'sms' : 'alimtalk' });
  } catch (err) {
    console.error('[메시지 에러]', err);
    return res.status(500).json({ error: err.message });
  }
}
