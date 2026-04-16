// Firebase SDK 우회 — Firestore REST API 직접 사용
const PROJECT_ID = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
const API_KEY = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Firestore 값 → JS 값
function fromFirestore(val) {
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return { seconds: Math.floor(new Date(val.timestampValue).getTime() / 1000), toDate: () => new Date(val.timestampValue) };
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFirestore);
  if ('mapValue' in val) return fromFirestoreDoc(val.mapValue.fields || {});
  return val;
}

function fromFirestoreDoc(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = fromFirestore(v);
  }
  return obj;
}

// JS 값 → Firestore 값
function toFirestore(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (val?.toDate) return { timestampValue: val.toDate().toISOString() };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestore) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestore(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFirestore(v);
  return fields;
}

// 컬렉션 전체 읽기
export async function getCollection(collectionName) {
  const res = await fetch(`${BASE}/${collectionName}?key=${API_KEY}&pageSize=500`);
  if (!res.ok) throw new Error('읽기 실패: ' + res.status);
  const json = await res.json();
  if (!json.documents) return [];
  return json.documents.map((doc) => {
    const id = doc.name.split('/').pop();
    return { id, ...fromFirestoreDoc(doc.fields || {}) };
  });
}

// 단일 문서 읽기
export async function getDocument(collectionName, docId) {
  const res = await fetch(`${BASE}/${collectionName}/${docId}?key=${API_KEY}`);
  if (!res.ok) return null;
  const doc = await res.json();
  const id = doc.name.split('/').pop();
  return { id, ...fromFirestoreDoc(doc.fields || {}) };
}

// 문서 추가
export async function addDocument(collectionName, data) {
  const res = await fetch(`${BASE}/${collectionName}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields({ ...data, createdAt: new Date() }) }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || '쓰기 실패');
  }
  const result = await res.json();
  return result.name.split('/').pop();
}

// 문서 업데이트 (부분)
export async function updateDocument(collectionName, docId, data) {
  const fields = toFirestoreFields(data);
  const mask = Object.keys(data).map((f) => `updateMask.fieldPaths=${f}`).join('&');
  const res = await fetch(`${BASE}/${collectionName}/${docId}?${mask}&key=${API_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error('업데이트 실패');
}

// 문서 삭제
export async function deleteDocument(collectionName, docId) {
  const res = await fetch(`${BASE}/${collectionName}/${docId}?key=${API_KEY}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('삭제 실패');
}

// 문서 설정 (upsert)
export async function setDocument(collectionName, docId, data) {
  const res = await fetch(`${BASE}/${collectionName}/${docId}?key=${API_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) throw new Error('설정 실패');
}
