import { useState, useRef } from 'react';
import { addDocument } from '../lib/firestoreAPI';
import useImageUpload from '../hooks/useImageUpload';

// ProductManagement / ShopProductForm 과 동일 카테고리 (일관성)
const CATEGORIES = ['의류', '잡화', '뷰티', '식품·건강', '침구·생활', '기타'];

// 사이즈/용량 옵션이 필요한 카테고리 + 기본 사이즈 프리셋
const SIZE_PRESETS = {
  '의류': ['S', 'M', 'L', 'XL'],
  '침구·생활': ['SS', 'Q', 'K'],
};

// 옵션 등록 모드가 자동으로 켜지는 카테고리 (옷/이불)
const OPTION_AUTO_CATEGORIES = new Set(['의류', '침구·생활']);

const DEFAULT_STOCK = 10;

export default function QuickAdd({ onClose, onSuccess, defaultIsLive = true }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const uploadPromiseRef = useRef(null);
  const { imageUrl, uploading, progress, uploadImage } = useImageUpload();

  const [step, setStep] = useState('source'); // 'source' → 'info'
  const [previewUrl, setPreviewUrl] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  // 단일 재고 (옵션 없을 때)
  const [singleStock, setSingleStock] = useState(String(DEFAULT_STOCK));
  // 한정수량 토글 — 단일 모드에서만. OFF=무제한, ON=사용자 입력
  const [hasLimitedStock, setHasLimitedStock] = useState(false);
  // 옵션별 재고 — { 'S': '10', 'M': '10', ... }
  const [variantStocks, setVariantStocks] = useState({});
  // 사이즈별 가격 다름 토글 (OFF = 모든 사이즈 = 상품 가격)
  const [perVariantPricing, setPerVariantPricing] = useState(false);
  // 옵션별 가격 — { 'S': '', 'M': '', ... } (perVariantPricing=true 일 때만 사용)
  const [variantPrices, setVariantPrices] = useState({});
  // 직접 추가한 옵션명 입력
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const useOptions = OPTION_AUTO_CATEGORIES.has(category);

  // 카테고리 선택 — 옵션 자동 카테고리면 프리셋 적용
  const handlePickCategory = (cat) => {
    setCategory(cat);
    if (OPTION_AUTO_CATEGORIES.has(cat)) {
      const preset = SIZE_PRESETS[cat] || [];
      // 이미 입력한 값은 보존, 새 사이즈는 기본 재고로
      setVariantStocks((prev) => {
        const next = {};
        preset.forEach((s) => {
          next[s] = prev[s] ?? String(DEFAULT_STOCK);
        });
        return next;
      });
    }
  };

  const addCustomSize = () => {
    const s = customSizeInput.trim();
    if (!s) return;
    setVariantStocks((prev) => ({ ...prev, [s]: prev[s] ?? String(DEFAULT_STOCK) }));
    setCustomSizeInput('');
  };

  const removeSize = (s) => {
    setVariantStocks((prev) => {
      const next = { ...prev };
      delete next[s];
      return next;
    });
  };

  const updateSizeStock = (s, val) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setVariantStocks((prev) => ({ ...prev, [s]: cleaned }));
  };

  const updateSizePrice = (s, val) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setVariantPrices((prev) => ({ ...prev, [s]: cleaned }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setStep('info');
    uploadPromiseRef.current = uploadImage(file);
  };

  const handleRetake = () => {
    // 사진 다시 — source 화면으로
    setPreviewUrl('');
    uploadPromiseRef.current = null;
    setStep('source');
  };

  const formatPrice = (val) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('ko-KR');
  };

  // 합계 재고 계산
  // - 옵션 모드: 사이즈별 합산
  // - 단일 + 한정 OFF: 무제한 (UI 표시용 0, 실제 저장은 큰 수)
  // - 단일 + 한정 ON: 사용자 입력값
  const totalStock = useOptions
    ? Object.values(variantStocks).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0)
    : (hasLimitedStock ? (parseInt(singleStock, 10) || 0) : 0);

  const UNLIMITED_STOCK_VALUE = 9999;

  const canSubmit = !!name && !!price && !submitting && (
    useOptions ? Object.keys(variantStocks).length > 0 : true
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
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

      // 메인 상품 가격
      const mainPrice = parseInt(price.replace(/[^0-9]/g, ''), 10) || 0;

      // variants 배열 빌드 — 옵션 모드일 때만
      // perVariantPricing=true 면 각 사이즈 가격 사용 (빈 값은 mainPrice fallback)
      // perVariantPricing=false 면 모든 사이즈가 mainPrice 동일
      const variants = useOptions
        ? Object.entries(variantStocks).map(([sz, st]) => {
            const customP = perVariantPricing
              ? parseInt(variantPrices[sz] || '', 10)
              : NaN;
            return {
              name: sz,
              stock: parseInt(st, 10) || 0,
              price: Number.isFinite(customP) && customP > 0 ? customP : mainPrice,
            };
          })
        : [];

      // 단일 모드 + 한정 OFF → 무제한 처리 (큰 수 + unlimitedStock 플래그)
      const isUnlimited = !useOptions && !hasLimitedStock;
      const finalStock = isUnlimited ? UNLIMITED_STOCK_VALUE : totalStock;

      const payload = {
        name,
        price: mainPrice,
        stock: finalStock,
        unlimitedStock: isUnlimited,
        imageUrl: finalImageUrl || '',
        category: category || '',
        options: useOptions ? Object.keys(variantStocks).join(', ') : '',
        isLive: defaultIsLive,
      };
      if (variants.length > 0) {
        payload.variants = variants;
        payload.hasOptions = true;
      }

      const docId = await addDocument('products', payload);
      console.log('Product saved:', docId);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      alert('등록 실패: ' + err.message);
    }
    setSubmitting(false);
  };

  // ── source 화면 — 카메라/사진첩 선택
  if (step === 'source') {
    return (
      <div style={fullScreenDark}>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button
          onClick={onClose}
          aria-label="닫기"
          style={closeBtnDark}
        >
          ✕
        </button>

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

          <button onClick={() => cameraInputRef.current?.click()} style={sourceBtnPrimary}>
            <div style={sourceBtnIcon}>&#128247;</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '1.0625rem', fontWeight: 700 }}>사진 찍기</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 2 }}>지금 카메라로 촬영</div>
            </div>
            <span style={{ fontSize: '1.25rem', opacity: 0.6 }}>›</span>
          </button>

          <button onClick={() => galleryInputRef.current?.click()} style={sourceBtnSecondary}>
            <div style={sourceBtnIcon}>🖼️</div>
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

  // ── info 화면 — 일반 폼 레이아웃
  return (
    <div style={fullScreenLight}>
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        height: 56, padding: '0 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'white', borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <button onClick={onClose} aria-label="닫기" style={iconBtn}>✕</button>
        <h1 style={{ fontSize: '1rem', fontWeight: 700 }}>상품 등록</h1>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            ...iconBtn,
            color: canSubmit ? 'var(--color-pink)' : 'var(--color-gray-300)',
            fontSize: '0.875rem', fontWeight: 700, width: 'auto', padding: '0 8px',
          }}
        >
          {submitting ? '등록…' : '등록'}
        </button>
      </header>

      <div style={{
        padding: '14px 16px',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* 사진 썸네일 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 92, height: 92, borderRadius: 12, flexShrink: 0,
            background: previewUrl ? `url(${previewUrl}) center/cover no-repeat` : 'var(--color-gray-100)',
            position: 'relative',
          }}>
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 12,
                background: 'rgba(0,0,0,0.5)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                {progress}%
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)', marginBottom: 4 }}>
              상품 사진
            </div>
            <button onClick={handleRetake} style={ghostBtn}>📷 다시 찍기</button>
          </div>
        </div>

        {/* 상품명 */}
        <div>
          <label style={labelStyle}>상품명</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예) 크림 니트 가디건"
            autoFocus
            style={inputStyle}
          />
        </div>

        {/* 가격 */}
        <div>
          <label style={labelStyle}>가격</label>
          <div style={{ position: 'relative' }}>
            <input
              value={formatPrice(price)}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              inputMode="numeric"
              style={{ ...inputStyle, paddingRight: 40 }}
            />
            <span style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-gray-500)', fontSize: '0.9375rem', fontWeight: 600,
            }}>원</span>
          </div>
        </div>

        {/* 카테고리 */}
        <div>
          <label style={labelStyle}>카테고리</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handlePickCategory(cat)}
                style={{
                  padding: '8px 14px', borderRadius: 9999,
                  fontSize: '0.8125rem', fontWeight: 600, minHeight: 36,
                  border: '1px solid',
                  borderColor: category === cat ? 'var(--color-pink)' : 'var(--color-gray-200)',
                  background: category === cat ? 'var(--color-pink)' : 'white',
                  color: category === cat ? 'white' : 'var(--color-gray-700)',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 재고 — 단일 vs 사이즈별 */}
        {useOptions ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                사이즈별 재고{perVariantPricing ? '·가격' : ''}
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                총 {totalStock}개
              </span>
            </div>

            {/* 사이즈별 가격 다름 토글 */}
            <button
              onClick={() => setPerVariantPricing((v) => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', marginBottom: 8,
                borderRadius: 10,
                border: '1px solid',
                borderColor: perVariantPricing ? 'var(--color-pink)' : 'var(--color-gray-200)',
                background: perVariantPricing ? '#FFF0F3' : 'white',
                cursor: 'pointer',
                fontSize: '0.8125rem', color: 'var(--color-gray-700)',
                textAlign: 'left',
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: 5,
                border: '2px solid',
                borderColor: perVariantPricing ? 'var(--color-pink)' : 'var(--color-gray-300)',
                background: perVariantPricing ? 'var(--color-pink)' : 'white',
                color: 'white', fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {perVariantPricing ? '✓' : ''}
              </span>
              <span style={{ flex: 1 }}>사이즈별 가격 다르게 설정</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)' }}>
                {perVariantPricing ? '각 사이즈 가격 입력' : `모두 ${formatPrice(price) || '0'}원`}
              </span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(variantStocks).map(([sz, st]) => (
                <div key={sz} style={{
                  display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                  padding: '8px 12px', borderRadius: 10,
                  border: '1px solid var(--color-gray-200)', background: 'white',
                }}>
                  <span style={{
                    minWidth: 48,
                    fontSize: '0.875rem', fontWeight: 700,
                    color: 'var(--color-gray-900)',
                  }}>
                    {sz}
                  </span>
                  {/* 가격 (perVariantPricing 일 때만) */}
                  {perVariantPricing && (
                    <div style={{ position: 'relative', flex: '1 1 120px', minWidth: 100 }}>
                      <input
                        inputMode="numeric"
                        value={formatPrice(variantPrices[sz] || '')}
                        onChange={(e) => updateSizePrice(sz, e.target.value)}
                        placeholder={formatPrice(price) || '가격'}
                        style={{
                          width: '100%', padding: '8px 28px 8px 10px', borderRadius: 8,
                          border: '1px solid var(--color-gray-200)',
                          fontSize: '0.875rem', outline: 'none', textAlign: 'right',
                        }}
                      />
                      <span style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--color-gray-400)', fontSize: '0.75rem',
                      }}>원</span>
                    </div>
                  )}
                  {/* 재고 */}
                  <div style={{ position: 'relative', flex: '1 1 80px', minWidth: 70 }}>
                    <input
                      inputMode="numeric"
                      value={st}
                      onChange={(e) => updateSizeStock(sz, e.target.value)}
                      placeholder="0"
                      style={{
                        width: '100%', padding: '8px 24px 8px 10px', borderRadius: 8,
                        border: '1px solid var(--color-gray-200)',
                        fontSize: '0.875rem', outline: 'none', textAlign: 'right',
                      }}
                    />
                    <span style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--color-gray-400)', fontSize: '0.75rem',
                    }}>개</span>
                  </div>
                  <button
                    onClick={() => removeSize(sz)}
                    aria-label={`${sz} 제거`}
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: 'none',
                      background: 'var(--color-gray-100)', color: 'var(--color-gray-500)',
                      cursor: 'pointer', fontSize: 14, flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* 사이즈 직접 추가 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
                placeholder="사이즈 직접 추가 (예: XS, 110)"
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8,
                  border: '1px dashed var(--color-gray-300)',
                  fontSize: '0.875rem', outline: 'none',
                }}
              />
              <button
                onClick={addCustomSize}
                disabled={!customSizeInput.trim()}
                style={{
                  padding: '10px 14px', borderRadius: 8, border: 'none',
                  background: customSizeInput.trim() ? 'var(--color-gray-900)' : 'var(--color-gray-200)',
                  color: 'white', fontSize: '0.8125rem', fontWeight: 600,
                  cursor: customSizeInput.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                + 추가
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>재고</label>

            {/* 한정수량 토글 */}
            <button
              onClick={() => setHasLimitedStock((v) => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', marginBottom: 8,
                borderRadius: 10,
                border: '1px solid',
                borderColor: hasLimitedStock ? 'var(--color-pink)' : 'var(--color-gray-200)',
                background: hasLimitedStock ? '#FFF0F3' : 'white',
                cursor: 'pointer',
                fontSize: '0.8125rem', color: 'var(--color-gray-700)',
                textAlign: 'left',
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: 5,
                border: '2px solid',
                borderColor: hasLimitedStock ? 'var(--color-pink)' : 'var(--color-gray-300)',
                background: hasLimitedStock ? 'var(--color-pink)' : 'white',
                color: 'white', fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {hasLimitedStock ? '✓' : ''}
              </span>
              <span style={{ flex: 1 }}>한정 수량으로 판매</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)' }}>
                {hasLimitedStock ? '수량 직접 입력' : '한정 없음 (무제한)'}
              </span>
            </button>

            <div style={{ position: 'relative' }}>
              <input
                inputMode="numeric"
                value={hasLimitedStock ? singleStock : ''}
                onChange={(e) => setSingleStock(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder={hasLimitedStock ? '0' : '00 (한정 없음)'}
                disabled={!hasLimitedStock}
                style={{
                  ...inputStyle,
                  paddingRight: 40,
                  background: hasLimitedStock ? 'white' : 'var(--color-gray-50)',
                  color: hasLimitedStock ? 'var(--color-gray-900)' : 'var(--color-gray-400)',
                  cursor: hasLimitedStock ? 'text' : 'not-allowed',
                }}
              />
              <span style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-gray-500)', fontSize: '0.9375rem',
              }}>개</span>
            </div>
          </div>
        )}
      </div>

      {/* 하단 sticky 등록 버튼 */}
      <div style={{
        position: 'fixed', left: 0, right: 0,
        bottom: 0, maxWidth: 430, margin: '0 auto',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        background: 'white', borderTop: '1px solid var(--color-gray-200)',
      }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', padding: '14px', minHeight: 52,
            borderRadius: 12, border: 'none',
            background: canSubmit ? 'var(--color-pink)' : 'var(--color-gray-200)',
            color: canSubmit ? 'white' : 'var(--color-gray-500)',
            fontSize: '1rem', fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting
            ? (uploading ? `사진 업로드 중... ${progress}%` : '등록 중...')
            : `⚡ 등록하기${
                useOptions
                  ? ` (총 ${totalStock}개)`
                  : hasLimitedStock
                    ? ` (${totalStock}개 한정)`
                    : ' (한정 없음)'
              }`}
        </button>
      </div>
    </div>
  );
}

const fullScreenDark = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: '#111', display: 'flex', flexDirection: 'column',
};

const fullScreenLight = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: '#fafafa', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
};

const closeBtnDark = {
  position: 'absolute', top: 16, right: 16,
  width: 40, height: 40, borderRadius: '50%',
  background: 'rgba(255,255,255,0.2)', color: 'white',
  fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', cursor: 'pointer',
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

const iconBtn = {
  width: 44, height: 44,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '1.125rem', color: 'var(--color-gray-700)',
};

const labelStyle = {
  display: 'block', fontSize: '0.8125rem', fontWeight: 600,
  color: 'var(--color-gray-700)', marginBottom: 6,
};

const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1px solid var(--color-gray-200)', borderRadius: 10,
  fontSize: '0.9375rem', outline: 'none', minHeight: 44,
  background: 'white',
};

const ghostBtn = {
  padding: '8px 12px', minHeight: 36, borderRadius: 8,
  border: '1px solid var(--color-gray-200)',
  background: 'white', color: 'var(--color-gray-700)',
  fontSize: '0.8125rem', fontWeight: 600,
  cursor: 'pointer',
};
