import { Link } from 'react-router-dom';

// 고객용 페이지 푸터 — 토스 심사 필수 링크 노출용
export default function Footer({ compact = false }) {
  return (
    <footer style={{
      padding: compact ? '16px 16px 24px' : '24px 16px 40px',
      background: '#FAFAFA',
      borderTop: '1px solid var(--color-gray-200)',
      fontSize: '0.6875rem',
      color: 'var(--color-gray-500)',
      lineHeight: 1.6,
    }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginBottom: 10,
      }}>
        <Link to="/legal/business" style={linkStyle}>사업자 정보</Link>
        <Link to="/legal/terms" style={linkStyle}>이용약관</Link>
        <Link to="/legal/privacy" style={{ ...linkStyle, fontWeight: 700, color: 'var(--color-gray-700)' }}>
          개인정보처리방침
        </Link>
        <Link to="/legal/refund" style={linkStyle}>환불·교환 정책</Link>
      </div>
      <div>
        <div>온빛 · 대표 황유진 · 사업자등록번호 882-39-01416</div>
        <div>통신판매업 신고 신청 중</div>
        <div>주소 경기도 양주시 덕정11길 29, 2동 202호 (덕정동, 주아팰리스)</div>
        <div>고객센터 010-8555-6595 · ghkd7942@gmail.com</div>
        <div style={{ marginTop: 8, fontSize: '0.625rem' }}>
          © {new Date().getFullYear()} 셀러픽 (SellerPick). 본 사이트의 결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
        </div>
      </div>
    </footer>
  );
}

const linkStyle = {
  color: 'var(--color-gray-600)',
  textDecoration: 'none',
};
