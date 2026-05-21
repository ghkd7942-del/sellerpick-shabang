// Firebase SDK 기반 Firestore 헬퍼.
// 인증 토큰이 자동으로 실려야 보안 규칙(관리자 이메일 화이트리스트, customers 본인 등)이 동작합니다.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export async function getCollection(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getDocument(collectionName, docId) {
  const snap = await getDoc(doc(db, collectionName, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function addDocument(collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocument(collectionName, docId, data) {
  await updateDoc(doc(db, collectionName, docId), data);
}

export async function deleteDocument(collectionName, docId) {
  await deleteDoc(doc(db, collectionName, docId));
}

export async function setDocument(collectionName, docId, data) {
  await setDoc(doc(db, collectionName, docId), data);
}
