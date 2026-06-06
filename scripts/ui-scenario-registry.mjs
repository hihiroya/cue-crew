import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const registryPath = resolve(scriptDir, '..', 'src', 'game', 'uiScenarioRegistry.json');
export const uiScenarioRegistry = JSON.parse(readFileSync(registryPath, 'utf8'));

export function presetJobsFor(kind, presetName) {
  const groups = uiScenarioRegistry.presets[presetName];
  if (!groups) return null;
  const viewportKey = kind === 'screenshot' ? 'screenshotViewports' : 'checkViewports';
  return uiScenarioRegistry.scenarios
    .filter((scenario) => groups.includes(scenario.group))
    .flatMap((scenario) => scenario[viewportKey].map(([width, height]) => [scenario.name, width, height]));
}

export function knownPresetNames() {
  return Object.keys(uiScenarioRegistry.presets);
}
