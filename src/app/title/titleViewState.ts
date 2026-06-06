export type TitleView = 'home' | 'records' | 'collection' | 'howTo';

export function initialTitleView(): TitleView {
  const search = new URLSearchParams(globalThis.location?.search ?? '');
  const requested = search.get('view');
  if (requested === 'records' || requested === 'collection' || requested === 'howTo') return requested;
  if (search.get('uiScenario') === 'title-collection') return 'collection';
  return 'home';
}

export function updateTitleViewParam(view: TitleView) {
  if (!globalThis.location || !globalThis.history) return;
  const url = new URL(globalThis.location.href);
  if (view === 'home') {
    url.searchParams.delete('view');
  } else {
    url.searchParams.set('view', view);
  }
  globalThis.history.replaceState(null, '', url);
}
