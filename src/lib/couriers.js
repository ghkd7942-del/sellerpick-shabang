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

export function getTrackingUrl(code, number) {
  const c = getCourier(code);
  if (!c || !number) return null;
  return c.url(number);
}
