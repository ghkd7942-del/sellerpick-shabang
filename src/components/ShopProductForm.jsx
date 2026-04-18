import { useState, useRef } from 'react';
import { addDocument } from '../lib/firestoreAPI';
import useImageUpload from '../hooks/useImageUpload';
import { uploadImageFile } from '../lib/uploadImage';

const CATEGORIES = ['의류', '잡화', '뷰티', '식품·건강', '침구·생활', '기타'];

const INFO_PRESETS = {
  '의류': ['소재', '제조국', '세탁 방법', '핏'],
  '잡화': ['소재', '제조국', '크기'],
  '뷰티': ['용량/중량', '제조국', '전성분', '유통기한', '사용기한'],
  '식품·건강': ['총 내용량', '원재료', '유통기한', '보관 방법', '섭취 방법'],
  '침구·생활': ['소재', '크기', '세탁 방법', '제조국'],
  '기타': ['소재', '제조국'],
};

// 카테고리 선택 시 자동 채워지는 옵션 템플릿
const OPTION_TEMPLATES = {
  '침구·생활': {
    groupName: '사이즈',
    rows: [
      { name: 'SS 120X210', price: '24000', stock: '50' },
      { name: 'Q 160X210', price: '36000', stock: '50' },
      { name: 'SK 190X210', price: '45000', stock: '50' },
    ],
  },
  '의류': {
    groupName: '사이즈',
    rows: [
      { name: 'S', price: '', stock: '50' },
      { name: 'M', price: '', stock: '50' },
      { name: 'L', price: '', stock: '50' },
    ],
  },
  '식품·건강': {
    groupName: '용량',
    rows: [
      { name: '30정', price: '', stock: '50' },
      { name: '60정', price: '', stock: '50' },
      { name: '90정', price: '', stock: '50' },
    ],
  },
  '뷰티': {
    groupName: '용량',
    rows: [
      { name: '30ml', price: '', stock: '50' },
      { name: '50ml', price: '', stock: '50' },
      { name: '100ml', price: '', stock: '50' },
    ],
  },
};

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

const sectionTitleStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--color-gray-500)',
  letterSpacing: '0.02em',
  textTransform: 'none',
  padding: '6px 0',
  borderTop: '1px solid var(--color-gray-200)',
  marginTop: 4,
};

const cellStyle = {
  padding: '10px 12px',
  border: '1px solid var(--color-gray-200)',
  borderRadius: 8,
  fontSize: '0.875rem',
  outline: 'none',
  minHeight: 40,
  width: '100%',
};

function detailActionBtn(disabled) {
  return {
    width: 28, height: 28, borderRadius: 6,
    background: disabled ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)',
    color: 'white', fontSize: 11, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none',
  };
}

function formatPrice(val) {
  if (val === '' || val == null) return '';
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('ko-KR');
}

function toNum(v) {
  return parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0;
}

export default function ShopProductForm({ onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const detailInputRef = useRef(null);
  const { imageUrl, uploading, progress, uploadImage, resetImage } = useImageUpload();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [colors, setColors] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const [hasOptions, setHasOptions] = useState(false);
  const [optionGroupName, setOptionGroupName] = useState('사이즈');
  const [singlePrice, setSinglePrice] = useState('');
  const [singleStock, setSingleStock] = useState('50');
  const [variants, setVariants] = useState([
    { name: '', price: '', stock: '50' },
  ]);

  const [detailImages, setDetailImages] = useState([]);
  const [detailUploading, setDetailUploading] = useState(false);

  const [info, setInfo] = useState([{ key: '', value: '' }]);

  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDetailFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setDetailUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadImageFile(f)));
      setDetailImages((prev) => [...prev, ...urls.filter(Boolean)]);
    } catch (err) {
      alert('상세 이미지 업로드 실패: ' + err.message);
    }
    setDetailUploading(false);
    if (detailInputRef.current) detailInputRef.current.value = '';
  };

  const removeDetailImage = (idx) =>
    setDetailImages((prev) => prev.filter((_, i) => i !== idx));

  const moveDetailImage = (idx, dir) => {
    setDetailImages((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const addColor = () => {
    const v = colorInput.trim();
    if (!v || colors.includes(v)) { setColorInput(''); return; }
    setColors((prev) => [...prev, v]);
    setColorInput('');
  };
  const removeColor = (c) => setColors((prev) => prev.filter((x) => x !== c));

  const addTag = () => {
    const v = tagInput.trim();
    if (!v || tags.includes(v)) { setTagInput(''); return; }
    setTags((prev) => [...prev, v]);
    setTagInput('');
  };
  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    const tpl = OPTION_TEMPLATES[cat];
    if (!tpl) return;
    // 옵션이 비어있을 때만 자동 채움 (사용자 입력 덮어쓰지 않음)
    const isEmptyVariants = variants.every((v) => !v.name && !v.price);
    if (!hasOptions || isEmptyVariants) {
      setHasOptions(true);
      setOptionGroupName(tpl.groupName);
      setVariants(tpl.rows.map((r) => ({ ...r })));
    }
  };

  const addVariant = () =>
    setVariants((prev) => [...prev, { name: '', price: '', stock: '50' }]);
  const removeVariant = (idx) =>
    setVariants((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const updateVariant = (idx, field, value) =>
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));

  const addInfoRow = () => setInfo((prev) => [...prev, { key: '', value: '' }]);
  const removeInfoRow = (idx) =>
    setInfo((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : [{ key: '', value: '' }]));
  const updateInfoRow = (idx, field, value) =>
    setInfo((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  const applyInfoPreset = (cat) => {
    const keys = INFO_PRESETS[cat] || [];
    if (keys.length === 0) return;
    // Merge with existing rows — keep any rows with values, append missing preset keys
    const existingKeys = new Set(info.filter((r) => r.key.trim()).map((r) => r.key.trim()));
    const toAdd = keys.filter((k) => !existingKeys.has(k)).map((k) => ({ key: k, value: '' }));
    const kept = info.filter((r) => r.key.trim() || r.value.trim());
    setInfo([...kept, ...toAdd].length ? [...kept, ...toAdd] : [{ key: '', value: '' }]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { alert('상품명을 입력해주세요.'); return; }

    let productPrice = 0;
    let productStock = 0;
    let cleanVariants = [];

    if (hasOptions) {
      cleanVariants = variants
        .map((v) => ({
          name: v.name.trim(),
          price: toNum(v.price),
          stock: toNum(v.stock),
        }))
        .filter((v) => v.name && v.price > 0);
      if (cleanVariants.length === 0) {
        alert('옵션을 한 개 이상 입력해주세요.');
        return;
      }
      productPrice = Math.min(...cleanVariants.map((v) => v.price));
      productStock = cleanVariants.reduce((s, v) => s + v.stock, 0);
    } else {
      productPrice = toNum(singlePrice);
      productStock = toNum(singleStock);
      if (productPrice <= 0) { alert('판매가를 입력해주세요.'); return; }
    }

    const cleanInfo = info
      .map((r) => ({ key: r.key.trim(), value: r.value.trim() }))
      .filter((r) => r.key && r.value);

    // (색상 × 사이즈) 매트릭스 — 각 셀 = variant.stock
    const stockMatrix = {};
    if (colors.length > 0 && cleanVariants.length > 0) {
      colors.forEach((cName) => {
        stockMatrix[cName] = {};
        cleanVariants.forEach((v) => {
          stockMatrix[cName][v.name] = v.stock;
        });
      });
    }
    const matrixTotal = Object.values(stockMatrix).reduce(
      (s, row) => s + Object.values(row).reduce((a, b) => a + b, 0),
      0
    );
    const finalTotalStock = matrixTotal > 0 ? matrixTotal : productStock;

    setSubmitting(true);
    try {
      await addDocument('products', {
        name: name.trim(),
        description: description.trim(),
        category,
        hasOptions,
        optionGroupName: hasOptions ? optionGroupName.trim() || '옵션' : '',
        variants: cleanVariants,
        stockMatrix,
        info: cleanInfo,
        price: productPrice,
        stock: finalTotalStock,
        options: hasOptions
          ? cleanVariants.map((v) => v.name).join(', ')
          : tags.join(', '),
        colors: colors.map((name) => ({ name })),
        tags,
        imageUrl: imageUrl || '',
        detailImages,
        isLive: false,
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
      {/* ─── 기본 정보 ─── */}
      <div style={sectionTitleStyle}>기본 정보</div>

      {/* 대표 이미지 */}
      <div>
        <label style={labelStyle}>대표 이미지</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {imageUrl ? (
          <div style={{ position: 'relative' }}>
            <img src={imageUrl} alt="미리보기"
              style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 10 }} />
            <button
              onClick={() => { resetImage(); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              style={{
                position: 'absolute', top: 8, right: 8,
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
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
              height: 120,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {uploading ? `업로드 중... ${progress}%` : '📷 갤러리에서 선택'}
          </button>
        )}
      </div>

      {/* 상품명 */}
      <div>
        <label style={labelStyle}>상품명 *</label>
        <input
          style={inputStyle}
          placeholder="예) 여름 린넨 셔츠 / 멀티비타민 60정"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label style={labelStyle}>카테고리</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              style={{
                padding: '8px 14px', borderRadius: 9999,
                border: '1.5px solid',
                borderColor: category === cat ? 'var(--color-pink)' : 'var(--color-gray-200)',
                background: category === cat ? 'var(--color-pink)' : 'white',
                color: category === cat ? 'white' : 'var(--color-gray-700)',
                fontSize: '0.8125rem', fontWeight: 600, minHeight: 40, cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        {OPTION_TEMPLATES[category] && (
          <div style={{
            marginTop: 8, fontSize: '0.6875rem', color: 'var(--color-gray-500)',
          }}>
            💡 {category} 선택 시 기본 옵션(사이즈/용량)이 자동 입력됩니다 — 편집 가능
          </div>
        )}
      </div>

      {/* ─── 판매 정보 ─── */}
      <div style={sectionTitleStyle}>판매 정보</div>

      {/* 단일/옵션 토글 */}
      <div>
        <label style={labelStyle}>판매 형태</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: false, label: '단일 상품', desc: '가격 하나' },
            { value: true, label: '옵션 상품', desc: '사이즈·용량 등' },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setHasOptions(opt.value)}
              style={{
                flex: 1, padding: '12px 10px', borderRadius: 10,
                border: '1.5px solid',
                borderColor: hasOptions === opt.value ? 'var(--color-pink)' : 'var(--color-gray-200)',
                background: hasOptions === opt.value ? 'var(--color-pink)' : 'white',
                color: hasOptions === opt.value ? 'white' : 'var(--color-gray-700)',
                minHeight: 52, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{opt.label}</span>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 400,
                opacity: hasOptions === opt.value ? 0.9 : 0.6,
              }}>
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 단일 상품: 가격 · 재고 */}
      {!hasOptions && (
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1.5 }}>
            <label style={labelStyle}>판매가 *</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: 36 }}
                inputMode="numeric"
                placeholder="0"
                value={formatPrice(singlePrice)}
                onChange={(e) => setSinglePrice(e.target.value)}
              />
              <span style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-gray-500)', fontSize: '0.875rem',
              }}>
                원
              </span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>재고</label>
            <input
              style={inputStyle}
              inputMode="numeric"
              placeholder="50"
              value={singleStock}
              onChange={(e) => setSingleStock(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
        </div>
      )}

      {/* 옵션 상품 */}
      {hasOptions && (
        <>
          <div>
            <label style={labelStyle}>옵션명</label>
            <input
              style={inputStyle}
              placeholder="예) 사이즈 / 용량 / 향 / 타입"
              value={optionGroupName}
              onChange={(e) => setOptionGroupName(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>옵션 값 · 가격 · 재고 *</label>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto',
              gap: 6, fontSize: '0.6875rem', fontWeight: 600,
              color: 'var(--color-gray-500)', marginBottom: 4, padding: '0 2px',
            }}>
              <span>{optionGroupName || '옵션'}</span>
              <span>가격</span>
              <span>재고</span>
              <span />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {variants.map((v, idx) => (
                <div key={idx} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto',
                  gap: 6, alignItems: 'center',
                }}>
                  <input
                    style={cellStyle}
                    placeholder="예) M / 60정 / 라벤더"
                    value={v.name}
                    onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                  />
                  <input
                    style={cellStyle}
                    inputMode="numeric"
                    placeholder="0"
                    value={formatPrice(v.price)}
                    onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                  />
                  <input
                    style={cellStyle}
                    inputMode="numeric"
                    placeholder="50"
                    value={v.stock}
                    onChange={(e) => updateVariant(idx, 'stock', e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <button
                    onClick={() => removeVariant(idx)}
                    disabled={variants.length === 1}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: '1px solid var(--color-gray-200)',
                      background: 'white',
                      color: variants.length === 1 ? 'var(--color-gray-300)' : '#991B1B',
                      fontSize: 14, cursor: variants.length === 1 ? 'not-allowed' : 'pointer',
                    }}
                    title="행 삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addVariant}
              style={{
                width: '100%', marginTop: 8, padding: '10px',
                borderRadius: 10, border: '1.5px dashed var(--color-gray-300)',
                background: 'white', color: 'var(--color-gray-500)',
                fontSize: '0.8125rem', fontWeight: 600, minHeight: 40, cursor: 'pointer',
              }}
            >
              + 옵션 추가
            </button>
          </div>
        </>
      )}

      {/* 색상 */}
      <div>
        <label style={labelStyle}>
          색상 <span style={{ color: 'var(--color-gray-400)', fontWeight: 400 }}>(선택)</span>
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="예) 그레이, 하늘색, 아이보리"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addColor();
              }
            }}
          />
          <button
            onClick={addColor}
            style={{
              padding: '0 16px', borderRadius: 10,
              border: '1.5px solid var(--color-pink)',
              background: 'white', color: 'var(--color-pink)',
              fontSize: '0.875rem', fontWeight: 700, minHeight: 44, cursor: 'pointer',
            }}
          >
            추가
          </button>
        </div>
        {colors.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {colors.map((c) => (
              <span
                key={c}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 9999,
                  background: 'var(--color-pink)', color: 'white',
                  fontSize: '0.8125rem', fontWeight: 600,
                }}
              >
                {c}
                <button
                  onClick={() => removeColor(c)}
                  style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.3)', color: 'white',
                    fontSize: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 태그/키워드 */}
      <div>
        <label style={labelStyle}>
          태그 · 키워드 <span style={{ color: 'var(--color-gray-400)', fontWeight: 400 }}>(선택)</span>
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="예) 냉감, 오버핏, 무향"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <button
            onClick={addTag}
            style={{
              padding: '0 16px', borderRadius: 10,
              border: '1.5px solid var(--color-gray-300)',
              background: 'white', color: 'var(--color-gray-700)',
              fontSize: '0.875rem', fontWeight: 700, minHeight: 44, cursor: 'pointer',
            }}
          >
            추가
          </button>
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 9999,
                  background: 'var(--color-gray-100)',
                  fontSize: '0.8125rem', fontWeight: 600,
                }}
              >
                {t}
                <button
                  onClick={() => removeTag(t)}
                  style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--color-gray-300)', color: 'white',
                    fontSize: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── 상품 소개 ─── */}
      <div style={sectionTitleStyle}>상품 소개</div>

      <div>
        <label style={labelStyle}>상세 설명</label>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="상품 소개, 사용 방법, 포인트 등"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* 상세 이미지 */}
      <div>
        <label style={labelStyle}>
          상세 이미지
          {detailImages.length > 0 && (
            <span style={{ marginLeft: 6, color: 'var(--color-gray-500)', fontWeight: 500 }}>
              · {detailImages.length}장
            </span>
          )}
        </label>
        <input
          ref={detailInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleDetailFiles}
          style={{ display: 'none' }}
        />

        {detailImages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
            {detailImages.map((url, idx) => (
              <div key={url} style={{
                position: 'relative', borderRadius: 10, overflow: 'hidden',
                border: '1px solid var(--color-gray-200)',
              }}>
                <img src={url} alt={`상세 ${idx + 1}`}
                  style={{ width: '100%', display: 'block' }} />
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  background: 'rgba(0,0,0,0.6)', color: 'white',
                  padding: '2px 8px', borderRadius: 6,
                  fontSize: '0.6875rem', fontWeight: 600,
                }}>
                  {idx + 1}
                </div>
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  display: 'flex', gap: 4,
                }}>
                  <button onClick={() => moveDetailImage(idx, -1)} disabled={idx === 0}
                    style={detailActionBtn(idx === 0)} title="위로">▲</button>
                  <button onClick={() => moveDetailImage(idx, 1)} disabled={idx === detailImages.length - 1}
                    style={detailActionBtn(idx === detailImages.length - 1)} title="아래로">▼</button>
                  <button onClick={() => removeDetailImage(idx)}
                    style={{ ...detailActionBtn(false), background: 'rgba(220,38,38,0.9)' }}
                    title="삭제">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => detailInputRef.current?.click()}
          disabled={detailUploading}
          style={{
            ...inputStyle,
            background: 'var(--color-gray-50)',
            color: 'var(--color-gray-500)',
            textAlign: 'center',
            cursor: 'pointer',
            height: 64,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {detailUploading
            ? '상세 이미지 업로드 중...'
            : `📷 상세 이미지 추가${detailImages.length > 0 ? ' (여러 장 선택 가능)' : ''}`}
        </button>
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
          세로로 긴 상세컷 · 성분표 · 사용법 이미지 등을 순서대로 넣을 수 있어요
        </div>
      </div>

      {/* ─── 상품 정보 고시 ─── */}
      <div style={sectionTitleStyle}>상품 정보 고시</div>

      <div>
        {category && INFO_PRESETS[category] && (
          <button
            onClick={() => applyInfoPreset(category)}
            style={{
              fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--color-pink)', padding: '6px 12px',
              border: '1px solid var(--color-pink)', borderRadius: 8,
              background: 'white', minHeight: 32, cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            📋 {category} 기본 항목 불러오기
          </button>
        )}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 2fr auto',
          gap: 6, fontSize: '0.6875rem', fontWeight: 600,
          color: 'var(--color-gray-500)', marginBottom: 4, padding: '0 2px',
        }}>
          <span>항목</span>
          <span>내용</span>
          <span />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {info.map((row, idx) => (
            <div key={idx} style={{
              display: 'grid', gridTemplateColumns: '1fr 2fr auto',
              gap: 6, alignItems: 'center',
            }}>
              <input
                style={cellStyle}
                placeholder="예) 소재"
                value={row.key}
                onChange={(e) => updateInfoRow(idx, 'key', e.target.value)}
              />
              <input
                style={cellStyle}
                placeholder="예) 면 100%"
                value={row.value}
                onChange={(e) => updateInfoRow(idx, 'value', e.target.value)}
              />
              <button
                onClick={() => removeInfoRow(idx)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid var(--color-gray-200)',
                  background: 'white', color: '#991B1B',
                  fontSize: 14, cursor: 'pointer',
                }}
                title="행 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addInfoRow}
          style={{
            width: '100%', marginTop: 8, padding: '10px',
            borderRadius: 10, border: '1.5px dashed var(--color-gray-300)',
            background: 'white', color: 'var(--color-gray-500)',
            fontSize: '0.8125rem', fontWeight: 600, minHeight: 40, cursor: 'pointer',
          }}
        >
          + 항목 추가
        </button>
      </div>

      {/* 등록 */}
      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={submitting || uploading || detailUploading}
        style={{
          width: '100%', padding: '14px', fontSize: '1rem',
          marginTop: 12, opacity: (submitting || uploading || detailUploading) ? 0.6 : 1,
        }}
      >
        {submitting
          ? '등록 중...'
          : uploading
            ? `대표 이미지 업로드 중... ${progress}%`
            : detailUploading
              ? '상세 이미지 업로드 중...'
              : '쇼핑몰에 등록하기'}
      </button>
    </div>
  );
}
