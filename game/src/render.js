// render.js — everything the player sees, and nothing else.
// One clear job: DOM only. It never changes game state; main.js owns that.
import { INGREDIENTS, DISH_BY_ID, COMPONENTS, PLATE_SIZE } from './recipes.js';
import { STATION_DEFS, stationState, componentName, componentEmoji } from './stations.js';
import { plateMatchesOrder, starsEarned, isWin } from './state.js';

let els = {};
let handlers = {};

function $(id) {
  return document.getElementById(id);
}

export function initRender(h) {
  handlers = h;
  els = {
    coins: $('coins'), timerText: $('timerText'), timerBar: $('timerBar'),
    comboBadge: $('comboBadge'), targetText: $('targetText'),
    orders: $('orders'), stations: $('stations'), counter: $('counter'),
    tray: $('tray'), plate: $('plate'), serveBtn: $('serveBtn'),
    clearPlateBtn: $('clearPlateBtn'), trashBtn: $('trashBtn'),
    toast: $('toast'), floatLayer: $('floatLayer'),
    startOverlay: $('startOverlay'), endOverlay: $('endOverlay'),
    endTitle: $('endTitle'), endStats: $('endStats'), endStars: $('endStars'),
    startBtn: $('startBtn'), playAgainBtn: $('playAgainBtn'),
    muteBtn: $('muteBtn'), pauseBtn: $('pauseBtn'),
    shiftLabel: $('shiftLabel'),
  };

  // Ingredient counter buttons.
  els.counter.innerHTML = '';
  for (const ing of INGREDIENTS) {
    const btn = document.createElement('button');
    btn.className = 'ingredient';
    btn.dataset.id = ing.id;
    btn.innerHTML = `<span class="ing-emoji">${ing.emoji}</span><span class="ing-name">${ing.name}</span><span class="ing-hint">${ing.hint}</span>`;
    btn.addEventListener('click', () => handlers.onIngredient(ing.id));
    els.counter.appendChild(btn);
  }

  // Station cards.
  els.stations.innerHTML = '';
  for (const def of STATION_DEFS) {
    const card = document.createElement('div');
    card.className = 'station';
    card.id = `station-${def.id}`;
    card.innerHTML = `
      <div class="station-head"><span class="station-emoji">${def.emoji}</span><span class="station-name">${def.name}</span></div>
      <div class="slots"></div>`;
    els.stations.appendChild(card);
  }

  els.serveBtn.addEventListener('click', () => handlers.onServe());
  els.clearPlateBtn.addEventListener('click', () => handlers.onClearPlate());
  els.trashBtn.addEventListener('click', () => handlers.onTrash());
  els.startBtn.addEventListener('click', () => handlers.onStart());
  els.playAgainBtn.addEventListener('click', () => handlers.onPlayAgain());
  els.muteBtn.addEventListener('click', () => handlers.onMute());
  els.pauseBtn.addEventListener('click', () => handlers.onPause());
  els.plate.addEventListener('click', (e) => {
    const item = e.target.closest('.plate-item');
    if (item && !item.classList.contains('empty')) handlers.onPlateItemClick(Number(item.dataset.index));
    else handlers.onPlateAdd();
  });
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function patienceClass(frac) {
  if (frac > 0.5) return 'good';
  if (frac > 0.25) return 'warn';
  return 'bad';
}

function renderOrders(state) {
  const waiting = state.orders.filter((o) => o.state === 'waiting');
  const done = state.orders.filter((o) => o.state !== 'waiting').slice(-2);
  const list = [...waiting, ...done];
  els.orders.innerHTML = '';
  if (list.length === 0) {
    els.orders.innerHTML = '<div class="no-orders">No orders yet — the morning rush is coming…</div>';
    return;
  }
  for (const order of list) {
    const dish = DISH_BY_ID[order.dishId];
    const frac = Math.max(0, order.patience / order.maxPatience);
    const ticket = document.createElement('div');
    ticket.className = `order ${order.state}`;
    if (order.state === 'waiting' && plateMatchesOrder(state, order)) ticket.classList.add('ready');
    const checks = dish.needs.map((need) => {
      const has = state.plate.includes(need);
      return `<span class="need ${has ? 'have' : ''}">${has ? '✓' : '○'} ${componentEmoji(need)} ${componentName(need)}</span>`;
    }).join('');
    ticket.innerHTML = `
      <div class="order-top"><span class="order-emoji">${dish.emoji}</span>
      <span class="order-name">${dish.name}</span>
      <span class="order-price">$${dish.price}</span></div>
      <div class="order-needs">${checks}</div>
      <div class="patience"><div class="patience-fill ${patienceClass(frac)}" style="width:${Math.round(frac * 100)}%"></div></div>
      <div class="order-state">${order.state === 'waiting' ? 'waiting…' : order.state === 'served' ? '✓ served' : '✕ walked out'}</div>`;
    if (order.state === 'waiting') {
      ticket.addEventListener('click', () => handlers.onOrderClick(order.id));
    }
    els.orders.appendChild(ticket);
  }
}

function renderStations(state) {
  for (const def of STATION_DEFS) {
    const card = $(`station-${def.id}`);
    const slotsEl = card.querySelector('.slots');
    const jobs = stationState(state, def.id);
    slotsEl.innerHTML = '';
    jobs.forEach((job, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      if (!job) {
        slot.classList.add('empty');
        slot.innerHTML = `<span class="slot-empty">Empty</span>`;
      } else if (job.burnt) {
        slot.classList.add('burnt');
        slot.innerHTML = `<span class="slot-emoji">🔥</span><span class="slot-label">Burnt! Click to trash</span>`;
      } else if (job.done) {
        slot.classList.add('done');
        slot.innerHTML = `<span class="slot-emoji">${componentEmoji(job.output)}</span><span class="slot-label">${componentName(job.output)} — ready! Click to collect</span>`;
      } else {
        const frac = Math.min(1, job.progress / job.duration);
        slot.classList.add('busy');
        slot.innerHTML = `<span class="slot-emoji">${componentEmoji(job.output)}</span>
          <span class="slot-label">${job.verb}… ${componentName(job.output)}</span>
          <div class="progress"><div class="progress-fill" style="width:${Math.round(frac * 100)}%"></div></div>`;
      }
      slot.addEventListener('click', () => handlers.onStationClick(def.id, i));
      slotsEl.appendChild(slot);
    });
    card.classList.toggle('has-fire', def.id === 'oven' && jobs.some((j) => j && !j.done));
    card.classList.toggle('steaming', jobs.some((j) => j && !j.done));
  }
}

function renderTray(state) {
  els.tray.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const item = state.tray[i];
    const slot = document.createElement('div');
    slot.className = 'tray-slot';
    if (item) {
      const comp = COMPONENTS[item.compId] || { name: item.compId, emoji: '❓', ready: false };
      slot.classList.add(comp.ready ? 'ready' : 'raw');
      if (state.selectedTray === i) slot.classList.add('selected');
      slot.innerHTML = `<span class="tray-emoji">${comp.emoji}</span><span class="tray-name">${comp.name}</span>${comp.ready ? '<span class="tray-check">✓</span>' : '<span class="tray-raw-dot">raw</span>'}`;
      slot.addEventListener('click', () => handlers.onTraySelect(i));
    } else {
      slot.classList.add('empty');
      slot.innerHTML = '<span class="tray-empty">—</span>';
    }
    els.tray.appendChild(slot);
  }
}

function renderPlate(state) {
  els.plate.innerHTML = '';
  for (let i = 0; i < PLATE_SIZE; i++) {
    const compId = state.plate[i];
    const slot = document.createElement('div');
    slot.className = 'plate-item';
    slot.dataset.index = i;
    if (compId) {
      slot.innerHTML = `<span class="plate-emoji">${componentEmoji(compId)}</span><span class="plate-name">${componentName(compId)}</span>`;
    } else {
      slot.classList.add('empty');
      slot.innerHTML = '<span class="plate-empty">○</span>';
    }
    els.plate.appendChild(slot);
  }
  const match = state.plate.length > 0 && state.orders.some((o) => o.state === 'waiting' && plateMatchesOrder(state, o));
  els.serveBtn.disabled = !match;
  els.serveBtn.classList.toggle('ready', !!match);
}

export function update(state) {
  els.coins.textContent = `$${state.coins}`;
  els.targetText.textContent = `Target $${state.target}`;
  els.timerText.textContent = fmtTime(state.timeLeft);
  const timeFrac = state.timeLeft / state.shiftSeconds;
  els.timerBar.style.width = `${Math.round(timeFrac * 100)}%`;
  els.timerBar.className = `timer-fill ${timeFrac < 0.17 ? 'bad' : timeFrac < 0.4 ? 'warn' : 'good'}`;
  els.comboBadge.textContent = state.combo > 1 ? `🔥 Combo x${state.combo}` : '';
  els.comboBadge.classList.toggle('show', state.combo > 1);
  els.pauseBtn.textContent = state.paused ? '▶ Resume' : '⏸ Pause';
  els.muteBtn.textContent = state.muted ? '🔇 Muted' : '🔊 Sound';
  renderOrders(state);
  renderStations(state);
  renderTray(state);
  renderPlate(state);
}

let toastTimer = null;
export function showToast(text, kind = '') {
  els.toast.textContent = text;
  els.toast.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.className = 'toast'; }, 1800);
}

export function floatCoins(text) {
  const el = document.createElement('div');
  el.className = 'float-coins';
  el.textContent = text;
  els.floatLayer.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

export function showStart() {
  els.startOverlay.classList.remove('hidden');
  els.endOverlay.classList.add('hidden');
}

export function showEnd(state) {
  els.endOverlay.classList.remove('hidden');
  els.startOverlay.classList.add('hidden');
  const stars = starsEarned(state);
  els.endTitle.textContent = isWin(state) ? '🎉 Shift Complete!' : '⏰ Shift Over';
  els.endStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  els.endStats.innerHTML = `
    <div><b>$${state.coins}</b><span>coins earned</span></div>
    <div><b>${state.served}</b><span>dishes served</span></div>
    <div><b>${state.bestCombo}</b><span>best combo</span></div>
    <div><b>${state.lost}</b><span>orders lost</span></div>`;
}
