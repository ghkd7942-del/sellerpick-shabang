import { useParams, useNavigate } from 'react-router-dom';
import '../styles/admin.css';

// 사업자등록증 기반 실제 정보
// TODO: 통신판매업 신고 완료 시 telesalesNumber 교체
const BUSINESS = {
  name: '온빛',
  ceo: '황유진',
  bizNumber: '882-39-01416',
  telesalesNumber: '신청 중',
  address: '경기도 양주시 덕정11길 29, 2동 202호 (덕정동, 주아팰리스)',
  phone: '010-8555-6595',
  email: 'ghkd7942@gmail.com',
  hosting: 'Vercel Inc.',
  serviceName: '셀러픽 (SellerPick)',
  launchDate: '2026-04-02',
};

const SECTIONS = {
  business: {
    title: '사업자 정보',
    content: () => (
      <Table rows={[
        ['상호', BUSINESS.name],
        ['대표자', BUSINESS.ceo],
        ['사업자등록번호', BUSINESS.bizNumber],
        ['통신판매업 신고번호', BUSINESS.telesalesNumber],
        ['사업장 소재지', BUSINESS.address],
        ['고객센터 전화', BUSINESS.phone],
        ['이메일', BUSINESS.email],
        ['호스팅 서비스 제공자', BUSINESS.hosting],
        ['서비스명', BUSINESS.serviceName],
      ]} />
    ),
  },

  terms: {
    title: '이용약관',
    content: () => (
      <>
        <p><b>시행일: {BUSINESS.launchDate}</b></p>

        <H>제1조 (목적)</H>
        <P>본 약관은 {BUSINESS.name}(이하 "회사")이 제공하는 {BUSINESS.serviceName} 서비스(이하 "서비스")의 이용 조건, 절차, 회사와 이용자 간의 권리·의무·책임사항을 규정함을 목적으로 합니다.</P>

        <H>제2조 (정의)</H>
        <P>① "서비스"란 회사가 운영하는 라이브 커머스 플랫폼 및 관련 부가서비스를 말합니다.<br />
        ② "이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.<br />
        ③ "판매자"란 서비스를 통해 상품을 판매하는 셀러를 말합니다.<br />
        ④ "구매자"란 판매자의 상품을 구매하는 이용자를 말합니다.</P>

        <H>제3조 (약관의 명시 및 개정)</H>
        <P>① 회사는 본 약관의 내용을 이용자가 쉽게 확인할 수 있도록 서비스 초기 화면에 게시합니다.<br />
        ② 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정된 약관은 적용일 7일 전부터 공지합니다.</P>

        <H>제4조 (서비스 제공 및 변경)</H>
        <P>① 회사는 다음 서비스를 제공합니다: 상품 정보 제공, 주문·결제 중개, 배송 조회, 고객 응대 지원 등.<br />
        ② 회사는 서비스 품질 향상을 위해 서비스의 내용을 변경할 수 있으며, 변경 시 사전 공지합니다.</P>

        <H>제5조 (회원가입 및 관리)</H>
        <P>① 이용자는 서비스에서 제공하는 양식에 따라 회원정보를 기입하여 회원가입을 신청할 수 있습니다.<br />
        ② 회원은 자신의 계정을 타인에게 양도·대여할 수 없습니다.<br />
        ③ 회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 관련 법령에 따라 즉시 처리합니다.</P>

        <H>제6조 (구매신청 및 결제)</H>
        <P>① 구매자는 서비스에 표시된 방법에 따라 구매 신청을 할 수 있습니다.<br />
        ② 결제 수단은 토스페이먼츠를 통한 카드·계좌이체 결제, 무통장 입금 등을 포함합니다.<br />
        ③ 결제 승인이 완료되면 주문이 확정됩니다.</P>

        <H>제7조 (상품 공급)</H>
        <P>① 판매자는 결제 완료된 주문에 대해 명시된 기간 내에 상품을 발송합니다.<br />
        ② 재고 부족, 천재지변 등 불가항력 사유 발생 시 구매자에게 즉시 통지하고 환불 등의 조치를 취합니다.</P>

        <H>제8조 (청약철회·환불·교환)</H>
        <P>① 구매자는 「전자상거래법」에 따라 상품 수령일로부터 7일 이내에 청약철회(환불)를 요청할 수 있습니다.<br />
        ② 다음의 경우 환불이 제한될 수 있습니다:<br />
        &nbsp;&nbsp;- 구매자의 책임 있는 사유로 상품이 멸실·훼손된 경우<br />
        &nbsp;&nbsp;- 구매자의 사용·일부 소비로 가치가 감소한 경우<br />
        &nbsp;&nbsp;- 복제 가능한 상품의 포장을 훼손한 경우<br />
        ③ 자세한 내용은 별도의 「환불·교환 정책」에 따릅니다.</P>

        <H>제9조 (개인정보보호)</H>
        <P>회사는 관련 법령에 따라 이용자의 개인정보를 보호하며, 구체적인 사항은 별도의 「개인정보처리방침」에 따릅니다.</P>

        <H>제10조 (면책)</H>
        <P>① 회사는 천재지변, 불가항력 또는 이용자의 귀책 사유로 발생한 손해에 대해 책임지지 않습니다.<br />
        ② 회사는 이용자 간 또는 이용자와 제3자 간 분쟁에 개입할 의무가 없으며, 관련 손해를 배상할 책임이 없습니다.</P>

        <H>제11조 (분쟁 해결)</H>
        <P>서비스 이용과 관련하여 분쟁이 발생한 경우 회사와 이용자는 성실히 협의하여 해결합니다. 협의가 되지 않는 경우 관할 법원은 「민사소송법」에 따릅니다.</P>

        <P style={{ color: '#6B7280', marginTop: 24, fontSize: '0.75rem' }}>
          문의: {BUSINESS.email} · {BUSINESS.phone}
        </P>
      </>
    ),
  },

  privacy: {
    title: '개인정보처리방침',
    content: () => (
      <>
        <p><b>시행일: {BUSINESS.launchDate}</b></p>
        <P>{BUSINESS.name}(이하 "회사")는 「개인정보 보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 따라 이용자의 개인정보를 보호하고 관련 고충을 신속·원활하게 처리하기 위하여 본 방침을 수립·공개합니다.</P>

        <H>1. 수집하는 개인정보 항목</H>
        <P>① 회원가입·서비스 이용 시: 이름, 전화번호, 이메일, 주소, 로그인 식별자(카카오/구글)<br />
        ② 주문·결제 시: 주문자명, 수령인, 배송지, 연락처, 결제 정보(결제 대행사 토스페이먼츠가 처리)<br />
        ③ 자동 수집: IP, 쿠키, 접속 로그, 기기 정보</P>

        <H>2. 개인정보의 수집 및 이용 목적</H>
        <P>- 회원 식별 및 본인 확인<br />
        - 상품 주문·결제·배송·교환·환불 처리<br />
        - 고객 응대 및 분쟁 해결<br />
        - 서비스 개선 및 통계 분석<br />
        - 관련 법령상 의무 이행</P>

        <H>3. 개인정보의 보유 및 이용 기간</H>
        <P>- 회원 정보: 회원 탈퇴 시까지 (관련 법령 의무 보유기간 예외)<br />
        - 계약·청약철회 기록: 5년 (전자상거래법)<br />
        - 대금결제·재화공급 기록: 5년<br />
        - 소비자 불만·분쟁처리 기록: 3년<br />
        - 접속 로그: 3개월 (통신비밀보호법)</P>

        <H>4. 개인정보의 제3자 제공</H>
        <P>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 아래의 경우 예외로 합니다:<br />
        ① 이용자가 사전 동의한 경우<br />
        ② 법령에 의거하거나 수사기관의 적법한 요청이 있는 경우<br />
        ③ 배송을 위해 필요한 경우 운송사에 수령인 정보 제공</P>

        <H>5. 개인정보의 처리 위탁</H>
        <P>원활한 서비스 제공을 위해 아래 업체에 업무를 위탁합니다:<br />
        - Google Firebase (인증·데이터 저장, 구글 LLC)<br />
        - Vercel Inc. (웹 호스팅)<br />
        - 토스페이먼츠 (결제 처리)<br />
        - Solapi (알림 메시지 발송)</P>

        <H>6. 정보주체의 권리</H>
        <P>이용자는 언제든지 본인의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있습니다. 마이페이지에서 직접 수정하거나, 고객센터 이메일로 요청 가능합니다.</P>

        <H>7. 개인정보의 파기</H>
        <P>보유기간 경과 또는 처리 목적 달성 시 지체 없이 파기합니다. 전자적 파일은 복구 불가능한 방법으로, 출력물은 분쇄·소각합니다.</P>

        <H>8. 안전성 확보 조치</H>
        <P>개인정보 암호화(전송·저장), 접근 권한 관리, 접속기록 보관, 백신 및 보안 프로그램 설치 등 기술적·관리적 조치를 시행합니다.</P>

        <H>9. 개인정보보호 책임자</H>
        <P>책임자: {BUSINESS.ceo}<br />
        연락처: {BUSINESS.phone} / {BUSINESS.email}</P>

        <H>10. 방침 변경</H>
        <P>본 방침이 변경되는 경우 시행일 7일 전부터 공지합니다.</P>
      </>
    ),
  },

  refund: {
    title: '환불·교환 정책',
    content: () => (
      <>
        <H>1. 청약철회(환불) 가능 기간</H>
        <P>상품 수령일로부터 <b>7일 이내</b> (「전자상거래 등에서의 소비자보호에 관한 법률」 제17조).</P>

        <H>2. 환불 불가 사유</H>
        <P>- 구매자 책임 사유로 상품이 멸실·훼손된 경우<br />
        - 사용 또는 일부 소비로 상품 가치가 감소한 경우<br />
        - 시간 경과로 재판매가 곤란할 정도로 가치가 현저히 감소한 경우<br />
        - 복제 가능한 상품의 포장이 훼손된 경우<br />
        - 주문 제작·맞춤형 상품 (청약철회 불가 사전 고지 시)</P>

        <H>3. 환불 절차</H>
        <P>① 마이페이지 또는 고객센터({BUSINESS.phone})로 환불 신청<br />
        ② 상품 반송 (반송비는 귀책 사유에 따라 부담 주체 결정)<br />
        ③ 반송 상품 검수 후 환불 처리 (카드결제: 승인 취소 3~7영업일 / 계좌이체: 환불 계좌로 입금)</P>

        <H>4. 교환</H>
        <P>① 상품 하자, 오배송의 경우: 회사 비용 부담으로 즉시 교환<br />
        ② 단순 변심: 구매자가 왕복 배송비 부담하여 교환 가능 (동일 상품 옵션 한정)</P>

        <H>5. 배송비 부담</H>
        <P>- 상품 하자, 오배송: 회사 부담<br />
        - 단순 변심: 구매자 부담 (왕복 배송비)</P>

        <H>6. 환불 제한</H>
        <P>상품 발송 전 결제 취소는 즉시 처리됩니다. 발송 후에는 반송 및 검수 절차가 필요합니다.</P>

        <P style={{ color: '#6B7280', marginTop: 24, fontSize: '0.75rem' }}>
          문의: {BUSINESS.email} · {BUSINESS.phone}
        </P>
      </>
    ),
  },
};

function H({ children }) {
  return <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: 20, marginBottom: 8 }}>{children}</h3>;
}
function P({ children, style }) {
  return <p style={{ fontSize: '0.8125rem', lineHeight: 1.7, color: 'var(--color-gray-700)', whiteSpace: 'pre-wrap', ...style }}>{children}</p>;
}
function Table({ rows }) {
  return (
    <div style={{ border: '1px solid var(--color-gray-200)', borderRadius: 10, overflow: 'hidden' }}>
      {rows.map(([k, v], i) => (
        <div key={i} style={{
          display: 'flex',
          borderBottom: i < rows.length - 1 ? '1px solid var(--color-gray-100)' : 'none',
          fontSize: '0.8125rem',
        }}>
          <div style={{
            flex: '0 0 130px', padding: '10px 14px',
            background: 'var(--color-gray-50)', color: 'var(--color-gray-700)', fontWeight: 600,
          }}>{k}</div>
          <div style={{ flex: 1, padding: '10px 14px', color: 'var(--color-gray-900)' }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export default function Legal() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const section = SECTIONS[slug];

  if (!section) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-gray-500)' }}>
        페이지를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', height: 56, background: 'white',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        <button onClick={() => navigate(-1)} style={{ fontSize: '1.25rem', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center' }}>
          &#8592;
        </button>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{section.title}</h1>
      </header>
      <div style={{ padding: '20px 16px 60px', maxWidth: 700, margin: '0 auto' }}>
        {section.content()}
      </div>
    </div>
  );
}
