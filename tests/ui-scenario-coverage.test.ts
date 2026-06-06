import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { uiScenarioState } from '../src/game/uiScenarios';

type UiScenarioGroup = 'title' | 'prep' | 'response' | 'result';

type UiScenarioRegistry = {
  presets: Record<string, UiScenarioGroup[]>;
  scenarios: Array<{
    name: string;
    group: UiScenarioGroup;
    coverage: string[];
    checkViewports: Array<[number, number]>;
    screenshotViewports: Array<[number, number]>;
  }>;
};

const registry = JSON.parse(readFileSync('src/game/uiScenarioRegistry.json', 'utf8')) as UiScenarioRegistry;
const groups: UiScenarioGroup[] = ['title', 'prep', 'response', 'result'];

test('UI scenario registry has unique scenarios, valid presets, and usable builders', () => {
  const names = registry.scenarios.map((scenario) => scenario.name);
  assert.deepEqual(sorted(unique(names)), sorted(names));

  for (const presetGroups of Object.values(registry.presets)) {
    for (const group of presetGroups) assert.equal(groups.includes(group), true, `${group} should be a known UI scenario group`);
  }
  assert.deepEqual(sorted(registry.presets['ui-critical']), sorted(groups));

  for (const scenario of registry.scenarios) {
    const state = uiScenarioState(scenario.name);
    assert.equal(Boolean(state), true, `${scenario.name} should build a state`);
    if (!state) continue;
    if (scenario.group === 'title') assert.equal(state.status, 'title', `${scenario.name} should be title state`);
    if (scenario.group === 'prep') assert.equal(state.status, 'prep', `${scenario.name} should be prep state`);
    if (scenario.group === 'response') assert.equal(state.status, 'response', `${scenario.name} should be response state`);
    if (scenario.group === 'result') assert.equal(state.status === 'result' || state.status === 'finished', true, `${scenario.name} should be result or finished state`);
  }
});

test('UI scenario registry keeps required coverage tags visible', () => {
  const requiredCoverage = [
    'achievements',
    'alternate',
    'collection',
    'danger',
    'default',
    'finished',
    'fray',
    'high-load',
    'legacy-storage',
    'load-strain',
    'long-label',
    'many-effects',
    'performance-style',
    'prep',
    'primary',
    'result',
    'rough',
    'scene-hints',
    'selected-prep',
    'title',
  ];
  const coverage = unique(registry.scenarios.flatMap((scenario) => scenario.coverage));
  for (const tag of requiredCoverage) {
    assert.equal(coverage.includes(tag), true, `UI scenario coverage should include ${tag}`);
  }
});

test('UI scenario registry viewports preserve mobile coverage for checks and screenshots', () => {
  for (const scenario of registry.scenarios) {
    assert.equal(scenario.checkViewports.length >= 2, true, `${scenario.name} should have at least two check viewports`);
    assert.equal(scenario.checkViewports.some(([width]) => width <= 360), true, `${scenario.name} should include narrow mobile check`);
    assert.equal(scenario.checkViewports.some(([width]) => width >= 440), true, `${scenario.name} should include wide mobile check`);

    if (scenario.group !== 'title') {
      assert.equal(scenario.screenshotViewports.length >= 2, true, `${scenario.name} should have screenshot viewports`);
      assert.equal(scenario.screenshotViewports.some(([width]) => width <= 360), true, `${scenario.name} should include narrow screenshot`);
      assert.equal(scenario.screenshotViewports.some(([width]) => width >= 440), true, `${scenario.name} should include wide screenshot`);
    }
  }
});

function sorted(values: string[]) {
  return [...values].sort();
}

function unique(values: string[]) {
  return [...new Set(values)];
}
