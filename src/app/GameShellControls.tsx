import type { GameStatus } from '../game/types';
import { appCopy } from '../content/ja/appCopy';
import styles from './GameShellControls.module.css';

export function PhaseStrip({ status }: { status: GameStatus }) {
  return (
    <div className={styles.phaseStrip}>
      <span className={phaseStepClass(status, 'prep')}><i aria-hidden="true" />{appCopy.phase.prep}</span>
      <span className={phaseStepClass(status, 'response')}><i aria-hidden="true" />{appCopy.phase.response}</span>
      <span className={phaseStepClass(status, 'result')}><i aria-hidden="true" />{appCopy.phase.result}</span>
    </div>
  );
}

export function GameExitControl({ disabled, onRequestExit }: { disabled: boolean; onRequestExit: () => void }) {
  return (
    <div className={styles.exitControl}>
      <button type="button" disabled={disabled} onClick={onRequestExit}>{appCopy.exit.action}</button>
    </div>
  );
}

export function ExitConfirmDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className={styles.dialogBackdrop} role="presentation" onClick={onCancel}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <p>{appCopy.exit.kicker}</p>
          <h2 id="exit-dialog-title">{appCopy.exit.title}</h2>
          <span>{appCopy.exit.body}</span>
        </div>
        <div className={styles.dialogActions}>
          <button type="button" className="primary-action" onClick={onCancel}>{appCopy.exit.cancel}</button>
          <button type="button" className="danger-outline-action" onClick={onConfirm}>{appCopy.exit.confirm}</button>
        </div>
      </section>
    </div>
  );
}

function phaseStepClass(status: GameStatus, step: 'prep' | 'response' | 'result') {
  const order = { prep: 0, response: 1, result: 2 };
  if (status === step) return styles.active;
  if (status in order && order[status as keyof typeof order] > order[step]) return styles.done;
  return '';
}
