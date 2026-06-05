import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }),
);

const stableMode = args.get('stable') === 'true';
const samples = Number(args.get('samples') ?? (stableMode ? 256 : 48));
const failOnWarn = args.get('fail-on-warn') === 'true';
const jsonRequested = args.get('json') === 'true' || args.has('out');
const jsonOut = args.get('out') && args.get('out') !== 'true'
  ? String(args.get('out'))
  : 'tmp/balance-report.json';
const comparePath = args.get('compare') && args.get('compare') !== 'true'
  ? String(args.get('compare'))
  : null;
const outDir = resolve('tmp/balance-build');
const prepActions = ['watch', 'makeSpace', 'tightenFlow', 'prepareTransition'];
const responses = ['catch', 'arrange', 'wait', 'cut'];
const fixedPlans = {
  catch: { prep: 'watch', response: 'catch' },
  wait: { prep: 'makeSpace', response: 'wait' },
  arrange: { prep: 'tightenFlow', response: 'arrange' },
  cut: { prep: 'prepareTransition', response: 'cut' },
};
const prepForResponse = {
  catch: 'watch',
  wait: 'makeSpace',
  arrange: 'tightenFlow',
  cut: 'prepareTransition',
};
const BALANCE_TARGETS = {
  avgScore: {
    random: [16, 28],
    catch: [14, 32],
    wait: [20, 38],
    arrange: [24, 36],
    cut: [12, 28],
    cycle: [22, 42],
    lowLoad: [38, 50],
    omen: [48, 60],
    expectedScore: [52, 64],
    oracle: [66, 80],
  },
  avgLoad: {
    catch: [2.5, 4.5],
    wait: [0.8, 2.0],
    arrange: [0, 1.0],
    cut: [0, 1.5],
    cycle: [0.4, 2.2],
    omen: [0.5, 2.0],
    expectedScore: [1.0, 2.5],
    oracle: [0, 1.0],
  },
  relative: {
    minOmenCycleGap: 8,
    expectedOmenGap: [0, 10],
    oracleExpectedGap: [5, 20],
    waitArrangeGap: [-8, 8],
    minCatchUpside: 18,
    cycleMedianSPlusCap: 52,
    waitSafetyLoad: 0.8,
    waitSafetyScore: 34,
    minCatchP90: 40,
    maxOmenSceneOrBetterPerRun: 5.9,
    minCycleFrayOrAccidentRate: 18,
    minOmenFrayOrAccidentRate: 6,
  },
};

await main();

async function main() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await run('npx', ['tsc', '-p', 'tsconfig.test.json', '--outDir', outDir]);
  await run('node', ['scripts/fix-test-imports.mjs', outDir]);

  const game = await import(pathToFileURL(join(outDir, 'src/game/gameReducer.js')).href);
  const constants = await import(pathToFileURL(join(outDir, 'src/game/constants.js')).href);
  const actorLogic = await import(pathToFileURL(join(outDir, 'src/game/actorLogic.js')).href);
  const rng = await import(pathToFileURL(join(outDir, 'src/game/rng.js')).href);
  const resultPreview = await import(pathToFileURL(join(outDir, 'src/game/resultPreview.js')).href);
  const fray = await import(pathToFileURL(join(outDir, 'src/game/fray.js')).href);

  const context = {
    ...game,
    ...constants,
    ...actorLogic,
    ...rng,
    ...resultPreview,
    ...fray,
  };

  const strategies = [
    { id: 'catch', kind: 'fixed' },
    { id: 'wait', kind: 'fixed' },
    { id: 'arrange', kind: 'fixed' },
    { id: 'cut', kind: 'fixed' },
    { id: 'cycle', kind: 'cycle' },
    { id: 'random', kind: 'random' },
    { id: 'omen', kind: 'omen' },
    { id: 'expectedScore', kind: 'expectedScore' },
    { id: 'lowLoad', kind: 'lowLoad' },
    { id: 'styleCommit', kind: 'styleCommit' },
    { id: 'oracle', kind: 'oracle' },
  ];

  const reports = strategies.map((strategy) => runStrategy(strategy, samples, context));
  const oracle = reports.find((report) => report.id === 'oracle');
  const checks = balanceChecks(reports);
  const comparison = comparePath ? await loadComparison(comparePath, reports) : null;

  console.log(`Balance report (${samples} seeds x ${strategies.length} strategies)`);
  reports.forEach((report) => printReport(report, context, oracle));
  printRanking(reports, oracle);
  printChecks(checks);
  if (comparison) printComparison(comparison);

  if (jsonRequested) {
    await writeJsonReport(jsonOut, { samples, targets: BALANCE_TARGETS, reports, checks, comparison });
  }

  if (failOnWarn && checks.some((check) => check.status === 'WARN')) {
    process.exitCode = 1;
  }
}

function runStrategy(strategy, count, context) {
  const totals = {
    scores: [],
    loads: [],
    prepHits: 0,
    turns: 0,
    tiers: {},
    styles: {},
    events: {},
    responses: {},
    loadDistribution: {},
    turnsByNumber: {},
    choiceReasons: {},
  };

  for (let index = 0; index < count; index += 1) {
    const seed = `balance-${strategy.id}-${index}`;
    let state = context.gameReducer(context.titleState, { type: 'START', seed });
    const choices = [];
    for (let turn = 0; turn < 6; turn += 1) {
      const choice = chooseForStrategy(strategy, state, turn, index, context);
      choices.push(choice);
      state = context.gameReducer(state, { type: 'SELECT_PREP', prep: choice.prep });
      state = context.gameReducer(state, { type: 'SELECT_RESPONSE', response: choice.response });
      state = context.gameReducer(state, { type: 'COMMIT_RESULT' });
    }

    const result = context.finishPerformance(state);
    totals.scores.push(result.insight.totalScore);
    totals.loads.push(result.backstageLoad);
    increment(totals.loadDistribution, result.backstageLoad);
    result.logs.forEach((log, logIndex) => {
      totals.turns += 1;
      if (log.prepMatched) totals.prepHits += 1;
      increment(totals.tiers, log.resultTier);
      increment(totals.events, log.actorEventType);
      increment(totals.responses, log.mainResponse);
      increment(totals.choiceReasons, choices[logIndex]?.reason ?? strategy.kind);
      incrementTurn(totals.turnsByNumber, log);
    });
    increment(totals.styles, result.performanceStyle ?? 'unset');
  }

  return {
    id: strategy.id,
    avgScore: average(totals.scores),
    p10: percentile(totals.scores, 0.1),
    p50: percentile(totals.scores, 0.5),
    p90: percentile(totals.scores, 0.9),
    best: Math.max(...totals.scores),
    worst: Math.min(...totals.scores),
    avgLoad: average(totals.loads),
    prepHitRate: totals.turns ? (totals.prepHits / totals.turns) * 100 : 0,
    masterpiecePerRun: (totals.tiers.masterpiece ?? 0) / count,
    sceneOrBetterPerRun: ((totals.tiers.masterpiece ?? 0) + (totals.tiers.scene ?? 0)) / count,
    frayOrAccidentRate: totals.turns ? (((totals.tiers.fray ?? 0) + (totals.tiers.accident ?? 0)) / totals.turns) * 100 : 0,
    accidentRate: totals.turns ? ((totals.tiers.accident ?? 0) / totals.turns) * 100 : 0,
    ...totals,
  };
}

function chooseForStrategy(strategy, state, turn, sampleIndex, context) {
  if (strategy.kind === 'fixed') return { ...fixedPlans[strategy.id], reason: `fixed:${strategy.id}` };
  if (strategy.kind === 'cycle') {
    const choice = [
      { prep: 'watch', response: 'catch' },
      { prep: 'makeSpace', response: 'wait' },
      { prep: 'tightenFlow', response: 'arrange' },
      { prep: 'prepareTransition', response: 'cut' },
    ][turn % 4];
    return { ...choice, reason: `cycle:slot-${(turn % 4) + 1}` };
  }
  if (strategy.kind === 'random') return randomChoice(state, sampleIndex, context);
  if (strategy.kind === 'omen') return omenChoice(state, context);
  if (strategy.kind === 'expectedScore') return expectedScoreChoice(state, context);
  if (strategy.kind === 'lowLoad') return lowLoadChoice(state, context);
  if (strategy.kind === 'styleCommit') return styleCommitChoice(state, context);
  if (strategy.kind === 'oracle') return oracleChoice(state, context);
  throw new Error(`Unknown strategy: ${strategy.id}`);
}

function randomChoice(state, sampleIndex, context) {
  const random = context.createRng(`${state.seed}:balance-random:${sampleIndex}:${state.totalTurn}`);
  const prep = prepActions[Math.floor(random() * prepActions.length)];
  const response = random() < 0.7
    ? context.PREP_PRIMARY_RESPONSE[prep]
    : responses[Math.floor(random() * responses.length)];
  return {
    prep,
    response,
    reason: 'random:rng',
  };
}

function omenChoice(state, context) {
  let prep = bestPrepByVisibleOmens(state, context);
  let reason = 'omen:visible-omens+best-score';
  if (state.backstageLoad >= 3 || state.pendingFrayEvent) {
    prep = 'prepareTransition';
    reason = 'omen:high-load-or-fray';
  } else if (state.backstageLoad >= 2 && context.likelyFrayBias(state)) {
    prep = 'tightenFlow';
    reason = 'omen:likely-fray';
  }
  return {
    prep,
    response: bestResponseAfterPrep(state, prep, context, oracleComparator).response,
    reason,
  };
}

function expectedScoreChoice(state, context) {
  const prep = bestPrepByExpectedEvents(state, context);
  return {
    prep,
    response: bestResponseAfterPrep(state, prep, context, scoreComparator).response,
    reason: 'expectedScore:weighted-events+best-score',
  };
}

function lowLoadChoice(state, context) {
  let reason = 'lowLoad:weighted-events';
  let prep = bestPrepByExpectedEvents(state, context);
  if (state.backstageLoad >= 3 || state.pendingFrayEvent) {
    prep = 'prepareTransition';
    reason = 'lowLoad:high-load-or-fray';
  } else if (context.likelyFrayBias(state)) {
    prep = 'tightenFlow';
    reason = 'lowLoad:likely-fray';
  }
  return {
    prep,
    response: bestResponseAfterPrep(state, prep, context, loadComparator).response,
    reason,
  };
}

function styleCommitChoice(state, context) {
  if (!state.performanceStyle) return expectedScoreChoice(state, context);
  const response = context.PERFORMANCE_STYLE_DETAILS[state.performanceStyle].strength;
  return {
    prep: prepForResponse[response],
    response,
    reason: `styleCommit:${state.performanceStyle}`,
  };
}

function oracleChoice(state, context) {
  return { ...bestCandidate(state, context, oracleComparator), reason: 'oracle:best-realized-delta' };
}

function bestPrepByVisibleOmens(state, context) {
  const actor = currentActor(state);
  const omens = context.topOmenEvents(actor, 3, { seed: state.seed, totalTurn: state.totalTurn });
  return maxBy(prepActions, (prep) => {
    const primary = context.PREP_PRIMARY_RESPONSE[prep];
    return omens.reduce((total, omen, index) => {
      const rankWeight = 3 - index;
      const match = context.PREP_MATCHES[prep].includes(omen.event) ? 8 : 0;
      const primaryFit = context.EVENT_COMPATIBILITY[omen.event][primary] > 0 ? 2 : 0;
      return total + omen.weight + rankWeight + match + primaryFit;
    }, 0);
  });
}

function bestPrepByExpectedEvents(state, context) {
  const actor = currentActor(state);
  const weights = context.eventWeightsFor(actor, { seed: state.seed, totalTurn: state.totalTurn });
  return maxBy(prepActions, (prep) => {
    const primary = context.PREP_PRIMARY_RESPONSE[prep];
    return Object.entries(weights).reduce((total, [event, weight]) => {
      const eventCompatibility = context.EVENT_COMPATIBILITY[event];
      const bestCompatibility = Math.max(...responses.map((response) => eventCompatibility[response]));
      const prepMatch = context.PREP_MATCHES[prep].includes(event) ? 1.2 : -0.35;
      const primaryFit = eventCompatibility[primary] > 0 ? 0.45 : -0.2;
      return total + weight * (bestCompatibility + prepMatch + primaryFit);
    }, 0);
  });
}

function bestResponseAfterPrep(state, prep, context, comparator) {
  const withPrep = context.gameReducer(state, { type: 'SELECT_PREP', prep });
  const candidates = responses.map((response) => {
    const withResponse = context.gameReducer(withPrep, { type: 'SELECT_RESPONSE', response });
    return {
      prep,
      response,
      preview: context.previewResult(withResponse),
    };
  });
  return candidates.sort(comparator)[0];
}

function bestCandidate(state, context, comparator) {
  const candidates = prepActions.flatMap((prep) => {
    const withPrep = context.gameReducer(state, { type: 'SELECT_PREP', prep });
    return responses.map((response) => {
      const withResponse = context.gameReducer(withPrep, { type: 'SELECT_RESPONSE', response });
      return {
        prep,
        response,
        preview: context.previewResult(withResponse),
      };
    });
  });
  return candidates.sort(comparator)[0];
}

function scoreComparator(a, b) {
  return (
    b.preview.score - a.preview.score
    || finalDeltaValue(b.preview) - finalDeltaValue(a.preview)
    || a.preview.deltaLoad - b.preview.deltaLoad
  );
}

function loadComparator(a, b) {
  const aValue = finalDeltaValue(a.preview) - Math.max(0, a.preview.deltaLoad) * 4;
  const bValue = finalDeltaValue(b.preview) - Math.max(0, b.preview.deltaLoad) * 4;
  return (
    bValue - aValue
    || b.preview.score - a.preview.score
    || a.preview.deltaLoad - b.preview.deltaLoad
  );
}

function oracleComparator(a, b) {
  return (
    finalDeltaValue(b.preview) - finalDeltaValue(a.preview)
    || b.preview.score - a.preview.score
    || a.preview.deltaLoad - b.preview.deltaLoad
  );
}

function finalDeltaValue(preview) {
  return preview.deltaScene * 2 + preview.deltaFlow + preview.deltaTrust - preview.deltaLoad * 2;
}

function currentActor(state) {
  return state.actors.find((actor) => actor.id === state.currentFocusActorId) ?? state.actors[0];
}

function printReport(report, context, oracle) {
  const gap = oracle && report.id !== 'oracle' ? ` gapToOracle=${round(oracle.avgScore - report.avgScore)}` : '';
  console.log('');
  console.log(`[${report.id}] avgScore=${round(report.avgScore)} p10=${round(report.p10)} p50=${round(report.p50)} p90=${round(report.p90)} best=${round(report.best)} worst=${round(report.worst)}${gap}`);
  console.log(`  avgLoad=${round(report.avgLoad)} prepHit=${round(report.prepHitRate)}% masterpiece/run=${round(report.masterpiecePerRun)} scene+/run=${round(report.sceneOrBetterPerRun)} fray+accident=${round(report.frayOrAccidentRate)}% accident=${round(report.accidentRate)}%`);
  console.log(`  final load: ${formatCounts(report.loadDistribution, {}, 99)}`);
  console.log(`  tiers: ${formatCounts(report.tiers, context.RESULT_TIER_LABELS)}`);
  console.log(`  turns: ${formatTurnDistribution(report.turnsByNumber, context.RESULT_TIER_LABELS)}`);
  console.log(`  styles: ${formatCounts(report.styles, Object.fromEntries(Object.entries(context.PERFORMANCE_STYLE_DETAILS).map(([key, value]) => [key, value.label])))}`);
  console.log(`  events: ${formatCounts(report.events, context.EVENT_LABELS, 5)}`);
  console.log(`  responses: ${formatCounts(report.responses, context.RESPONSE_LABELS)}`);
  console.log(`  choice reasons: ${formatCounts(report.choiceReasons, {}, 5)}`);
}

function printRanking(reports, oracle) {
  console.log('');
  console.log('Score ranking:');
  [...reports]
    .sort((a, b) => b.avgScore - a.avgScore)
    .forEach((report, index) => {
      const gap = oracle && report.id !== 'oracle' ? `, oracle gap ${round(oracle.avgScore - report.avgScore)}` : '';
      console.log(`  ${index + 1}. ${report.id}: avg ${round(report.avgScore)}${gap}`);
    });
}

function balanceChecks(reports) {
  const byId = Object.fromEntries(reports.map((report) => [report.id, report]));
  const checks = [];
  const add = (ok, message) => checks.push({ status: ok ? 'OK' : 'WARN', message });
  const range = (id, field, min, max) => {
    const value = byId[id][field];
    add(value >= min && value <= max, `${id}.${field} ${round(value)} should be ${min}-${max}`);
  };

  Object.entries(BALANCE_TARGETS.avgScore).forEach(([id, [min, max]]) => range(id, 'avgScore', min, max));
  Object.entries(BALANCE_TARGETS.avgLoad).forEach(([id, [min, max]]) => range(id, 'avgLoad', min, max));

  const omenCycleGap = byId.omen.avgScore - byId.cycle.avgScore;
  add(omenCycleGap >= BALANCE_TARGETS.relative.minOmenCycleGap, `omen should beat cycle by at least ${BALANCE_TARGETS.relative.minOmenCycleGap} points; gap=${round(omenCycleGap)}`);

  const expectedOmenGap = byId.expectedScore.avgScore - byId.omen.avgScore;
  add(inRange(expectedOmenGap, BALANCE_TARGETS.relative.expectedOmenGap), `expectedScore should be ${rangeLabel(BALANCE_TARGETS.relative.expectedOmenGap)} above omen; gap=${round(expectedOmenGap)}`);

  const oracleExpectedGap = byId.oracle.avgScore - byId.expectedScore.avgScore;
  add(inRange(oracleExpectedGap, BALANCE_TARGETS.relative.oracleExpectedGap), `oracle should be ${rangeLabel(BALANCE_TARGETS.relative.oracleExpectedGap)} above expectedScore; gap=${round(oracleExpectedGap)}`);

  const waitArrangeGap = byId.wait.avgScore - byId.arrange.avgScore;
  add(inRange(waitArrangeGap, BALANCE_TARGETS.relative.waitArrangeGap), `wait should be within ${rangeLabel(BALANCE_TARGETS.relative.waitArrangeGap)} of arrange; gap=${round(waitArrangeGap)}`);

  const catchUpside = byId.catch.p90 - byId.catch.avgScore;
  add(catchUpside >= BALANCE_TARGETS.relative.minCatchUpside, `catch should have visible upside; p90-avg=${round(catchUpside)}`);

  add(byId.cycle.p50 < BALANCE_TARGETS.relative.cycleMedianSPlusCap, `cycle median should stay below S+ threshold ${BALANCE_TARGETS.relative.cycleMedianSPlusCap}; p50=${round(byId.cycle.p50)}`);
  add(!(byId.wait.avgLoad < BALANCE_TARGETS.relative.waitSafetyLoad && byId.wait.avgScore > BALANCE_TARGETS.relative.waitSafetyScore), `wait should not be both very safe and high scoring; avgScore=${round(byId.wait.avgScore)} avgLoad=${round(byId.wait.avgLoad)}`);
  add(byId.catch.p90 >= BALANCE_TARGETS.relative.minCatchP90, `catch p90 should reach at least ${BALANCE_TARGETS.relative.minCatchP90}; p90=${round(byId.catch.p90)}`);
  add(byId.cycle.frayOrAccidentRate >= BALANCE_TARGETS.relative.minCycleFrayOrAccidentRate, `cycle should keep visible texture; fray+accident=${round(byId.cycle.frayOrAccidentRate)}%`);
  add(byId.omen.frayOrAccidentRate >= BALANCE_TARGETS.relative.minOmenFrayOrAccidentRate, `omen should keep some visible texture; fray+accident=${round(byId.omen.frayOrAccidentRate)}%`);
  add(byId.omen.sceneOrBetterPerRun < BALANCE_TARGETS.relative.maxOmenSceneOrBetterPerRun, `omen should leave some run texture; scene+/run=${round(byId.omen.sceneOrBetterPerRun)}`);
  add(!(byId.expectedScore.accidentRate === 0 && byId.expectedScore.frayOrAccidentRate === 0), `expectedScore should not erase all fray/accident texture; fray+accident=${round(byId.expectedScore.frayOrAccidentRate)}% accident=${round(byId.expectedScore.accidentRate)}%`);

  return checks;
}

async function loadComparison(targetPath, reports) {
  const raw = await readFile(resolve(targetPath), 'utf8');
  const previous = JSON.parse(raw);
  const previousById = Object.fromEntries((previous.reports ?? []).map((report) => [report.id, report]));
  return reports
    .filter((report) => previousById[report.id])
    .map((report) => {
      const before = previousById[report.id];
      return {
        id: report.id,
        avgScore: delta(report.avgScore, before.avgScore),
        p50: delta(report.p50, before.p50),
        p90: delta(report.p90, before.p90),
        avgLoad: delta(report.avgLoad, before.avgLoad),
        prepHitRate: delta(report.prepHitRate, before.prepHitRate),
        frayOrAccidentRate: delta(report.frayOrAccidentRate, before.frayOrAccidentRate),
        accidentRate: delta(report.accidentRate, before.accidentRate),
      };
    });
}

function printComparison(comparison) {
  console.log('');
  console.log('Comparison:');
  comparison.forEach((item) => {
    console.log(`  ${item.id}: avgScore ${signed(item.avgScore)}, p50 ${signed(item.p50)}, p90 ${signed(item.p90)}, avgLoad ${signed(item.avgLoad)}, prepHit ${signed(item.prepHitRate)}%, fray+accident ${signed(item.frayOrAccidentRate)}%, accident ${signed(item.accidentRate)}%`);
  });
}

function printChecks(checks) {
  console.log('');
  console.log('Balance checks:');
  checks.forEach((check) => {
    console.log(`  ${check.status.padEnd(4)} ${check.message}`);
  });
}

async function writeJsonReport(targetPath, data) {
  const fullPath = resolve(targetPath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log('');
  console.log(`Wrote JSON report: ${targetPath}`);
}

function increment(target, key) {
  target[key] = (target[key] ?? 0) + 1;
}

function formatCounts(counts, labels, limit = 99) {
  return Object.entries(counts)
    .sort((a, b) => Number(a[0]) - Number(b[0]) || b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => `${labels[key] ?? key}:${value}`)
    .join(' / ');
}

function formatTurnDistribution(turnsByNumber, tierLabels) {
  return Object.entries(turnsByNumber)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([turn, data]) => `T${turn} ${formatCounts(data.tiers, tierLabels, 3)}`)
    .join(' | ');
}

function incrementTurn(target, log) {
  const turn = String(log.totalTurn);
  target[turn] ??= { tiers: {}, responses: {}, prepQuality: {} };
  increment(target[turn].tiers, log.resultTier);
  increment(target[turn].responses, log.mainResponse);
  increment(target[turn].prepQuality, log.prepQuality);
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
}

function maxBy(items, score) {
  return [...items].sort((a, b) => score(b) - score(a))[0];
}

function inRange(value, [min, max]) {
  return value >= min && value <= max;
}

function rangeLabel([min, max]) {
  return `${min}..${max}`;
}

function delta(current, previous) {
  return round(current - previous);
}

function signed(value) {
  return value > 0 ? `+${round(value)}` : String(round(value));
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function run(command, commandArgs) {
  return new Promise((resolveRun, rejectRun) => {
    const executable = process.platform === 'win32' && command === 'npx' ? (process.env.ComSpec ?? 'cmd.exe') : command;
    const args = process.platform === 'win32' && command === 'npx'
      ? ['/d', '/s', '/c', 'npx', ...commandArgs]
      : commandArgs;
    const child = spawn(executable, args, { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} ${commandArgs.join(' ')} exited with ${code}`));
    });
  });
}
