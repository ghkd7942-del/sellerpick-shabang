import { useState, useRef, useEffect, useCallback } from 'react';

const ACTIONS_WIDTH = 160; // 수정+삭제 버튼 너비 합계

export default function SwipeableItem({ children, onEdit, onDelete }) {
  const [offset, setOffset] = useState(0);
  const [opened, setOpened] = useState(false);
  const [animating, setAnimating] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const moved = useRef(false);
  const containerRef = useRef(null);

  const handleStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startX.current = clientX;
    currentX.current = opened ? -ACTIONS_WIDTH : 0;
    isDragging.current = true;
    moved.current = false;
    setAnimating(false);
  };

  const handleMove = (e) => {
    if (!isDragging.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX.current;
    if (Math.abs(deltaX) > 3) moved.current = true;
    const newOffset = Math.max(-ACTIONS_WIDTH, Math.min(0, currentX.current + deltaX));
    setOffset(newOffset);
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setAnimating(true);

    // 50% 이상 스와이프되면 열기
    if (offset < -ACTIONS_WIDTH / 2) {
      setOffset(-ACTIONS_WIDTH);
      setOpened(true);
    } else {
      setOffset(0);
      setOpened(false);
    }
  };

  const close = useCallback(() => {
    setAnimating(true);
    setOffset(0);
    setOpened(false);
  }, []);

  // 외부 탭 시 닫기
  useEffect(() => {
    if (!opened) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [opened, close]);

  // 버튼 클릭: 이벤트 전파 차단 → close는 액션 완료 후
  const handleAction = (action) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    // 액션을 먼저 실행 (confirm 등이 close의 setState 재렌더에 간섭 안하도록 분리)
    Promise.resolve().then(() => {
      action?.();
      close();
    });
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* 뒤에 숨겨진 액션 버튼들 */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        display: 'flex', width: ACTIONS_WIDTH, zIndex: 0,
      }}>
        {onEdit && (
          <button
            type="button"
            onClick={handleAction(onEdit)}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{
              flex: 1, background: 'var(--color-teal)', color: 'white',
              border: 'none', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              touchAction: 'manipulation',
            }}
          >
            수정
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={handleAction(onDelete)}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{
              flex: 1, background: '#EF4444', color: 'white',
              border: 'none', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              touchAction: 'manipulation',
            }}
          >
            삭제
          </button>
        )}
      </div>

      {/* 드래그되는 콘텐츠 */}
      <div
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onClickCapture={(e) => {
          // 드래그 중에 발생한 click은 무시
          if (moved.current) {
            e.stopPropagation();
            e.preventDefault();
            moved.current = false;
          }
        }}
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? 'transform 0.2s ease-out' : 'none',
          background: 'white',
          position: 'relative',
          zIndex: 1,
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
}
