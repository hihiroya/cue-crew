import { Icon } from '../../components/ui/Icon';
import { appCopy } from '../../content/ja/appCopy';
import styles from './TitleScreenViews.module.css';

export function HowToView({ onStart }: { onStart: () => void }) {
  return (
    <section className={styles.howToPage}>
      <div className="section-heading">
        <p><Icon name="spark" /> {appCopy.title.howTo}</p>
        <h2>{appCopy.title.catchphrase}</h2>
      </div>
      <div className="howto-panel">
        <div className="howto-step-grid">
          {appCopy.title.howToSteps.map((step, index) => (
            <article key={step.title}>
              <span>{index + 1}</span>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
        {appCopy.title.howToLines.map((line) => <p key={line}>{line}</p>)}
      </div>
      <button type="button" className="primary-action" onClick={onStart}>{appCopy.title.start}</button>
    </section>
  );
}
