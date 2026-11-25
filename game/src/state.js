// state.js — the bakery's whole state and its rules for scoring.
// One clear job: state only. No DOM, no timers of its own, no sound.
import {
  DISHES,
  SHIFT_SECONDS,
  TARGET_COINS,
  STAR_THRESHOLDS,
  MAX_ORDERS,
  TRAY_SIZE,
  PLATE_SIZE,
  ORDER_PATIENCE_SECONDS,
  COMBO_WINDOW_SECONDS,
  COMBO_MAX,
  LOST_ORDER_PENALTY,
} from './recipes.js';

let orderCounter = 0;

export function createState(options = {}) {
  return {
    phase: 'ready', // ready | playing | over
    shiftSeconds: options.shiftSeconds || SHIFT_SECONDS,
    spawnEvery: options.spawnEvery || 12,
    seedOrders: options.seedOrders || 0,
    timeLeft: options.shiftSeconds || SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    target: TARGET_COINS,
    combo: 0,
    bestCombo: 0,
    lastServeAt: -Infinity,
    served: 0,
    lost: 0,
    burnt: 0,
    orders: [],
    tray: [], // { compId } — TRAY_SIZE at most
    selectedTray: -1, // index into tray, or -1
    plate: [], // compIds on the plate — PLATE_SIZE at most
    stations: {
      mixer: { job: null },
      oven: { jobs: [null, null] },
      prep: { job: null },
      coffee: { job: null },
    },
    spawnIn: 2, // seconds until the next order arrives
    muted: false,
    paused: false,
    lastTickAt: 0,
    lastTickSecond: -1,
    endReason: null,
  };
}

export function pickDish(random = Math.random) {
  return DISHES[Math.floor(random() * DISHES.length)];
}

export function addOrder(state, dish) {
  if (state.orders.filter((o) => o.state === 'waiting').length >= MAX_ORDERS) return null;
  const order = {
    id: ++orderCounter,
    dishId: dish.id,
    patience: ORDER_PATIENCE_SECONDS,
    maxPatience: ORDER_PATIENCE_SECONDS,
    state: 'waiting',
  };
  state.orders.push(order);
  return order;
}

export function trayHasRoom(state) {
  return state.tray.length < TRAY_SIZE;
}

export function addToTray(state, compId) {
  if (!trayHasRoom(state)) return false;
  state.tray.push({ compId });
  return true;
}

export function removeFromTray(state, index) {
  if (index < 0 || index >= state.tray.length) return null;
  const [item] = state.tray.splice(index, 1);
  if (state.selectedTray === index) state.selectedTray = -1;
  else if (state.selectedTray > index) state.selectedTray -= 1;
  return item;
}

export function plateHasRoom(state) {
  return state.plate.length < PLATE_SIZE;
}

export function plateMatchesOrder(state, order) {
  const dish = DISHES.find((d) => d.id === order.dishId);
  if (!dish) return false;
  if (state.plate.length !== dish.needs.length) return false;
  const plate = [...state.plate].sort();
  const needs = [...dish.needs].sort();
  return plate.every((c, i) => c === needs[i]);
}

export function findMatchingOrder(state) {
  return state.orders.find((o) => o.state === 'waiting' && plateMatchesOrder(state, o));
}

// Serve the plate to a matching order. Returns the payout or null.
export function servePlate(state, order) {
  const dish = DISHES.find((d) => d.id === order.dishId);
  if (!dish || !plateMatchesOrder(state, order)) return null;
  const patienceFrac = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(dish.price * 0.5 * patienceFrac);
  const inComboWindow = state.elapsed - state.lastServeAt <= COMBO_WINDOW_SECONDS;
  state.combo = inComboWindow ? Math.min(state.combo + 1, COMBO_MAX) : 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const comboBonus = state.combo > 1 ? (state.combo - 1) * 2 : 0;
  const payout = dish.price + tip + comboBonus;
  state.coins += payout;
  state.served += 1;
  state.lastServeAt = state.elapsed;
  order.state = 'served';
  state.plate = [];
  state.selectedTray = -1;
  return { payout, dish, tip, combo: state.combo, comboBonus };
}

export function loseOrder(state, order) {
  order.state = 'lost';
  state.lost += 1;
  state.coins = Math.max(0, state.coins - LOST_ORDER_PENALTY);
  state.combo = 0;
}

export function starsEarned(state) {
  let stars = 0;
  for (const threshold of STAR_THRESHOLDS) {
    if (state.coins >= threshold) stars += 1;
  }
  return stars;
}

export function isWin(state) {
  return state.coins >= state.target;
}
