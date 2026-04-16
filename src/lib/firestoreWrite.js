// Firestore REST API로 직접 쓰기 (SDK 우회)
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (val?.toDate) return { timestampValue: val.toDate().toISOString() };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

export async function addDocument(collectionName, data) {
  const url = `${BASE_URL}/${collectionName}?key=${API_KEY}`;
  const body = { fields: toFirestoreFields({ ...data, createdAt: new Date() }) };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Firestore 쓰기 실패');
  }

  const result = await res.json();
  const docPath = result.name;
  const docId = docPath.split('/').pop();
  return docId;
}

export async function updateDocument(collectionName, docId, data) {
  const fields = toFirestoreFields(data);
  const updateMask = Object.keys(data).map((f) => `updateMask.fieldPaths=${f}`).join('&');
  const url = `${BASE_URL}/${collectionName}/${docId}?${updateMask}&key=${API_KEY}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Firestore 업데이트 실패');
  }
}
