export default function LiveBanner() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FF8C00, #FF6B00)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: 10,
        fontSize: '0.875rem',
        fontWeight: 600,
        lineHeight: 1.5,
      }}
    >
      <span style={{ marginRight: 6 }}>&#128225;</span>
      밴드 라이브 중 · sellerpick.kr/샤방이 채팅에 고정하세요
    </div>
  );
}
