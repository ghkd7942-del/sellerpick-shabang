const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

function getRedirectUri() {
  return `${window.location.origin}/auth/kakao/callback`;
}

export function startKakaoLogin(sellerSlug) {
  const state = crypto.randomUUID();
  sessionStorage.setItem('kakao_oauth_state', state);
  if (sellerSlug) sessionStorage.setItem('kakao_oauth_seller', sellerSlug);

  const params = new URLSearchParams({
    client_id: REST_API_KEY,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    state,
    scope: 'profile_nickname,profile_image,account_email',
  });

  window.location.href = `${KAKAO_AUTH_URL}?${params.toString()}`;
}

export function readCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  const expectedState = sessionStorage.getItem('kakao_oauth_state');
  const sellerSlug = sessionStorage.getItem('kakao_oauth_seller') || null;

  sessionStorage.removeItem('kakao_oauth_state');
  sessionStorage.removeItem('kakao_oauth_seller');

  return { code, state, expectedState, sellerSlug, error, errorDescription, redirectUri: getRedirectUri() };
}
