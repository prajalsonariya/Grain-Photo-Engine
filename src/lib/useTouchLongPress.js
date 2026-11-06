'use client';

import { useRef, useCallback } from 'react';

/**
 * High-performance mobile touch long-press hook (500ms delay)
 * Used to trigger multi-select mode in photo albums.
 */
export function useTouchLongPress(onLongPress, onClick, ms = 500) {
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const start = useCallback((e) => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (onLongPress) onLongPress(e);
    }, ms);
  }, [onLongPress, ms]);

  const stop = useCallback((e) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClick = useCallback((e) => {
    if (!isLongPressRef.current && onClick) {
      onClick(e);
    }
  }, [onClick]);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onClick: handleClick
  };
}
