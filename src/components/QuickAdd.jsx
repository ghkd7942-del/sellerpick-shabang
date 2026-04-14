import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useImageUpload from '../hooks/useImageUpload';

const CATEGORIES = ['의류', '잡화', '화장품', '건강식품'];

export default function QuickAdd({ onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const { imageUrl, uploading, progress, uploadImage, resetImage } = useImageUpload();
  const [step, setStep] = useState('camera');
  const [previewUrl, setPreviewUrl] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 마운트 시 카메라 자동 열기
  useEffect(() => {
    if (step === 'camera') {
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  }, [step]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 로컬 미리보기 즉시 생성
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setStep('info');

    // 백그라운드 업로드 시작
    uploadImage(file);
  };

  const formatPrice = (val) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('ko-KR');
  };

  const handleSubmit = async () => {
    if (!name || !price) return;

    setSubmitting(true);
    try {
      const productData = {
        name,
        price: parseInt(price.replace(/[^0-9]/g, ''), 10),
        stock: 99,
        imageUrl: imageUrl || '',
        category: category || '',
        options: '',
        isLive: true,
        createdAt: Timestamp.now(),
      };
      console.log('Saving product:', productData);

      // 15초 타임아웃
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('저장 시간 초과 — 인터넷 연결을 확인해주세요')), 15000)
      );
      await Promise.race([
        addDoc(collection(db, 'products'), productData),
        timeout,
      ]);

      console.log('Product saved!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      alert('등록 실패: ' + err.message + '\n\nFirestore 연결을 확인해주세요.');
    }
    setSubmitting(false);
  };

  // 카메라 대기 화면
  if (step === 'camera') {
    return (
      <div style={fullScreen}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* 카메라 취소 시 보이는 UI */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: 20, padding: 24,
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', color: 'white',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            ✕
          </button>

          <div style={{ fontSize: '4rem', opacity: 0.5 }}>&#128247;</div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'var(--color-pink)', color: 'white',
              padding: '16px 32px', borderRadius: 12,
              fontSize: '1.125rem', fontWeight: 700, minHeight: 56,
            }}
          >
            &#128247; 사진 찍기
          </button>
          <button
            onClick={() => {
              fileInputRef.current?.removeAttribute('capture');
              fileInputRef.current?.click();
            }}
            style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', padding: 12, minHeight: 44 }}
          >
            갤러리에서 선택
          </button>
        </div>
      </div>
    );
  }

  // 사진 촬영 후 — 정보 입력
  return (
    <div style={fullScreen}>
      {/* 배경 사진 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `url(${previewUrl}) center/cover no-repeat`,
      }} />

      {/* 어두운 그라데이션 오버레이 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.9) 100%)',
      }} />

      {/* 닫기 */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16, zIndex: 10,
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)', color: 'white',
        fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        ✕
      </button>

      {/* 업로드 진행률 */}
      {uploading && (
        <div style={{
          position: 'absolute', top: 16, left: 16, zIndex: 10,
          background: 'rgba(0,0,0,0.6)', color: 'white',
          padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem',
        }}>
          &#128247; {progress}%
        </div>
      )}

      {/* 하단 입력 영역 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '24px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* 상품명 */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="상품명 입력"
          autoFocus
          style={{
            width: '100%', padding: '14px 16px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 12, color: 'white', fontSize: '1.25rem', fontWeight: 700,
            outline: 'none', minHeight: 52,
            '::placeholder': { color: 'rgba(255,255,255,0.5)' },
          }}
        />

        {/* 가격 */}
        <div style={{ position: 'relative' }}>
          <input
            value={formatPrice(price)}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="가격"
            inputMode="numeric"
            style={{
              width: '100%', padding: '14px 50px 14px 16px',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 12, color: 'white', fontSize: '1.25rem', fontWeight: 700,
              outline: 'none', minHeight: 52,
            }}
          />
          <span style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.6)', fontSize: '1rem', fontWeight: 600,
          }}>
            원
          </span>
        </div>

        {/* 카테고리 (선택) */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(category === cat ? '' : cat)}
              style={{
                padding: '6px 14px', borderRadius: 9999,
                border: '1px solid',
                borderColor: category === cat ? 'var(--color-pink)' : 'rgba(255,255,255,0.3)',
                background: category === cat ? 'var(--color-pink)' : 'rgba(255,255,255,0.1)',
                color: 'white', fontSize: '0.8125rem', fontWeight: 600,
                minHeight: 36,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 등록 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={!name || !price || submitting}
          style={{
            width: '100%', padding: '16px',
            background: (!name || !price) ? 'rgba(255,255,255,0.2)' : 'var(--color-pink)',
            color: 'white', borderRadius: 12, fontSize: '1.125rem', fontWeight: 700,
            minHeight: 56, opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '등록 중...' : '⚡ 즉시 등록'}
        </button>
      </div>
    </div>
  );
}

const fullScreen = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: '#111', display: 'flex', flexDirection: 'column',
};
