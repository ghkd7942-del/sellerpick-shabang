import { useState, useMemo, useRef } from 'react';
import { updateDocument, addDocument } from '../lib/firestoreAPI';
import { uploadImageFile } from '../lib/uploadImage';

const CATEGORIES = ['의류', '잡화', '뷰티', '식품·건강', '침구·생활', '기타'];

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

const matrixCellStyle = {
  padding: '8px',
  border: '1px solid var(--color-gray-200)',
  borderRadius: 6,
  fontSize: '0.875rem',
  outline: 'none',
  textAlign: 'center',
  width: '100%',
  minWidth: 56,
  minHeight: 40,
};

function formatPrice(val) {
  if (val === '' || val == null) return '';
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('ko-KR');
}

function toNum(v) {
  return parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0;
}

function normalizeColors(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => (typeof c === 'string' ? c : c?.name || '')).filter(Boolean);
}

export default function EditShopProduct({ product, onClose, mode = 'edit' }) {
  const isClone = mode === 'clone';
  const mainFileRef = useRef(null);
  const detailFileRef = useRef(null);

  const [name, setName] = useState(
    isClone ? `${product.name || ''} (복사)` : (product.name || '')
  );
  const [description, setDescription] = useState(product.description || '');
  const [category, setCategory] = useState(product.category || '');
  const [mainImage, setMainImage] = useState(product.imageUrl || '');
  const [mainUploading, setMainUploading] = useState(false);
  const [detailImages, setDetailImages] = useState(
    Array.isArray(product.detailImages) ? product.detailImages : []
  );
  const [detailUploading, setDetailUploading] = useState(false);
  const [info, setInfo] = useState(() => {
    if (Array.isArray(product.info) && product.info.length > 0) return product.info;
    return [{ key: '', value: '' }];
  });
  const [variants, setVariants] = useState(() =>
    Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants.map((v) => ({
          name: v.name || '',
          price: String(v.price ?? ''),
          stock: String(v.stock ?? '50'),
        }))
      : [{ name: '', price: String(product.price ?? ''), stock: String(product.stock ?? '') }]
  );
  const [colors, setColors] = useState(() => normalizeColors(product.colors));
  const [colorInput, setColorInput] = useState('');

  // (색상 × 사이즈) 매트릭스 — 기존 product.stockMatrix 우선, 없으면 variants의 stock으로 초기화
  const [matrix, setMatrix] = useState(() => {
    const m = {};
    const colorNames = normalizeColors(product.colors);
    const variantRows = Array.isArray(product.variants) ? product.variants : [];
    colorNames.forEach((c) => {
      m[c] = {};
      variantRows.forEach((v) => {
        m[c][v.name] = product.stockMatrix?.[c]?.[v.name] ?? (v.stock ?? 50);
      });
    });
    return m;
  });

  const [originalPrice, setOriginalPrice] = useState(
    product.originalPrice ? String(product.originalPrice) : ''
  );
  const [submitting, setSubmitting] = useState(false);

  const hasColors = colors.length > 0;
  const hasVariants = variants.length > 0 && variants.some((v) => v.name.trim());
  const showMatrix = hasColors && hasVariants;

  // 매트릭스 합계 미리보기
  const matrixTotal = useMemo(() => {
    if (!showMatrix) return 0;
    return colors.reduce((total, c) => {
      const row = matrix[c] || {};
      return total + variants.reduce((s, v) => s + (toNum(row[v.name]) || 0), 0);
    }, 0);
  }, [matrix, colors, variants, showMatrix]);

  // 색상 추가/삭제 — 매트릭스 동기화
  const addColor = () => {
    const v = colorInput.trim();
    if (!v || colors.includes(v)) { setColorInput(''); return; }
    setColors((prev) => [...prev, v]);
    setMatrix((prev) => ({
      ...prev,
      [v]: variants.reduce((acc, vt) => {
        acc[vt.name] = toNum(vt.stock) || 50;
        return acc;
      }, {}),
    }));
    setColorInput('');
  };

  const removeColor = (c) => {
    setColors((prev) => prev.filter((x) => x !== c));
    setMatrix((prev) => {
      const next = { ...prev };
      delete next[c];
      return next;
    });
  };

  // 사이즈 variants 편집
  const addVariant = () => {
    setVariants((prev) => [...prev, { name: '', price: '', stock: '50' }]);
  };

  const removeVariant = (idx) => {
    if (variants.length <= 1) return;
    const removedName = variants[idx].name;
    setVariants((prev) => prev.filter((_, i) => i !== idx));
    setMatrix((prev) => {
      const next = {};
      Object.keys(prev).forEach((c) => {
        const { [removedName]: _, ...rest } = prev[c];
        next[c] = rest;
      });
      return next;
    });
  };

  const updateVariant = (idx, field, value) => {
    const oldName = variants[idx].name;
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
    // 사이즈 이름 바뀌면 매트릭스 키도 이동
    if (field === 'name' && oldName !== value) {
      setMatrix((prev) => {
        const next = {};
        Object.keys(prev).forEach((c) => {
          const row = { ...prev[c] };
          if (oldName in row) {
            row[value] = row[oldName];
            delete row[oldName];
          }
          next[c] = row;
        });
        return next;
      });
    }
  };

  const updateMatrixCell = (color, sizeName, raw) => {
    const num = toNum(raw);
    setMatrix((prev) => ({
      ...prev,
      [color]: { ...(prev[color] || {}), [sizeName]: num },
    }));
  };

  // 대표 이미지 업로드
  const handleMainImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainUploading(true);
    try {
      const url = await uploadImageFile(file);
      if (url) setMainImage(url);
    } catch (err) {
      alert('이미지 업로드 실패: ' + err.message);
    }
    setMainUploading(false);
    if (mainFileRef.current) mainFileRef.current.value = '';
  };

  // 상세 이미지
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
    if (detailFileRef.current) detailFileRef.current.value = '';
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

  // 상품 정보 고시
  const addInfoRow = () => setInfo((prev) => [...prev, { key: '', value: '' }]);
  const removeInfoRow = (idx) =>
    setInfo((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : [{ key: '', value: '' }]));
  const updateInfoRow = (idx, field, value) =>
    setInfo((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  const handleSave = async () => {
    if (!name.trim()) { alert('상품명을 입력해주세요.'); return; }

    const cleanVariants = variants
      .map((v) => ({
        name: v.name.trim(),
        price: toNum(v.price),
        stock: toNum(v.stock),
      }))
      .filter((v) => v.name);

    if (cleanVariants.length === 0) {
      alert('사이즈(옵션)을 한 개 이상 입력해주세요.');
      return;
    }

    // 매트릭스 정리 — 현재 색상·사이즈 이름만 남기기
    const cleanMatrix = {};
    if (colors.length > 0) {
      colors.forEach((c) => {
        cleanMatrix[c] = {};
        cleanVariants.forEach((v) => {
          cleanMatrix[c][v.name] = toNum(matrix[c]?.[v.name]) || 0;
        });
      });
    }

    // 총 재고 = 매트릭스 합계(색상 있을 때) / variants 합계(색상 없을 때)
    const totalStock = colors.length > 0
      ? Object.values(cleanMatrix).reduce(
          (s, row) => s + Object.values(row).reduce((a, b) => a + b, 0),
          0
        )
      : cleanVariants.reduce((s, v) => s + v.stock, 0);

    const minPrice = Math.min(...cleanVariants.map((v) => v.price).filter((p) => p > 0));

    const cleanInfo = info
      .map((r) => ({ key: r.key.trim(), value: r.value.trim() }))
      .filter((r) => r.key && r.value);

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        imageUrl: mainImage,
        detailImages,
        info: cleanInfo,
        variants: cleanVariants,
        colors: colors.map((n) => ({ name: n })),
        stockMatrix: cleanMatrix,
        stock: totalStock,
        price: isFinite(minPrice) && minPrice > 0 ? minPrice : (product.price || 0),
        originalPrice: toNum(originalPrice) || null,
        hasOptions: cleanVariants.length > 1 || Boolean(product.hasOptions),
        options: cleanVariants.map((v) => v.name).join(', '),
      };
      if (isClone) {
        await addDocument('products', {
          ...payload,
          tags: Array.isArray(product.tags) ? product.tags : [],
          isLive: false,
          createdAt: new Date().toISOString(),
        });
      } else {
        await updateDocument('products', product.id, payload);
      }
      onClose();
    } catch (err) {
      alert((isClone ? '복제' : '수정') + ' 실패: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
      {/* 기본 정보 */}
      <div style={sectionTitleStyle}>기본 정보</div>

      <div>
        <label style={labelStyle}>상품명 *</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {/* 대표 이미지 */}
      <div>
        <label style={labelStyle}>대표 이미지</label>
        <input
          ref={mainFileRef}
          type="file"
          accept="image/*"
          onChange={handleMainImage}
          style={{ display: 'none' }}
        />
        {mainImage ? (
          <div style={{ position: 'relative' }}>
            <img src={mainImage} alt="대표"
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10 }} />
            <button
              onClick={() => mainFileRef.current?.click()}
              disabled={mainUploading}
              style={{
                position: 'absolute', bottom: 8, right: 8,
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(0,0,0,0.7)', color: 'white',
                fontSize: '0.75rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
              }}
            >
              {mainUploading ? `업로드 중...` : '변경'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => mainFileRef.current?.click()}
            disabled={mainUploading}
            style={{
              ...inputStyle,
              background: 'var(--color-gray-50)',
              color: 'var(--color-gray-500)',
              textAlign: 'center', cursor: 'pointer',
              height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mainUploading ? '업로드 중...' : '📷 대표 이미지 선택'}
          </button>
        )}
      </div>

      {/* 카테고리 */}
      <div>
        <label style={labelStyle}>카테고리</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
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
      </div>

      <div>
        <label style={labelStyle}>상세 설명</label>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="상품 소개, 사용 방법, 포인트 등"
        />
      </div>

      {/* 정가 (할인 표시용) */}
      <div style={sectionTitleStyle}>정가 (선택)</div>
      <div>
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...inputStyle, paddingRight: 36 }}
            inputMode="numeric"
            placeholder="할인 전 가격 — 입력 시 자동 할인율 표시"
            value={formatPrice(originalPrice)}
            onChange={(e) => setOriginalPrice(e.target.value)}
          />
          <span style={{
            position: 'absolute', right: 14, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-gray-500)', fontSize: '0.875rem',
          }}>
            원
          </span>
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
          정가가 판매가보다 크면 상품 카드에 <span style={{ textDecoration: 'line-through' }}>정가</span> 와 할인율(%)이 함께 표시됩니다.
        </div>
      </div>

      {/* 사이즈·가격 */}
      <div style={sectionTitleStyle}>사이즈 · 가격</div>

      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.5fr auto',
          gap: 6, fontSize: '0.6875rem', fontWeight: 600,
          color: 'var(--color-gray-500)', marginBottom: 4, padding: '0 2px',
        }}>
          <span>사이즈/옵션</span>
          <span>가격</span>
          <span />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {variants.map((v, idx) => (
            <div key={idx} style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr auto',
              gap: 6, alignItems: 'center',
            }}>
              <input
                style={cellStyle}
                placeholder="예) SS 120X210"
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
          + 사이즈 추가
        </button>
      </div>

      {/* 색상 */}
      <div style={sectionTitleStyle}>색상</div>
      <div>
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
              <span key={c} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 9999,
                background: 'var(--color-pink)', color: 'white',
                fontSize: '0.8125rem', fontWeight: 600,
              }}>
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

      {/* 색상 × 사이즈 재고 매트릭스 */}
      {showMatrix && (
        <>
          <div style={sectionTitleStyle}>재고 편집 (색상 × 사이즈)</div>
          <div style={{
            background: 'white', borderRadius: 10,
            border: '1px solid var(--color-gray-200)',
            padding: 10, overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{
                width: '100%', borderCollapse: 'separate', borderSpacing: 4,
                fontSize: '0.75rem',
              }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: 6, textAlign: 'left',
                      color: 'var(--color-gray-500)', fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}>
                      색상 \ 사이즈
                    </th>
                    {variants.filter((v) => v.name.trim()).map((v) => (
                      <th key={v.name} style={{
                        padding: 6, textAlign: 'center',
                        color: 'var(--color-gray-700)', fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {v.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {colors.map((c) => (
                    <tr key={c}>
                      <td style={{
                        padding: 6, fontWeight: 600,
                        color: 'var(--color-gray-700)',
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{
                          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                          background: 'var(--color-pink)', marginRight: 6,
                        }} />
                        {c}
                      </td>
                      {variants.filter((v) => v.name.trim()).map((v) => (
                        <td key={v.name} style={{ padding: 2 }}>
                          <input
                            style={matrixCellStyle}
                            inputMode="numeric"
                            value={matrix[c]?.[v.name] ?? ''}
                            onChange={(e) => updateMatrixCell(c, v.name, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{
              marginTop: 10, paddingTop: 10,
              borderTop: '1px solid var(--color-gray-100)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '0.8125rem',
            }}>
              <span style={{ color: 'var(--color-gray-500)' }}>저장 시 총 재고</span>
              <span style={{ fontWeight: 700, color: 'var(--color-pink)', fontSize: '1rem' }}>
                {matrixTotal}개
              </span>
            </div>
          </div>
        </>
      )}

      {/* ─── 상세 페이지 ─── */}
      <div style={sectionTitleStyle}>상세 페이지</div>

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
          ref={detailFileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleDetailFiles}
          style={{ display: 'none' }}
        />
        {detailImages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {detailImages.map((url, idx) => (
              <div key={url + idx} style={{
                position: 'relative', borderRadius: 10, overflow: 'hidden',
                border: '1px solid var(--color-gray-200)',
              }}>
                <img src={url} alt={`상세 ${idx + 1}`} style={{ width: '100%', display: 'block' }} />
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
                    style={detailActionBtn(idx === 0)}>▲</button>
                  <button onClick={() => moveDetailImage(idx, 1)} disabled={idx === detailImages.length - 1}
                    style={detailActionBtn(idx === detailImages.length - 1)}>▼</button>
                  <button onClick={() => removeDetailImage(idx)}
                    style={{ ...detailActionBtn(false), background: 'rgba(220,38,38,0.9)' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => detailFileRef.current?.click()}
          disabled={detailUploading}
          style={{
            ...inputStyle,
            background: 'var(--color-gray-50)',
            color: 'var(--color-gray-500)',
            textAlign: 'center', cursor: 'pointer',
            height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {detailUploading
            ? '상세 이미지 업로드 중...'
            : `📷 상세 이미지 추가${detailImages.length > 0 ? ' (여러 장 선택 가능)' : ''}`}
        </button>
      </div>

      {/* 상품 정보 고시 */}
      <div>
        <label style={labelStyle}>상품 정보 고시</label>
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

      {/* 저장 */}
      <button
        onClick={handleSave}
        disabled={submitting || mainUploading || detailUploading}
        className="btn-primary"
        style={{
          width: '100%', padding: '14px', fontSize: '1rem',
          marginTop: 8,
          opacity: (submitting || mainUploading || detailUploading) ? 0.6 : 1,
        }}
      >
        {submitting
          ? (isClone ? '복제 중...' : '저장 중...')
          : mainUploading
            ? '대표 이미지 업로드 중...'
            : detailUploading
              ? '상세 이미지 업로드 중...'
              : (isClone ? '복제하기' : '저장하기')}
      </button>
    </div>
  );
}
