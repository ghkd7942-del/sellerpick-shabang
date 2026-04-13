import { useEffect, useRef, useState } from 'react';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  const sheetRef = useRef(null);
  const dragRef = useRef({ startY: 0, currentY: 0, isDragging: false });
  const [translateY, setTranslateY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTranslateY(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleDragStart = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startY: y, currentY: y, isDragging: true };
  };

  const handleDragMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const diff = y - dragRef.current.startY;
    if (diff > 0) setTranslateY(diff);
  };

  const handleDragEnd = () => {
    dragRef.current.isDragging = false;
    if (translateY > 150) {
      closeSheet();
    } else {
      setTranslateY(0);
    }
  };

  const closeSheet = () => {
    setTranslateY(window.innerHeight);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 250);
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        onClick={closeSheet}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 200,
          opacity: isOpen && translateY < 150 ? 1 : 0,
          transition: 'opacity 0.25s',
        }}
      />
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 430,
          margin: '0 auto',
          background: 'white',
          borderRadius: '16px 16px 0 0',
          zIndex: 201,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          transform: `translateY(${isOpen ? translateY : '100%'}px)`,
          transition: dragRef.current.isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <div
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          style={{
            padding: '12px 16px 8px',
            cursor: 'grab',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: 'var(--color-gray-200)',
            margin: '0 auto 12px',
          }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, textAlign: 'center' }}>
            {title}
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </>
  );
}
