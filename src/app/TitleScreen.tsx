import { useState } from 'react';
import titlePosterImage from '../assets/title/title-poster.webp';
import type { PerformanceResult } from '../game/types';
import { Icon } from '../components/ui/Icon';

type Props = {
  history: PerformanceResult[];
  onStart: () => void;
  onReplay: (seed: string) => void;
};

export function TitleScreen({ history, onStart, onReplay }: Props) {
  const [showHowTo, setShowHowTo] = useState(false);
  return (
    <main className="title-screen">
      <section className="title-panel">
        <div className="title-ghost-stage" aria-hidden="true">
          <img src={titlePosterImage} alt="" draggable={false} />
        </div>
        <div className="stage-mark"><Icon name="spark" /></div>
        <div className="title-lockup">
          <p className="title-series">1人用舞台裏マネジメント</p>
          <h1 className="title-logo" aria-label="本番中 x 舞台裏">
            <span>本番中</span>
            <span className="title-cross" aria-hidden="true" />
            <span>舞台裏</span>
          </h1>
          <p className="title-copy">兆候を読み 予定外を名場面へ</p>
          <div className="title-actions">
            <button className="primary-action" onClick={onStart}>はじめる</button>
            <button className="secondary-action" onClick={() => setShowHowTo((value) => !value)}>遊び方</button>
          </div>
        </div>
        {showHowTo ? (
          <div className="howto-panel">
            <p>全6公演。マチネは次のソワレへ向けた調整、ソワレはその日の評判と公演全体への影響が大きい。</p>
            <p>1日目ソワレ後に公演の色が決まり、2日目以降の拾う・待つ・整える・切るの意味が少し変わる。</p>
          </div>
        ) : null}
      </section>
      <section className="history-panel">
        <div className="section-heading">
          <p><Icon name="history" /> 履歴</p>
          <h2>最近の公演</h2>
        </div>
        {history.length === 0 ? (
          <p className="muted">まだ記録はない。初日のマチネを開けよう。</p>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <button key={`${item.seed}-${item.finishedAt}`} onClick={() => onReplay(item.seed)}>
                <strong>{item.title}</strong>
                <span>評判 {item.sceneScore} / 段取り {item.flowScore} / 座組信頼 {item.trustScore}</span>
                <small>同じ公演をやり直す</small>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
