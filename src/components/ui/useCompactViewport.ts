import { useEffect, useState } from 'react';

export function useCompactViewport(query = '(max-width: 679px)') {
  const [matches, setMatches] = useState(() => viewportMatches(query));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia(query);
    const onChange = () => setMatches(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener?.('change', onChange);
    return () => mediaQuery.removeEventListener?.('change', onChange);
  }, [query]);

  return matches;
}

function viewportMatches(query: string) {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}
