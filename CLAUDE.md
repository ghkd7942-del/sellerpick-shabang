# 샤방이 (Shabang / Sellerpick) — 쇼핑몰

> ⚠️ 이 폴더는 **샤방이** 프로젝트입니다. 록킹가자 골프앱과 혼동 금지.
> 폴더 이름은 `여왕누나` 지만 **샤방이 / sellerpick-shabang** 이 맞는 제품명입니다.

## 프로젝트 정보

| 항목 | 값 |
|------|-----|
| 이름 | 샤방이 (Sellerpick Shabang) |
| 성격 | 라이브 커머스 / 쇼핑몰 플랫폼 |
| 로컬 폴더 | `/Volumes/SSD 2T/코딩/여왕누나` |
| Vercel 프로젝트 | `sellerpick-shabang` |
| 도메인 | https://sellerpick-shabang.vercel.app |
| GitHub | https://github.com/ghkd7942-del/sellerpick-shabang |
| Firebase 프로젝트 | `sellerpick-shabang` |

## 스택

- React 19 + Vite + React Router (App Router 아님)
- Firebase Auth (Google + 카카오), Firestore, Storage
- Vercel Functions (`/api/*`) — 알림톡(Solapi), 카카오 로그인 콜백
- 카카오 로그인: OAuth Authorization Code → `/api/kakao-auth` → Firebase Custom Token

## 주요 디렉토리 / 라우트

- `src/pages/` — 페이지 컴포넌트
  - 관리자(`/admin/*`): AdminDashboard, OrderManagement, ProductManagement 등
  - 고객(`/shop/:sellerSlug/*`): ShopHome, ProductDetail, Cart, Checkout, CustomerLogin 등
  - 인증 콜백: `/auth/kakao/callback` → KakaoCallback
- `src/hooks/useAuth.jsx` — 로그인/회원가입 (Google popup, 카카오 redirect)
- `src/lib/kakao.js` — 카카오 OAuth URL 빌더 & 콜백 파서
- `api/_firebaseAdmin.js` — Firebase Admin 공용 헬퍼 (base64 서비스 계정 지원)
- `api/kakao-auth.js` — 카카오 토큰 교환 + Firebase Custom Token 발급
- `api/send-alimtalk.js` — Solapi 알림톡 발송

## 카카오 디벨로퍼스 설정

- 앱 이름: **샤방이** (ID 1435600)
- Redirect URI:
  - `https://sellerpick-shabang.vercel.app/auth/kakao/callback`
  - `http://localhost:5173/auth/kakao/callback`
- 동의항목: 닉네임, 프로필 사진, 카카오계정(이메일) — 모두 필수
- 비즈 앱 전환 완료

## 환경변수 (Vercel + .env.local)

클라이언트 (VITE_*):
- `VITE_FIREBASE_*` — Firebase client config
- `VITE_KAKAO_REST_API_KEY` — 카카오 authorize URL 생성용
- `VITE_KAKAO_JS_KEY` — (선택) JavaScript SDK 쓸 때만

서버 (Vercel Functions):
- `KAKAO_REST_API_KEY` — 토큰 교환 (VITE_ 없음)
- `FIREBASE_SERVICE_ACCOUNT_KEY` — **base64 인코딩된** JSON 문자열
- `SOLAPI_*` — 알림톡 발송

## 자매 프로젝트

- **록킹가자** (골프 코칭앱, 별도 프로젝트): `~/Desktop/코딩/rockinggaza`
