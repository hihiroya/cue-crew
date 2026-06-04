import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }),
);

const samples = Number(args.get('samples') ?? 48);
const outDir = resolve('tmp/balance-build');

await main();

async function main() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await run('npx', ['tsc', '-p', 'tsconfig.test.json', '--outDir', outDir]);
  await run('node', ['scripts/fix-test-imports.mjs', outDir]);

  const { gameReducer, titleState } = await import(pathToFileURL(join(outDir, 'src/game/gameReducer.js')).href);
  const { RESPONSE_LABELS, RESULT_TIER_LABELS, PERFORMANCE_STYLE_DETAILS, EVENT_LABELS } = await import(pathToFileURL(join(outDir, 'src/game/constants.js')).href);

  const strategies = [
    { id: 'catch', prep: 'watch', response: 'catch' },
    { id: 'wait', prep: 'makeSpace', response: 'wait' },
    { id: 'arrange', prep: 'tightenFlow', response: 'arrange' },
    { id: 'cut', prep: 'prepareTransition', response: 'cut' },
    { id: 'cycle', cycle: true },
  ];

  const reports = strategies.map((strategy) => runStrategy(strategy, samples, gameReducer, titleState));
  console.log(`Balance report (${samples} seeds x ${strategies.length} strategies)`);
  reports.forEach((report) => {
    console.log('');
    console.log(`[${report.id}] avgScore=${round(report.avgScore)} avgLoad=${round(report.avgLoad)} prepHit=${round(report.prepHitRate)}%`);
    console.log(`  tiers: ${formatCounts(report.tiers, RESULT_TIER_LABELS)}`);
    console.log(`  styles: ${formatCounts(report.styles, Object.fromEntries(Object.entries(PERFORMANCE_STYLE_DETAILS).map(([key, value]) => [key, value.label])))}`);
    console.log(`  events: ${formatCounts(report.events, EVENT_LABELS, 5)}`);
    console.log(`  dominant response: ${formatCounts(report.responses, RESPONSE_LABELS)}`);
  });
}

function runStrategy(strategy, count, gameReducer, titleState) {
  const totals = {
    score: 0,
    load: 0,
    prepHits: 0,
    turns: 0,
    tiers: {},
    styles: {},
    events: {},
    responses: {},
  };
  for (let index = 0; index < count; index += 1) {
    const seed = `balance-${strategy.id}-${index}`;
    let state = gameReducer(titleState, { type: 'START', seed });
    for (let turn = 0; turn < 6; turn += 1) {
      const choice = strategy.cycle
        ? [
            { prep: 'watch', response: 'catch' },
            { prep: 'makeSpace', response: 'wait' },
            { prep: 'tightenFlow', response: 'arrange' },
            { prep: 'prepareTransition', response: 'cut' },
          ][turn % 4]
        : strategy;
      state = gameReducer(state, { type: 'SELECT_PREP', prep: choice.prep });
      state = gameReducer(state, { type: 'SELECT_RESPONSE', response: choice.response });
      state = gameReducer(state, { type: 'COMMIT_RESULT' });
    }
    totals.score += state.sceneScore * 2 + state.flowScore + state.trustScore - state.backstageLoad * 2;
    totals.load += state.backstageLoad;
    state.logs.forEach((log) => {
      totals.turns += 1;
      if (log.prepMatched) totals.prepHits += 1;
      increment(totals.tiers, log.resultTier);
      increment(totals.events, log.actorEventType);
      increment(totals.responses, log.mainResponse);
    });
    increment(totals.styles, state.performanceStyle ?? 'unset');
  }
  return {
    id: strategy.id,
    avgScore: totals.score / count,
    avgLoad: totals.load / count,
    prepHitRate: totals.turns ? (totals.prepHits / totals.turns) * 100 : 0,
    tiers: totals.tiers,
    styles: totals.styles,
    events: totals.events,
    responses: totals.responses,
  };
}

function increment(target, key) {
  target[key] = (target[key] ?? 0) + 1;
}

function formatCounts(counts, labels, limit = 99) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => `${labels[key] ?? key}:${value}`)
    .join(' / ');
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
