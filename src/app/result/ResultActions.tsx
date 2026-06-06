import type { DailyRun } from '../../game/rogueliteProgress';
import { appCopy } from '../../content/ja/appCopy';
import styles from './ResultScreenSections.module.css';

export function ResultActions({
  dailyRun,
  onReplayDaily,
  onReplayNew,
  onReplaySame,
  onTitle,
}: {
  dailyRun: DailyRun;
  onReplayDaily: (seed: string) => void;
  onReplayNew: () => void;
  onReplaySame: () => void;
  onTitle: () => void;
}) {
  return (
    <div className={styles.actions}>
      <button className="primary-action" onClick={onReplayNew}>{appCopy.result.replayNew}</button>
      <button className="secondary-action" onClick={onReplaySame}>{appCopy.result.replaySame}</button>
      <button className="secondary-action" onClick={() => onReplayDaily(dailyRun.seed)} title={`${dailyRun.title}: ${dailyRun.modifier}`}>{dailyRun.title}</button>
      <button className="ghost-button" onClick={onTitle}>{appCopy.result.title}</button>
    </div>
  );
}
