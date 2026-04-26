import { useState, useRef } from 'react';
import { addDocument } from '../lib/firestoreAPI';
import useImageUpload from '../hooks/useImageUpload';

const CATEGORIES = ['의류', '잡화', '화장품', '건강식품'];

export default function QuickAdd({ onClose, onSuccess, defaultIsLive = true }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const uploadPromiseRef = useRef(null);
  const { imageUrl, uploading, progress, uploadImage, resetImage } = useImageUpload();
  const [step, setStep] = useState('source'); // 'source' (선택) → 'info' (정보 입력)
  const [previewUrl, setPreviewUrl] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 로컬 미리보기 즉시 생성
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setStep('info');

    // 백그라운드 업로드 시작 (Promise 저장)
    uploadPromiseRef.current = uploadImage(file);
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
      // 업로드 완료 대기 (최대 30초)
      let finalImageUrl = imageUrl;
      if (uploadPromiseRef.current) {
        try {
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('업로드 시간 초과')), 30000)
          );
          const result = await Promise.race([uploadPromiseRef.current, timeout]);
          finalImageUrl = result || imageUrl;
        } catch (uploadErr) {
          console.error('Upload failed, saving without image:', uploadErr);
          finalImageUrl = imageUrl || '';
        }
      }

      const docId = await addDocument('products', {
        name,
        price: parseInt(price.replace(/[^0-9]/g, ''), 10),
        stock: 99,
        imageUrl: finalImageUrl || '',
        category: category || '',
        options: '',
        isLive: defaultIsLive,
      });
      console.log('Product saved:', docId, 'imageUrl:', finalImageUrl);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      alert('등록 실패: ' + err.message);
    }
    setSubmitting(false);
  };

  // 사진 소스 선택 화면 — 카메라 / 사진첩
  if (step === 'source') {
    return (
      <div style={fullScreen}>
        {/* 카메라용 input */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {/* 사진첩용 input (capture 없음) */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', color: 'white',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* 메인 컨텐츠 */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100%', gap: 16, padding: '24px 20px',
        }}>
          <div style={{ fontSize: '3.5rem', opacity: 0.5, marginBottom: 8 }}>&#128247;</div>
          <h2 style={{
            color: 'white', fontSize: '1.375rem', fontWeight: 700,
            margin: 0, textAlign: 'center',
          }}>
            상품 사진 추가
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem',
            margin: '0 0 16px', textAlign: 'center',
          }}>
            어떻게 사진을 추가할까요?
          </p>

          {/* 카메라 버튼 */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            style={sourceBtnPrimary}
          >
            <div style={sourceBtnIcon}>&#128247;</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '1.0625rem', fontWeight: 700 }}>사진 찍기</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 2 }}>지금 카메라로 촬영</div>
            </div>
            <span style={{ fontSize: '1.25rem', opacity: 0.6 }}>›</span>
          </button>

          {/* 사진첩 버튼 */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            style={sourceBtnSecondary}
          >
            <div style={sourceBtnIcon}>&#128247;&#65039;</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '1.0625rem', fontWeight: 700 }}>사진첩에서 선택</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>저장된 사진 사용</div>
            </div>
            <span style={{ fontSize: '1.25rem', opacity: 0.5 }}>›</span>
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
          {submitting
            ? (uploading ? `사진 업로드 중... ${progress}%` : '등록 중...')
            : uploading
              ? `⚡ 즉시 등록 (사진 ${progress}%)`
              : '⚡ 즉시 등록'}
        </button>
      </div>
    </div>
  );
}

const fullScreen = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: '#111', display: 'flex', flexDirection: 'column',
};

const sourceBtnPrimary = {
  width: '100%', maxWidth: 360,
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '16px 18px', minHeight: 64,
  borderRadius: 14, border: 'none',
  background: 'var(--color-pink)', color: 'white',
  cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(255,75,110,0.35)',
};

const sourceBtnSecondary = {
  width: '100%', maxWidth: 360,
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '16px 18px', minHeight: 64,
  borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.08)', color: 'white',
  cursor: 'pointer',
};

const sourceBtnIcon = {
  width: 40, height: 40, borderRadius: 10,
  background: 'rgba(255,255,255,0.18)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.375rem', flexShrink: 0,
};
