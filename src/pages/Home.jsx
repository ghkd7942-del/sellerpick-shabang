import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { addDocument } from '../lib/firestoreWrite';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [result, setResult] = useState('');
  const [testing, setTesting] = useState(false);

  const testWrite = async () => {
    setTesting(true);
    setResult('Firestore 쓰기 테스트 중...');
    try {
      const docId = await addDocument('_test', { msg: 'hello' });
      setResult('✅ 쓰기 성공! ID: ' + docId);
    } catch (err) {
      setResult('❌ 쓰기 실패: ' + err.code + ' — ' + err.message);
    }
    setTesting(false);
  };

  const testRead = async () => {
    setTesting(true);
    setResult('Firestore 읽기 테스트 중...');
    try {
      const snap = await getDocs(collection(db, 'products'));
      setResult('✅ 읽기 성공! products: ' + snap.size + '개');
    } catch (err) {
      setResult('❌ 읽기 실패: ' + err.code + ' — ' + err.message);
    }
    setTesting(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 430, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: 'var(--color-pink)', fontSize: '2rem', marginBottom: 8 }}>
        셀러픽
      </h1>
      <p style={{ color: 'var(--color-gray-500)', marginBottom: 32 }}>Firebase 연결 테스트</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn-primary" onClick={testWrite} disabled={testing}
          style={{ padding: 14, fontSize: '1rem' }}>
          Firestore 쓰기 테스트
        </button>
        <button className="btn-secondary" onClick={testRead} disabled={testing}
          style={{ padding: 14, fontSize: '1rem' }}>
          Firestore 읽기 테스트
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: 20, padding: 16, borderRadius: 12,
          background: result.includes('✅') ? '#ECFDF5' : result.includes('❌') ? '#FEF2F2' : '#F3F4F6',
          fontSize: '0.875rem', textAlign: 'left', wordBreak: 'break-all',
          color: result.includes('✅') ? '#065F46' : result.includes('❌') ? '#991B1B' : '#374151',
        }}>
          {result}
        </div>
      )}

      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => navigate('/login')}
          style={{ padding: 14, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-pink)', border: '1px solid var(--color-pink)', borderRadius: 12, minHeight: 48 }}>
          로그인 페이지로
        </button>
      </div>
    </div>
  );
}
