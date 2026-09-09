import { useEffect } from 'react';

export function useEscapeKey(onEscape?: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive || !onEscape) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onEscape();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, isActive]);
}
