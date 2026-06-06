import { spawnSync } from 'node:child_process';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }),
);

const changedFiles = changedFilesForArgs();
const recommendation = recommendVerification(changedFiles);

if (!changedFiles.length) {
  console.log('No changed files detected. Use --base=<ref> to compare against a branch or commit.');
  process.exit(0);
}

console.log('Changed files:');
for (const file of changedFiles) console.log(`- ${file}`);

console.log('\nRecommended checks:');
for (const command of recommendation.commands) console.log(`- ${command}`);

if (recommendation.notes.length) {
  console.log('\nReview notes:');
  for (const note of recommendation.notes) console.log(`- ${note}`);
}

function changedFilesForArgs() {
  const base = args.get('base');
  if (base) return gitLines(['diff', '--name-only', `${base}...HEAD`]);
  if (args.get('staged') === 'true') return gitLines(['diff', '--cached', '--name-only']);
  const files = new Set([
    ...gitLines(['diff', '--name-only']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]);
  return [...files].sort();
}

function gitLines(gitArgs) {
  const result = spawnSync('git', gitArgs, { encoding: 'utf8' });
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim();
    throw new Error(`git ${gitArgs.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function recommendVerification(files) {
  const commands = new Set();
  const notes = new Set();

  const touches = (...patterns) => files.some((file) => patterns.some((pattern) => pattern.test(file)));

  if (touches(/^src\/game\//, /^tests\//, /^scripts\/balance-report\.mjs$/)) {
    commands.add('npm run test:logic');
  }

  if (touches(
    /^src\/game\/(scoreRules|scoring|resultPreview|actorLogic|constants|dailyRun|rogueliteProgress)\.ts$/,
    /^scripts\/balance-report\.mjs$/,
  )) {
    commands.add('npm run balance:report -- --samples=48');
    notes.add('採点、イベント、日替わり、称号/図鑑条件への波及を確認する。');
  }

  if (touches(/^src\/app\//, /^src\/components\//, /^src\/styles\//, /^src\/content\/ja\//, /^src\/game\/uiScenario/, /^scripts\/check-ui-layout\.mjs$/)) {
    commands.add(recommendedUiCommand(files));
  }

  if (touches(/^src\/app\/usePerformanceHistory\.ts$/, /^src\/app\/storage\//, /^src\/game\/rogueliteProgress\.ts$/)) {
    notes.add('保存データは壊れたJSON、古いJSON、キー未作成状態の互換性を確認する。');
  }

  if (touches(/^package\.json$/, /^package-lock\.json$/)) {
    commands.add('npm audit signatures');
    notes.add('依存変更がある場合は package 差分、新規 direct dependency、install script を持つ dependency を報告する。');
  }

  if (touches(/^AGENTS\.md$/, /^docs\/development-maintenance\.md$/, /^\.codex\/skills\/cue-crew-maintainer\/SKILL\.md$/)) {
    notes.add('AGENTS.md、docs/development-maintenance.md、repo 専用 skill の整合性を確認する。');
  }

  if (touches(/^src\//, /^scripts\//, /^tests\//, /^eslint\.config\.mjs$/, /^vite\.config\.ts$/, /^tsconfig/)) {
    commands.add('npm run check:lint');
    commands.add('npm run build');
  }

  if (!commands.size) commands.add('npm run build');

  return { commands: [...commands], notes: [...notes] };
}

function recommendedUiCommand(files) {
  const onlyPrep = files.every((file) => /prep/i.test(file) || /^src\/content\/ja\//.test(file));
  const onlyResponse = files.every((file) => /response|ActionPanel|ScoreBar|EventPanel/i.test(file) || /^src\/content\/ja\//.test(file));
  const onlyResult = files.every((file) => /result/i.test(file) || /^src\/content\/ja\//.test(file));
  if (onlyPrep) return 'npm run check:ui:prep';
  if (onlyResponse) return 'npm run check:ui:response';
  if (onlyResult) return 'npm run check:ui:result';
  return 'npm run check:ui';
}
