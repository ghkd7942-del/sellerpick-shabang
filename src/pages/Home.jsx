import { useState } from 'react';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Home() {
  const [status, setStatus] = useState({
    firestore: null,
    testing: false,
  });

  const testFirebase = async () => {
    console.log('Test started');
    setStatus({ firestore: null, testing: true });

    try {
      console.log('Testing Firestore...');
      const testRef = doc(db, '_test', 'connection');
      await setDoc(testRef, { timestamp: new Date().toISOString() });
      console.log('Firestore write OK');
      const snap = await getDoc(testRef);
      if (snap.exists()) {
        await deleteDoc(testRef);
        console.log('Firestore read+delete OK');
        setStatus({ firestore: 'ok', testing: false });
      } else {
        setStatus({ firestore: 'fail', testing: false });
      }
    } catch (err) {
      console.error('Firestore error:', err);
      setStatus({ firestore: err.message, testing: false });
    }
  };

  const renderStatus = (label, value) => {
    if (value === null) return null;
    const isOk = value === 'ok';
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: isOk ? '#ECFDF5' : '#FEF2F2',
          borderRadius: '0.5rem',
          color: isOk ? '#065F46' : '#991B1B',
          fontSize: '0.875rem',
        }}
      >
        <span>{isOk ? '\u2705' : '\u274C'}</span>
        <span>
          {label}: {isOk ? '연결 성공' : value}
        </span>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ color: 'var(--color-pink)', fontSize: '2rem' }}>
        셀러픽 SellerPick
      </h1>
      <p style={{ color: 'var(--color-gray-500)', marginTop: '0.5rem' }}>
        샤방이 셀러 관리 시스템
      </p>

      <div style={{ marginTop: '2rem' }}>
        <button
          className="btn-primary"
          onClick={testFirebase}
          disabled={status.testing}
        >
          {status.testing ? '테스트 중...' : 'Firebase 연결 테스트'}
        </button>
      </div>

      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          alignItems: 'center',
        }}
      >
        {renderStatus('Firestore', status.firestore)}
      </div>
    </div>
  );
}
