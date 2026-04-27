import { useState, useRef } from 'react';
import { addDocument } from '../lib/firestoreAPI';
import useImageUpload from '../hooks/useImageUpload';

const CATEGORIES = ['의류', '잡화', '화장품', '건강식품'];

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid var(--color-gray-200)',
  borderRadius: 10,
  fontSize: '0.9375rem',
  outline: 'none',
  minHeight: 44,
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-gray-700)',
  marginBottom: 6,
};

export default function ProductForm({ onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const { imageUrl, uploading, progress, uploadImage, resetImage } = useImageUpload();

  const [form, setForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    stock: '',
    category: '',
    options: '',
    isLive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const formatPrice = (val) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('ko-KR');
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.category) {
      alert('상품명, 판매가, 카테고리는 필수입니다.');
      return;
    }

    setSubmitting(true);
    try {
      const originalPriceNum = parseInt(form.originalPrice.replace(/[^0-9]/g, ''), 10);
      await addDocument('products', {
        name: form.name,
        price: parseInt(form.price.replace(/[^0-9]/g, ''), 10),
        originalPrice: isNaN(originalPriceNum) ? null : originalPriceNum,
        stock: parseInt(form.stock, 10) || 0,
        imageUrl: imageUrl || '',
        category: form.category,
        options: form.options,
        isLive: form.isLive,
        createdAt: new Date().toISOString(),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      alert('등록 실패: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
      {/* 사진 업로드 */}
      <div>
        <label style={labelStyle}>상품 사진</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {imageUrl ? (
          <div style={{ position: 'relative' }}>
            <img
              src={imageUrl}
              alt="미리보기"
              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10 }}
            />
            <button
              onClick={() => { resetImage(); fileInputRef.current.value = ''; }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              ...inputStyle,
              background: 'var(--color-gray-50)',
              color: 'var(--color-gray-500)',
              textAlign: 'center',
              cursor: 'pointer',
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {uploading ? `업로드 중... ${progress}%` : '📷 사진 찍기 / 갤러리에서 선택'}
          </button>
        )}
      </div>

      {/* 상품명 */}
      <div>
        <label style={labelStyle}>상품명 *</label>
        <input
          style={inputStyle}
          placeholder="예) 봄 가디건"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      {/* 정가 (할인 전 가격) */}
      <div>
        <label style={labelStyle}>정가 (선택 — 할인 표시용)</label>
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...inputStyle, paddingRight: 36 }}
            inputMode="numeric"
            placeholder="할인 전 가격 입력 시 자동으로 할인율 표시"
            value={formatPrice(form.originalPrice)}
            onChange={(e) => handleChange('originalPrice', e.target.value)}
          />
          <span style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-gray-500)',
            fontSize: '0.875rem',
          }}>
            원
          </span>
        </div>
      </div>

      {/* 판매가 */}
      <div>
        <label style={labelStyle}>판매가 *</label>
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...inputStyle, paddingRight: 36 }}
            inputMode="numeric"
            placeholder="0"
            value={formatPrice(form.price)}
            onChange={(e) => handleChange('price', e.target.value)}
          />
          <span style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-gray-500)',
            fontSize: '0.875rem',
          }}>
            원
          </span>
        </div>
      </div>

      {/* 재고 */}
      <div>
        <label style={labelStyle}>재고 수량</label>
        <input
          style={inputStyle}
          inputMode="numeric"
          placeholder="0"
          value={form.stock}
          onChange={(e) => handleChange('stock', e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>

      {/* 판매 채널 (라이브몰 / 쇼핑몰) */}
      <div>
        <label style={labelStyle}>판매 채널 * (라이브몰/쇼핑몰 선택)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: true, label: '🔴 라이브몰', desc: '실시간 방송' },
            { value: false, label: '🛍 쇼핑몰', desc: '일반 판매' },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => handleChange('isLive', opt.value)}
              style={{
                flex: 1,
                padding: '12px 10px',
                borderRadius: 10,
                border: '1.5px solid',
                borderColor: form.isLive === opt.value ? 'var(--color-pink)' : 'var(--color-gray-200)',
                background: form.isLive === opt.value ? 'var(--color-pink)' : 'white',
                color: form.isLive === opt.value ? 'white' : 'var(--color-gray-700)',
                fontSize: '0.875rem',
                fontWeight: 600,
                minHeight: 56,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span>{opt.label}</span>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 400,
                opacity: form.isLive === opt.value ? 0.9 : 0.6,
              }}>
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 */}
      <div>
        <label style={labelStyle}>카테고리 *</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleChange('category', cat)}
              style={{
                padding: '8px 16px',
                borderRadius: 9999,
                border: '1.5px solid',
                borderColor: form.category === cat ? 'var(--color-pink)' : 'var(--color-gray-200)',
                background: form.category === cat ? 'var(--color-pink)' : 'white',
                color: form.category === cat ? 'white' : 'var(--color-gray-700)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                minHeight: 44,
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 옵션 */}
      <div>
        <label style={labelStyle}>옵션 (선택)</label>
        <input
          style={inputStyle}
          placeholder="예) S, M, L, XL"
          value={form.options}
          onChange={(e) => handleChange('options', e.target.value)}
        />
      </div>

      {/* 등록 버튼 */}
      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={submitting || uploading}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '1rem',
          marginTop: 8,
          opacity: submitting || uploading ? 0.6 : 1,
        }}
      >
        {submitting ? '등록 중...' : '상품 등록하기'}
      </button>
    </div>
  );
}
