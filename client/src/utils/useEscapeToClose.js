import { useEffect } from 'react';

export function useEscapeToClose(onClose, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, active]);
}
