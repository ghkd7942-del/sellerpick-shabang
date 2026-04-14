export default function LivePlayer({ youtubeVideoId, isActive, bandUrl }) {
  // 라이브 방송 중 + 유튜브 ID 있으면 임베드
  if (isActive && youtubeVideoId) {
    return (
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        background: '#000',
      }}>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&playsinline=1`}
            title="라이브 방송"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%', border: 'none',
            }}
          />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: '#1a1a1a',
        }}>
          <span className="live-dot" style={{ background: '#FF4B6E' }} />
          <span style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 700 }}>라이브 방송 중</span>
        </div>
      </div>
    );
  }

  // 방송 전 또는 유튜브 미설정 → 밴드 링크 / 대기 화면
  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      padding: '28px 20px', textAlign: 'center',
    }}>
      {isActive ? (
        <>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>&#128308;</div>
          <div style={{ color: 'white', fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>
            라이브 방송 중!
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', marginBottom: 16 }}>
            영상은 곧 준비됩니다
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>&#128250;</div>
          <div style={{ color: 'white', fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>
            방송 준비 중
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', marginBottom: 16 }}>
            곧 라이브가 시작됩니다
          </div>
        </>
      )}

      {bandUrl && (
        <a
          href={bandUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#00C73C', color: 'white',
            padding: '12px 20px', borderRadius: 10,
            fontSize: '0.875rem', fontWeight: 700, minHeight: 44,
            textDecoration: 'none',
          }}
        >
          &#128279; 밴드에서 라이브 보기
        </a>
      )}
    </div>
  );
}
