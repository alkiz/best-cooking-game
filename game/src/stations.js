// stations.js — everything the four kitchen stations do.
// One clear job: station jobs only. No DOM, no scoring, no sound.
import { STATION_JOBS, COMPONENTS } from './recipes.js';
import { addToTray, removeFromTray } from './state.js';

export const STATION_DEFS = [
  { id: 'mixer', name: 'Mixer', emoji: '🥣', slots: 1 },
  { id: 'oven', name: 'Oven', emoji: '🔥', slots: 2 },
  { id: 'prep', name: 'Prep Board', emoji: '🔪', slots: 1 },
  { id: 'coffee', name: 'Coffee Bar', emoji: '☕', slots: 1 },
];

function findJob(stationId, inputId) {
  return (STATION_JOBS[stationId] || []).find((j) => j.input === inputId) || null;
}

export function jobFor(stationId, compId) {
  return findJob(stationId, compId);
}

function stationSlot(state, stationId, slotIndex) {
  if (stationId === 'oven') return state.stations.oven.jobs[slotIndex];
  return state.stations[stationId].job;
}

function setStationSlot(state, stationId, slotIndex, job) {
  if (stationId === 'oven') state.stations.oven.jobs[slotIndex] = job;
  else state.stations[stationId].job = job;
}

export function freeSlotIndex(state, stationId) {
  if (stationId === 'oven') {
    return state.stations.oven.jobs.findIndex((j) => j === null);
  }
  return state.stations[stationId].job === null ? 0 : -1;
}

// Start a job on a station using the selected tray item.
// Returns { ok, reason } — reason names the problem for the UI.
export function startJob(state, stationId, trayIndex) {
  const item = state.tray[trayIndex];
  if (!item) return { ok: false, reason: 'empty' };
  const job = findJob(stationId, item.compId);
  if (!job) return { ok: false, reason: 'no-recipe' };
  const slot = freeSlotIndex(state, stationId);
  if (slot < 0) return { ok: false, reason: 'busy' };
  removeFromTray(state, trayIndex);
  setStationSlot(state, stationId, slot, {
    input: job.input,
    output: job.output,
    verb: job.verb,
    duration: job.seconds,
    burnAfter: job.burnAfter || null,
    progress: 0,
    done: false,
    burnt: false,
  });
  return { ok: true, job };
}

// Advance every running job by dt seconds. Returns events for the UI/sound.
export function tickStations(state, dt) {
  const events = [];
  const visit = (stationId, slotIndex) => {
    const job = stationSlot(state, stationId, slotIndex);
    if (!job || job.done) return;
    job.progress += dt;
    if (job.progress >= job.duration && !job.done) {
      job.done = true;
      events.push({ type: 'done', stationId, slotIndex, output: job.output });
    }
    if (job.burnAfter && job.progress >= job.burnAfter && !job.burnt) {
      job.burnt = true;
      events.push({ type: 'burnt', stationId, slotIndex });
    }
  };
  visit('mixer', 0);
  visit('oven', 0);
  visit('oven', 1);
  visit('prep', 0);
  visit('coffee', 0);
  return events;
}

// Collect a finished job's output into the tray. Returns the component or null.
export function collectJob(state, stationId, slotIndex) {
  const job = stationSlot(state, stationId, slotIndex);
  if (!job || !job.done) return null;
  if (job.burnt) return null; // burnt food must be trashed, never collected
  if (state.tray.length >= 4) return null;
  addToTray(state, job.output);
  setStationSlot(state, stationId, slotIndex, null);
  return job.output;
}

// Throw a job away (burnt food, or a job you no longer want).
// Returns true when something was cleared.
export function trashJob(state, stationId, slotIndex) {
  const job = stationSlot(state, stationId, slotIndex);
  if (!job) return false;
  const wasBurnt = job.burnt;
  setStationSlot(state, stationId, slotIndex, null);
  if (wasBurnt) state.burnt += 1;
  return true;
}

export function stationState(state, stationId) {
  if (stationId === 'oven') return state.stations.oven.jobs;
  return [state.stations[stationId].job];
}

export function componentName(compId) {
  return (COMPONENTS[compId] || { name: compId }).name;
}

export function componentEmoji(compId) {
  return (COMPONENTS[compId] || { emoji: '❓' }).emoji;
}
