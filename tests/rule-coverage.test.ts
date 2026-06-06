import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTOR_LABELS,
  ACTOR_WEIGHTS,
  EVENT_COMPATIBILITY,
  EVENT_LABELS,
  LOAD_BIAS_AREAS,
  PERFORMANCE_STYLE_DETAILS,
  PREP_LABELS,
  PREP_MATCHES,
  PREP_PRIMARY_RESPONSE,
  RESPONSE_BIAS,
  RESPONSE_LABELS,
  RESULT_TIER_LABELS,
  STATE_LABELS,
  STATE_WEIGHTS,
} from '../src/game/constants';
import { ACHIEVEMENT_CATALOG, SCENE_HINT_CATALOG } from '../src/game/rogueliteProgress';
import type { ActorEventType, ActorState, ActorType, LoadBiasArea, MainResponse, PerformanceStyle, PrepAction, ResultTier } from '../src/game/types';

const actorTypes = Object.keys(ACTOR_LABELS) as ActorType[];
const actorStates = Object.keys(STATE_LABELS) as ActorState[];
const eventTypes = Object.keys(EVENT_LABELS) as ActorEventType[];
const responses = Object.keys(RESPONSE_LABELS) as MainResponse[];
const prepActions = Object.keys(PREP_LABELS) as PrepAction[];
const loadAreas = [...LOAD_BIAS_AREAS] as LoadBiasArea[];
const styles = Object.keys(PERFORMANCE_STYLE_DETAILS) as PerformanceStyle[];
const resultTiers = Object.keys(RESULT_TIER_LABELS) as ResultTier[];

test('rule tables cover every labeled actor event, response, prep, state, and load area', () => {
  assert.deepEqual(sortedKeys(EVENT_COMPATIBILITY), sorted(eventTypes));
  for (const event of eventTypes) {
    assert.deepEqual(sortedKeys(EVENT_COMPATIBILITY[event]), sorted(responses));
    assert.equal(responses.some((response) => EVENT_COMPATIBILITY[event][response] > 0), true, `${event} should have a positive response`);
  }

  assert.deepEqual(sortedKeys(PREP_PRIMARY_RESPONSE), sorted(prepActions));
  for (const prep of prepActions) {
    assert.equal(responses.includes(PREP_PRIMARY_RESPONSE[prep]), true, `${prep} primary response should be valid`);
  }

  assert.deepEqual(sortedKeys(PREP_MATCHES), sorted(prepActions));
  for (const prep of prepActions) {
    assert.equal(PREP_MATCHES[prep].length > 0, true, `${prep} should cover at least one event`);
    for (const event of PREP_MATCHES[prep]) assert.equal(eventTypes.includes(event), true, `${prep} includes unknown event ${event}`);
  }

  assert.deepEqual(sortedKeys(RESPONSE_BIAS), sorted(responses));
  for (const response of responses) {
    assert.equal(loadAreas.includes(RESPONSE_BIAS[response]), true, `${response} load bias should be valid`);
  }
});

test('actor and state event weights are complete and positive', () => {
  assert.deepEqual(sortedKeys(ACTOR_WEIGHTS), sorted(actorTypes));
  for (const actor of actorTypes) {
    assert.deepEqual(sortedKeys(ACTOR_WEIGHTS[actor]), sorted(eventTypes));
    for (const event of eventTypes) assert.equal(ACTOR_WEIGHTS[actor][event] > 0, true, `${actor}.${event} should have positive weight`);
  }

  assert.deepEqual(sortedKeys(STATE_WEIGHTS), sorted(actorStates));
  for (const state of actorStates) {
    assert.deepEqual(sortedKeys(STATE_WEIGHTS[state]), sorted(eventTypes));
    for (const event of eventTypes) assert.equal(STATE_WEIGHTS[state][event] > 0, true, `${state}.${event} should have positive weight`);
  }
});

test('performance styles and result tiers reference valid domain values', () => {
  assert.deepEqual(sorted(resultTiers), ['accident', 'fray', 'masterpiece', 'scene', 'smallSuccess'].sort());
  for (const style of styles) {
    assert.equal(responses.includes(PERFORMANCE_STYLE_DETAILS[style].strength), true, `${style} strength should be a response`);
  }
});

test('achievement and scene hint catalogs stay aligned with unlock and scene domains', () => {
  const expectedAchievementIds = [
    'all-cue-run',
    'breath-finale',
    'clean-blackout',
    'closure-finale',
    'control-finale',
    'finale-breath',
    'flow-keeper',
    'heat-catcher',
    'heat-finale',
    'light-backstage',
    'read-the-room',
  ];
  const achievementIds = ACHIEVEMENT_CATALOG.map((item) => item.id);
  assert.deepEqual(sorted(achievementIds), sorted(expectedAchievementIds));
  assert.deepEqual(sorted(unique(achievementIds)), sorted(achievementIds));
  for (const achievement of ACHIEVEMENT_CATALOG) {
    assert.equal(Boolean(achievement.label && achievement.detail), true, `${achievement.id} should have copy`);
  }

  const hintIds = SCENE_HINT_CATALOG.map((item) => item.id);
  assert.deepEqual(sorted(unique(hintIds)), sorted(hintIds));
  for (const hint of SCENE_HINT_CATALOG) {
    assert.equal(hint.actor === 'any' || actorTypes.includes(hint.actor as ActorType), true, `${hint.id} actor should be valid`);
    assert.equal(eventTypes.includes(hint.event as ActorEventType), true, `${hint.id} event should be valid`);
    if (hint.response) assert.equal(responses.includes(hint.response as MainResponse), true, `${hint.id} response should be valid`);
    assert.equal(hint.id, `${hint.actor}:${hint.event}${hint.response ? `:${hint.response}` : ''}`, `${hint.id} should match its fields`);
    assert.equal(Boolean(hint.hint), true, `${hint.id} should have hint copy`);
  }
});

function sorted(values: string[]) {
  return [...values].sort();
}

function sortedKeys(value: object) {
  return Object.keys(value).sort();
}

function unique(values: string[]) {
  return [...new Set(values)];
}
