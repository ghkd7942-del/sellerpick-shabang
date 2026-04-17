// CSV 유틸 — 택배사 엑셀 업로드 호환 (UTF-8 BOM + \r\n)

// RFC 4180 파서 — 쌍따옴표, 이스케이프, CRLF/LF 모두 처리
export function parseCsv(text) {
  // BOM 제거
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cell += ch; i++;
    } else {
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { row.push(cell); cell = ''; i++; continue; }
      if (ch === '\n' || ch === '\r') {
        row.push(cell); rows.push(row); row = []; cell = '';
        if (ch === '\r' && text[i + 1] === '\n') i += 2; else i++;
        continue;
      }
      cell += ch; i++;
    }
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }

  // 빈 행 제거
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

// 헤더 행 + 데이터 행 → 객체 배열로 (헤더 이름은 소문자/공백제거해서 정규화된 키 생성)
export function csvToObjects(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { headers: [], data: [] };
  const headers = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
    return obj;
  });
  return { headers, data };
}

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(rows, headers) {
  const headerRow = headers.map((h) => escapeCell(h.label)).join(',');
  const bodyRows = rows.map((row) =>
    headers.map((h) => escapeCell(typeof h.value === 'function' ? h.value(row) : row[h.value])).join(',')
  );
  return [headerRow, ...bodyRows].join('\r\n');
}

export function downloadCsv(filename, csv) {
  // UTF-8 BOM — 엑셀에서 한글 깨짐 방지
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

// 택배사 엑셀 업로드용 표준 컬럼 (대부분 택배사 공통)
export const ORDER_CSV_HEADERS = [
  { label: '주문번호', value: 'id' },
  { label: '받는분', value: 'buyerName' },
  { label: '연락처', value: 'phone' },
  { label: '우편번호', value: () => '' }, // 별도 필드 없음 — 빈값
  { label: '주소', value: 'address' },
  { label: '상품명', value: (o) => `${o.productName || ''}${o.option ? ` (${o.option})` : ''}` },
  { label: '수량', value: (o) => o.qty || 1 },
  { label: '금액', value: (o) => o.price || 0 },
  { label: '상태', value: (o) => ({ new: '신규', paid: '입금완료', shipping: '배송중', done: '완료' }[o.status] || o.status) },
  { label: '주문일시', value: (o) => {
    const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }},
];
