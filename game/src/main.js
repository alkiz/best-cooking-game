// main.js — boots the bakery, wires every click and key, runs the clock.
// One clear job: orchestration only. Rules live in state.js, jobs in stations.js.
import {
  INGREDIENTS, DISHES, DISH_BY_ID, COUNTER_PICKUP,
  SHIFT_SECONDS, TARGET_COINS, PLATE_SIZE,
} from './recipes.js';
import {
  createState, addOrder, pickDish, addToTray, removeFromTray,
  plateMatchesOrder, findMatchingOrder, servePlate, loseOrder,
} from './state.js';
import {
  STATION_DEFS, startJob, tickStations, collectJob, trashJob, stationState,
} from './stations.js';
import { sfx, unlockAudio, setMuted } from './audio.js';
import * as render from './render.js';

const params = new URLSearchParams(location.search);
const state = createState({
  shiftSeconds: Number(params.get('shift')) || SHIFT_SECONDS,
  spawnEvery: Number(params.get('spawn')) || 12,
  seedOrders: Number(params.get('orders')) || 0,
});

let timer = null;

function spawnOrder() {
  const order = addOrder(state, pickDish());
  if (order) {
    sfx.orderIn();
    render.showToast(`New order: ${DISH_BY_ID[order.dishId].name} ${DISH_BY_ID[order.dishId].emoji}`);
  }
}

function tick() {
  if (state.phase !== 'playing' || state.paused) return;
  const dt = 0.1;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, state.shiftSeconds - state.elapsed);

  // Orders arrive on a schedule that quickens as the shift goes on.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    spawnOrder();
    const pressure = 1 - state.elapsed / state.shiftSeconds;
    state.spawnIn = 8 + pressure * 6;
  }

  // Patience drains; a starved order walks out.
  for (const order of state.orders) {
    if (order.state !== 'waiting') continue;
    order.patience -= dt;
    if (order.patience <= 0) {
      loseOrder(state, order);
      sfx.lost();
      render.showToast(`A customer walked out! −$5`, 'bad');
    }
  }

  // Station jobs advance; finished ones ding, burnt ones smoke.
  for (const ev of tickStations(state, dt)) {
    if (ev.type === 'done') sfx.ding();
    if (ev.type === 'burnt') {
      sfx.error();
      render.showToast('Something burnt! Click it to trash it.', 'bad');
    }
  }

  if (state.timeLeft <= 10 && state.timeLeft > 0) {
    const whole = Math.ceil(state.timeLeft);
    if (whole !== state.lastTickSecond) {
      state.lastTickSecond = whole;
      sfx.tick();
    }
  }
  if (state.timeLeft <= 0) endShift();
  render.update(state);
}

function startShift() {
  unlockAudio();
  state.phase = 'playing';
  state.orders = [];
  for (let i = 0; i < state.seedOrders; i++) spawnOrder();
  spawnOrder();
  document.getElementById('startOverlay').classList.add('hidden');
  sfx.orderIn();
  if (!timer) timer = setInterval(tick, 100);
  render.update(state);
}

function endShift() {
  state.phase = 'over';
  clearInterval(timer);
  timer = null;
  if (state.coins >= TARGET_COINS) sfx.win();
  else sfx.lost();
  render.showEnd(state);
  render.update(state);
}

const handlers = {
  onIngredient(ingId) {
    if (state.phase !== 'playing' || state.paused) return;
    unlockAudio();
    const compId = COUNTER_PICKUP[ingId];
    if (addToTray(state, compId)) {
      sfx.pickup();
      const ing = INGREDIENTS.find((i) => i.id === ingId);
      state.selectedTray = state.tray.length - 1;
      render.showToast(`${ing.emoji} ${ing.name} on your tray`);
    } else {
      sfx.error();
      render.showToast('Tray is full!', 'bad');
    }
    render.update(state);
  },

  onTraySelect(index) {
    if (state.phase !== 'playing' || state.paused) return;
    state.selectedTray = state.selectedTray === index ? -1 : index;
    sfx.click();
    render.update(state);
  },

  onStationClick(stationId, slotIndex) {
    if (state.phase !== 'playing' || state.paused) return;
    unlockAudio();
    const jobs = stationState(state, stationId);
    const job = jobs[slotIndex];
    if (job && job.burnt) {
      trashJob(state, stationId, slotIndex);
      sfx.error();
      render.showToast('Burnt food trashed. Combo reset.', 'bad');
      state.combo = 0;
      render.update(state);
      return;
    }
    if (job && job.done) {
      const got = collectJob(state, stationId, slotIndex);
      if (got) {
        sfx.pickup();
        render.showToast('Collected! Ready to plate.');
      } else {
        sfx.error();
        render.showToast('Tray is full — serve or trash something first.', 'bad');
      }
      render.update(state);
      return;
    }
    if (job && !job.done) {
      render.showToast('Still working… give it a moment.');
      render.update(state);
      return;
    }
    // Empty slot: start a job with the selected tray item.
    if (state.selectedTray < 0) {
      render.showToast('Pick an ingredient from your tray first.');
      render.update(state);
      return;
    }
    const res = startJob(state, stationId, state.selectedTray);
    if (!res.ok) {
      sfx.error();
      render.showToast(
        res.reason === 'busy' ? 'That station is busy!' : 'That does not go there — check the hints.',
        'bad',
      );
    } else {
      if (stationId === 'oven') sfx.sizzle();
      else if (stationId === 'coffee') sfx.brew();
      else if (stationId === 'prep') sfx.chop();
      else sfx.mix();
    }
    render.update(state);
  },

  onPlateAdd() {
    if (state.phase !== 'playing' || state.paused) return;
    if (state.selectedTray < 0) {
      render.showToast('Select a tray item first, then click the plate.');
      render.update(state);
      return;
    }
    if (state.plate.length >= PLATE_SIZE) {
      sfx.error();
      render.showToast('The plate is full — serve it or clear it.', 'bad');
      render.update(state);
      return;
    }
    const item = removeFromTray(state, state.selectedTray);
    if (item) {
      state.plate.push(item.compId);
      sfx.click();
    }
    render.update(state);
  },

  onPlateItemClick(index) {
    if (state.phase !== 'playing' || state.paused) return;
    const compId = state.plate[index];
    if (!compId) return;
    if (state.tray.length >= 4) {
      sfx.error();
      render.showToast('Tray is full.', 'bad');
      return;
    }
    state.plate.splice(index, 1);
    addToTray(state, compId);
    sfx.click();
    render.update(state);
  },

  onServe() {
    if (state.phase !== 'playing' || state.paused) return;
    const order = findMatchingOrder(state);
    if (!order) {
      sfx.error();
      render.showToast('No order matches this plate yet.', 'bad');
      return;
    }
    const result = servePlate(state, order);
    if (result) {
      sfx.serve();
      render.floatCoins(`+$${result.payout}`);
      render.showToast(
        `Served ${result.dish.emoji} ${result.dish.name}! +$${result.payout}${result.combo > 1 ? ` (combo x${result.combo})` : ''}`,
        'good',
      );
    }
    render.update(state);
  },

  onOrderClick(orderId) {
    if (state.phase !== 'playing' || state.paused) return;
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || order.state !== 'waiting') return;
    if (!plateMatchesOrder(state, order)) {
      sfx.error();
      render.showToast('The plate does not match this order — check the ✓ list.', 'bad');
      return;
    }
    handlers.onServe();
  },

  onClearPlate() {
    if (state.phase !== 'playing' || state.paused) return;
    if (state.plate.length === 0) return;
    state.plate = [];
    sfx.click();
    render.showToast('Plate cleared.');
    render.update(state);
  },

  onTrash() {
    if (state.phase !== 'playing' || state.paused) return;
    if (state.selectedTray < 0) {
      render.showToast('Select a tray item first, then trash it.');
      return;
    }
    const item = removeFromTray(state, state.selectedTray);
    if (item) {
      sfx.error();
      render.showToast('Trashed. Combo reset.', 'bad');
      state.combo = 0;
    }
    render.update(state);
  },

  onMute() {
    state.muted = !state.muted;
    setMuted(state.muted);
    render.update(state);
  },

  onPause() {
    if (state.phase !== 'playing') return;
    state.paused = !state.paused;
    render.update(state);
  },

  onStart() {
    startShift();
  },

  onPlayAgain() {
    location.reload();
  },
};

function wireKeys() {
  const keyToIngredient = {
    1: 'flour', 2: 'egg', 3: 'butter', 4: 'berries',
    5: 'seeds', 6: 'cinnamon', 7: 'beans',
  };
  window.addEventListener('keydown', (e) => {
    if (state.phase !== 'playing') return;
    if (keyToIngredient[e.key]) handlers.onIngredient(keyToIngredient[e.key]);
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handlers.onServe(); }
    else if (e.key === 't' || e.key === 'T') handlers.onTrash();
    else if (e.key === 'p' || e.key === 'P') handlers.onPause();
    else if (e.key === 'm' || e.key === 'M') handlers.onMute();
  });
}

// Debug handle for the screenshot script only: lets playtests seed the kitchen.
window.GoldenCrust = { state, spawnOrder, handlers };

render.initRender(handlers);
render.showStart();
render.update(state);
wireKeys();
const shiftText = state.shiftSeconds < 60
  ? `${state.shiftSeconds}-second shift`
  : `${Math.round(state.shiftSeconds / 60)}-minute shift`;
document.getElementById('shiftLabel').textContent =
  `${shiftText} · target $${TARGET_COINS} · ${DISHES.length} dishes on the menu`;
