export const COURIERS = [
  { code: 'cj', name: 'CJ대한통운', url: (n) => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${n}` },
  { code: 'lotte', name: '롯데택배', url: (n) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${n}` },
  { code: 'hanjin', name: '한진택배', url: (n) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${n}` },
  { code: 'logen', name: '로젠택배', url: (n) => `https://www.ilogen.com/m/personal/trace/${n}` },
  { code: 'epost', name: '우체국', url: (n) => `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${n}` },
  { code: 'kdexp', name: '경동택배', url: (n) => `https://kdexp.com/service/delivery/etc/waybill_result.jsp?bill_no=${n}` },
  { code: 'etc', name: '기타', url: (n) => `https://search.naver.com/search.naver?query=${n}+택배조회` },
];

export function getCourier(code) {
  return COURIERS.find((c) => c.code === code);
}

// 이름/코드/별칭으로 택배사 찾기 — CSV 임포트용
const COURIER_ALIASES = {
  cj: ['cj', 'cj대한통운', '대한통운', 'cj logistics', 'cjlogistics'],
  lotte: ['lotte', '롯데', '롯데택배', '롯데글로벌로지스'],
  hanjin: ['hanjin', '한진', '한진택배'],
  logen: ['logen', '로젠', '로젠택배', 'ilogen'],
  epost: ['epost', '우체국', '우체국택배', 'post'],
  kdexp: ['kdexp', '경동', '경동택배'],
};

export function findCourierCode(input) {
  if (!input) return '';
  const s = String(input).toLowerCase().replace(/\s+/g, '');
  for (const [code, aliases] of Object.entries(COURIER_ALIASES)) {
    if (aliases.some((a) => s.includes(a.toLowerCase().replace(/\s+/g, '')))) return code;
  }
  return 'etc';
}

export function getTrackingUrl(code, number) {
  const c = getCourier(code);
  if (!c || !number) return null;
  return c.url(number);
}
