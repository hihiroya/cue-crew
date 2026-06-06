import titlePosterImage from '../../assets/title/title-poster.webp';
import { Icon } from '../../components/ui/Icon';
import { appCopy } from '../../content/ja/appCopy';
import type { TitleView } from './titleViewState';
import styles from './TitleScreenViews.module.css';

export function TitleHero() {
  return (
    <section className={styles.hero}>
      <div className="title-ghost-stage" aria-hidden="true">
        <img src={titlePosterImage} alt="" draggable={false} />
      </div>
      <div className="stage-mark"><Icon name="spark" /></div>
      <div className="title-lockup">
        <p className="title-series">{appCopy.title.series}</p>
        <h1 className="title-logo" aria-label={appCopy.title.logoLabel}>
          <span>{appCopy.title.logoFirst}</span>
          <span className="title-cross" aria-hidden="true" />
          <span>{appCopy.title.logoSecond}</span>
        </h1>
        <p className="title-copy">{appCopy.title.catchphrase}</p>
      </div>
    </section>
  );
}

export function TitleNav({ activeView, onSelect }: { activeView: TitleView; onSelect: (view: TitleView) => void }) {
  const items: Array<{ view: TitleView; label: string }> = [
    { view: 'home', label: appCopy.title.nav.home },
    { view: 'records', label: appCopy.title.nav.records },
    { view: 'collection', label: appCopy.title.nav.collection },
    { view: 'howTo', label: appCopy.title.nav.howTo },
  ];
  return (
    <nav className={styles.nav} aria-label={appCopy.title.logoLabel}>
      {items.map((item) => (
        <button key={item.view} type="button" className={activeView === item.view ? 'is-active' : ''} onClick={() => onSelect(item.view)}>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
