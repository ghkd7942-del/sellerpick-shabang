import { useState, useRef, useEffect } from 'react';

const ACTIONS_WIDTH = 160; // 수정+삭제 버튼 너비 합계

export default function SwipeableItem({ children, onEdit, onDelete }) {
  const [offset, setOffset] = useState(0);
  const [opened, setOpened] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const transitioning = useRef(false);

  const handleStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startX.current = clientX;
    currentX.current = opened ? -ACTIONS_WIDTH : 0;
    isDragging.current = true;
    transitioning.current = false;
  };

  const handleMove = (e) => {
    if (!isDragging.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX.current;
    const newOffset = Math.max(-ACTIONS_WIDTH, Math.min(0, currentX.current + deltaX));
    setOffset(newOffset);
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    transitioning.current = true;

    // 50% 이상 스와이프되면 열기
    if (offset < -ACTIONS_WIDTH / 2) {
      setOffset(-ACTIONS_WIDTH);
      setOpened(true);
    } else {
      setOffset(0);
      setOpened(false);
    }
  };

  // 외부 탭 시 닫기
  const containerRef = useRef(null);
  useEffect(() => {
    if (!opened) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOffset(0);
        setOpened(false);
      }
    };
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [opened]);

  const close = () => {
    setOffset(0);
    setOpened(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* 뒤에 숨겨진 액션 버튼들 */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        display: 'flex', width: ACTIONS_WIDTH,
      }}>
        {onEdit && (
          <button
            onClick={() => { close(); onEdit(); }}
            style={{
              flex: 1, background: 'var(--color-teal)', color: 'white',
              border: 'none', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            수정
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => { close(); onDelete(); }}
            style={{
              flex: 1, background: '#EF4444', color: 'white',
              border: 'none', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        onMouseMove={isDragging.current ? handleMove : undefined}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: transitioning.current ? 'transform 0.2s ease-out' : 'none',
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
