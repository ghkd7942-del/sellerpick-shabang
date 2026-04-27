// sellers 컬렉션 공용 유틸 — 단일 판매자 기준, slug 별칭 매핑 포함.
// 카카오톡/유튜브 채팅에서 한글 URL이 안 걸리는 경우가 있어 영문 slug(shabang)도 지원.

export const DEFAULT_SELLER_SLUG = 'shabang';

// URL 파라미터에 들어올 수 있는 값을 Firestore 문서 ID(slug)로 해석.
const SLUG_ALIASES = {
  shabang: 'shabang',
  '샤방이': 'shabang',
};

export function resolveSellerSlug(rawSlug) {
  if (!rawSlug) return DEFAULT_SELLER_SLUG;
  return SLUG_ALIASES[rawSlug] || rawSlug;
}

export function buildShortUrl(slug = DEFAULT_SELLER_SLUG) {
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://sellerpick-shabang.vercel.app';
  return `${origin}/s/${slug}`;
}

export function buildLiveShareMessage(sellerName, slug = DEFAULT_SELLER_SLUG) {
  const url = buildShortUrl(slug);
  return `🛍 ${sellerName} 라이브 특가!\n👇 여기서 바로 주문하세요\n${url}`;
}
