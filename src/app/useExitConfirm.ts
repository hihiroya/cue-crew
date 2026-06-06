import { useEffect, useState } from 'react';

export function useExitConfirm() {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (!showExitConfirm) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowExitConfirm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showExitConfirm]);

  return {
    showExitConfirm,
    openExitConfirm: () => setShowExitConfirm(true),
    closeExitConfirm: () => setShowExitConfirm(false),
  };
}
