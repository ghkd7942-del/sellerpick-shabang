import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument } from '../lib/firestoreAPI';
import useCart from '../hooks/useCart';
import Footer from '../components/Footer';
import '../styles/admin.css';

function normalizeColors(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => (typeof c === 'string' ? c : c?.name || '')).filter(Boolean);
}

export default function ProductDetail() {
  const { sellerSlug, productId } = useParams();
  const navigate = useNavigate();
  const { addItem, totalCount } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      const data = await getDocument('products', productId);
      if (data) setProduct({ id: productId, ...data });
      setLoading(false);
    })();
  }, [productId]);

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const colors = useMemo(() => normalizeColors(product?.colors), [product?.colors]);

  // 기본 선택값 — 첫 번째 variant / color
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) setSelectedVariant(variants[0].name);
    if (colors.length > 0 && !selectedColor) setSelectedColor(colors[0]);
  }, [variants, colors, selectedVariant, selectedColor]);

  const currentVariant = variants.find((v) => v.name === selectedVariant);
  const currentPrice = currentVariant?.price ?? product?.price ?? 0;

  // 현재 (색상, 사이즈) 조합의 재고
  const cellStock = useMemo(() => {
    if (!product) return 0;
    if (selectedColor && selectedVariant && product.stockMatrix?.[selectedColor]?.[selectedVariant] != null) {
      return product.stockMatrix[selectedColor][selectedVariant];
    }
    if (currentVariant) return currentVariant.stock ?? 0;
    return product.stock ?? 0;
  }, [product, selectedColor, selectedVariant, currentVariant]);

  const isSoldOut = cellStock <= 0;

  if (loading) {
    return (
      <div className="admin-container">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="admin-container">
        <header style={headerStyle}>
          <button onClick={() => navigate(-1)} style={backBtn}>←</button>
          <h1 style={{ fontSize: '1rem', fontWeight: 700 }}>상품 없음</h1>
        </header>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>
          상품을 찾을 수 없어요
        </div>
      </div>
    );
  }

  const handleOrder = () => {
    const optionLabel = [selectedColor, selectedVariant].filter(Boolean).join(' / ');
    navigate(`/shop/${sellerSlug}/order/${product.id}`, {
      state: { presetOption: optionLabel, presetQty: qty },
    });
  };

  const handleAddToCart = () => {
    const optionLabel = [selectedColor, selectedVariant].filter(Boolean).join(' / ');
    addItem({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl || '',
      price: currentPrice,
      option: optionLabel,
      color: selectedColor,
      size: selectedVariant,
      qty,
    });
    setToast('장바구니에 담았어요');
    setTimeout(() => setToast(''), 1500);
  };

  const detailImages = Array.isArray(product.detailImages) ? product.detailImages : [];
  const info = Array.isArray(product.info) ? product.info : [];

  return (
    <div className="admin-container">
      {/* 헤더 */}
      <header style={headerStyle}>
        <button onClick={() => navigate(-1)} style={backBtn}>←</button>
        <h1 style={{
          flex: 1, fontSize: '0.9375rem', fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {product.name}
        </h1>
        <button
          onClick={() => navigate(`/shop/${sellerSlug}/cart`)}
          style={{
            position: 'relative',
            width: 40, height: 40, borderRadius: '50%',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="장바구니"
        >
          🛒
          {totalCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              background: 'var(--color-pink)', color: 'white',
              fontSize: '0.625rem', fontWeight: 700,
              minWidth: 16, height: 16, borderRadius: 8,
              padding: '0 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {totalCount}
            </span>
          )}
        </button>
      </header>

      <div style={{ paddingBottom: 120 }}>
        {/* 대표 이미지 */}
        <div style={{
          width: '100%', aspectRatio: '1 / 1',
          background: product.imageUrl
            ? `url(${product.imageUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--color-gray-100), var(--color-gray-200))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!product.imageUrl && (
            <span style={{ fontSize: '3rem', opacity: 0.3 }}>📷</span>
          )}
        </div>

        {/* 기본 정보 */}
        <div style={{ padding: '20px 16px 0' }}>
          {product.category && (
            <div style={{
              fontSize: '0.6875rem', fontWeight: 600,
              color: 'var(--color-gray-500)', marginBottom: 6,
            }}>
              {product.category}
            </div>
          )}
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.4 }}>
            {product.name}
          </h2>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
            marginTop: 8,
          }}>
            <span style={{
              fontSize: '1.5rem', fontWeight: 800,
              color: 'var(--color-pink)',
            }}>
              {currentPrice.toLocaleString('ko-KR')}원
            </span>
            {variants.length > 1 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                ({selectedVariant || '옵션 선택'})
              </span>
            )}
          </div>
          {isSoldOut && (
            <div style={{
              marginTop: 8, fontSize: '0.8125rem', fontWeight: 700,
              color: 'var(--color-pink)',
            }}>
              품절
            </div>
          )}
        </div>

        {/* 색상 선택 */}
        {colors.length > 0 && (
          <div style={{ padding: '16px' }}>
            <div style={sectionLabel}>색상</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  style={{
                    padding: '8px 16px', borderRadius: 9999,
                    border: '1.5px solid',
                    borderColor: selectedColor === c ? 'var(--color-pink)' : 'var(--color-gray-200)',
                    background: selectedColor === c ? 'var(--color-pink)' : 'white',
                    color: selectedColor === c ? 'white' : 'var(--color-gray-700)',
                    fontSize: '0.8125rem', fontWeight: 600, minHeight: 40, cursor: 'pointer',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 사이즈/옵션 선택 */}
        {variants.length > 1 && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={sectionLabel}>
              {product.optionGroupName || '사이즈/옵션'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {variants.map((v) => {
                const vStock = product.stockMatrix?.[selectedColor]?.[v.name]
                  ?? v.stock ?? 0;
                const vSoldOut = vStock <= 0;
                const isSelected = selectedVariant === v.name;
                return (
                  <button
                    key={v.name}
                    onClick={() => !vSoldOut && setSelectedVariant(v.name)}
                    disabled={vSoldOut}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px', borderRadius: 10,
                      border: '1.5px solid',
                      borderColor: isSelected ? 'var(--color-pink)' : 'var(--color-gray-200)',
                      background: vSoldOut ? 'var(--color-gray-50)' : isSelected ? '#FFF0F3' : 'white',
                      color: vSoldOut ? 'var(--color-gray-400)' : 'var(--color-gray-700)',
                      cursor: vSoldOut ? 'not-allowed' : 'pointer',
                      minHeight: 48, textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{v.name}</span>
                      {vSoldOut && (
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700,
                          padding: '1px 6px', borderRadius: 4,
                          background: '#FEE2E2', color: '#991B1B',
                        }}>품절</span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.9375rem', fontWeight: 700,
                      color: vSoldOut ? 'var(--color-gray-400)' : 'var(--color-pink)',
                    }}>
                      {v.price?.toLocaleString('ko-KR')}원
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 수량 */}
        <div style={{ padding: '0 16px 20px' }}>
          <div style={sectionLabel}>수량</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setQty(Math.max(1, qty - 1))} style={qtyBtn} disabled={isSoldOut}>-</button>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, minWidth: 32, textAlign: 'center' }}>
              {qty}
            </span>
            <button onClick={() => setQty(qty + 1)} style={qtyBtn} disabled={isSoldOut}>+</button>
            <span style={{ marginLeft: 'auto', fontSize: '1rem', fontWeight: 700, color: 'var(--color-pink)' }}>
              {(currentPrice * qty).toLocaleString('ko-KR')}원
            </span>
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 8, background: 'var(--color-gray-100)' }} />

        {/* 상세 설명 */}
        {product.description && (
          <div style={{ padding: '20px 16px' }}>
            <div style={sectionLabel}>상세 설명</div>
            <p style={{
              fontSize: '0.9375rem', lineHeight: 1.7,
              color: 'var(--color-gray-700)',
              whiteSpace: 'pre-wrap', margin: 0,
            }}>
              {product.description}
            </p>
          </div>
        )}

        {/* 상세 이미지 */}
        {detailImages.length > 0 && (
          <div style={{ padding: '0 16px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detailImages.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${product.name} 상세 ${i + 1}`}
                  style={{
                    width: '100%', display: 'block', borderRadius: 8,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 상품 정보 고시 */}
        {info.length > 0 && (
          <>
            <div style={{ height: 8, background: 'var(--color-gray-100)' }} />
            <div style={{ padding: '20px 16px' }}>
              <div style={sectionLabel}>상품 정보 고시</div>
              <table style={{
                width: '100%', borderCollapse: 'collapse',
                fontSize: '0.8125rem',
              }}>
                <tbody>
                  {info.map((row, i) => (
                    <tr key={i} style={{
                      borderBottom: '1px solid var(--color-gray-100)',
                    }}>
                      <td style={{
                        padding: '10px 0',
                        color: 'var(--color-gray-500)',
                        width: '35%',
                        verticalAlign: 'top',
                      }}>
                        {row.key}
                      </td>
                      <td style={{
                        padding: '10px 0',
                        color: 'var(--color-gray-700)',
                        fontWeight: 500,
                      }}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <Footer compact />
      </div>

      {/* 하단 버튼 (장바구니 + 주문) */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 430, margin: '0 auto',
        padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        background: 'white', borderTop: '1px solid var(--color-gray-200)',
        zIndex: 50,
        display: 'flex', gap: 8,
      }}>
        <button
          onClick={handleAddToCart}
          disabled={isSoldOut}
          style={{
            flex: 1, padding: '16px', fontSize: '0.9375rem', fontWeight: 700,
            borderRadius: 12,
            border: '1.5px solid var(--color-pink)',
            background: 'white', color: 'var(--color-pink)',
            cursor: isSoldOut ? 'not-allowed' : 'pointer',
            opacity: isSoldOut ? 0.4 : 1,
            minHeight: 52,
          }}
        >
          🛒 담기
        </button>
        <button
          className="btn-primary"
          onClick={handleOrder}
          disabled={isSoldOut}
          style={{
            flex: 2, padding: '16px', fontSize: '1rem',
            opacity: isSoldOut ? 0.4 : 1,
          }}
        >
          {isSoldOut
            ? '품절'
            : `바로 주문하기 · ${(currentPrice * qty).toLocaleString('ko-KR')}원`}
        </button>
      </div>

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)', color: 'white',
          padding: '10px 20px', borderRadius: 9999,
          fontSize: '0.875rem', fontWeight: 600,
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const headerStyle = {
  position: 'sticky', top: 0, zIndex: 50,
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '0 12px', height: 56, background: 'white',
  borderBottom: '1px solid var(--color-gray-200)',
};

const backBtn = {
  fontSize: '1.25rem', minWidth: 44, minHeight: 44,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: 'none', cursor: 'pointer',
};

const sectionLabel = {
  fontSize: '0.75rem', fontWeight: 700,
  color: 'var(--color-gray-500)',
  marginBottom: 8,
  textTransform: 'none',
};

const qtyBtn = {
  width: 40, height: 40, borderRadius: 10,
  border: '1px solid var(--color-gray-200)',
  background: 'white', fontSize: '1.25rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};
