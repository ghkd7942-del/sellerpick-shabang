// 관리자로 허용된 이메일 목록
// 여기에 등록된 이메일로 로그인한 사용자만 /admin 접근 가능
export const ADMIN_EMAILS = [
  'namzzong1328@gmail.com',
  'ghkd7942@gmail.com',
];

export function isAdmin(user) {
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
