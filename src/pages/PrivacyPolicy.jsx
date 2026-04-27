export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px", fontFamily: "sans-serif", fontSize: 14, lineHeight: 1.8, color: "#333" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>개인정보처리방침</h1>
      <p style={{ color: "#888", marginBottom: 32 }}>시행일: 2026년 04월 20일</p>
      <p>온빛(이하 "회사")이 운영하는 셀러픽(SellerPick) 서비스(이하 "서비스")는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 및 관련 법령을 준수합니다.</p>
      <Section title="1. 수집하는 개인정보 항목 및 수집 목적">
        <Table
          headers={["구분", "수집 항목", "수집 목적", "보유 기간"]}
          rows={[
            ["필수", "카카오계정(전화번호)", "주문 확인 및 배송 현황 안내 SMS 발송, 본인 확인", "회원 탈퇴 후 30일"],
            ["선택", "배송지정보\n(수령인명, 배송지 주소, 전화번호)", "상품 배송 처리 및 배송 안내", "주문 완료 후 5년\n(전자상거래법)"],
            ["필수", "서비스 이용 기록, 접속 로그", "서비스 운영 및 부정 이용 방지", "1년"],
          ]}
        />
        <p style={{ marginTop: 12 }}>* 배송지 정보는 이용자가 주문 시 직접 입력하며, 카카오 로그인 동의를 통해 카카오계정에 등록된 배송지를 불러올 수 있습니다.</p>
      </Section>
      <Section title="2. 개인정보 수집 방법">
        <ul>
          <li>카카오 로그인 동의 화면을 통한 수집</li>
          <li>주문서 작성 시 이용자 직접 입력</li>
          <li>서비스 이용 과정에서 자동 수집 (접속 로그 등)</li>
        </ul>
      </Section>
      <Section title="3. 개인정보의 제3자 제공">
        <p>회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 단, 상품 배송을 위해 배송업체에 수령인명, 배송지 주소, 연락처를 제공할 수 있으며, 이 경우 이용자에게 사전 고지합니다.</p>
      </Section>
      <Section title="4. 개인정보 처리 위탁">
        <Table
          headers={["수탁 업체", "위탁 업무"]}
          rows={[
            ["카카오(Kakao Corp.)", "카카오 로그인, 알림톡 발송"],
            ["토스페이먼츠", "결제 처리"],
            ["Google Firebase", "서비스 인프라 운영"],
          ]}
        />
      </Section>
      <Section title="5. 개인정보 보유 및 이용 기간">
        <ul>
          <li>계약 또는 청약 철회에 관한 기록: 5년 (전자상거래법)</li>
          <li>대금 결제 및 재화 공급에 관한 기록: 5년 (전자상거래법)</li>
          <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)</li>
        </ul>
      </Section>
      <Section title="6. 이용자 권리 및 행사 방법">
        <p>이용자는 언제든지 수집된 개인정보의 조회, 수정, 삭제, 처리 정지를 요청할 수 있습니다. 요청은 고객센터를 통해 접수하며, 지체 없이 처리합니다.</p>
      </Section>
      <Section title="7. 개인정보 파기 절차 및 방법">
        <p>전자 파일 형태의 정보는 복구 불가능한 방법으로 영구 삭제하며, 출력물 등은 분쇄하거나 소각하여 파기합니다.</p>
      </Section>
      <Section title="8. 개인정보 보호책임자">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            {[["업체명","온빛"],["대표자","황유진"],["사업자등록번호","882-39-01416"],["주소","경기도 양주시 덕정11길 29, 2동 202호"],["전화","010-8555-6595"],["이메일","ghkd7942@gmail.com"]].map(([k,v])=>(
              <tr key={k}>
                <td style={{ padding:"6px 12px", border:"1px solid #eee", background:"#f9f9f9", fontWeight:600, whiteSpace:"nowrap" }}>{k}</td>
                <td style={{ padding:"6px 12px", border:"1px solid #eee" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="9. 개인정보처리방침 변경">
        <p>본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 내 공지사항을 통해 사전 안내합니다.</p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, borderBottom: "1px solid #eee", paddingBottom: 6 }}>{title}</h2>
      {children}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        <thead>
          <tr>{headers.map(h=><th key={h} style={{ padding:"8px 12px", border:"1px solid #ddd", background:"#f5f5f5", fontWeight:600, textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j} style={{ padding:"8px 12px", border:"1px solid #ddd", verticalAlign:"top", whiteSpace:"pre-line" }}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
