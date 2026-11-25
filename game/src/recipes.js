// recipes.js — every dish, ingredient and station job of Golden Crust Bakery.
// One clear job: data only. No DOM, no timers, no sound.
export const INGREDIENTS = [
  { id: 'flour', name: 'Flour', emoji: '🌾', hint: 'Mixer → Dough' },
  { id: 'egg', name: 'Egg', emoji: '🥚', hint: 'Mixer → Batter' },
  { id: 'butter', name: 'Butter', emoji: '🧈', hint: 'Ready to plate' },
  { id: 'berries', name: 'Berries', emoji: '🫐', hint: 'Prep board → topping' },
  { id: 'seeds', name: 'Seeds', emoji: '🌰', hint: 'Prep board → topping' },
  { id: 'cinnamon', name: 'Cinnamon', emoji: '🫙', hint: 'Prep board → topping' },
  { id: 'beans', name: 'Coffee Beans', emoji: '🫘', hint: 'Coffee bar → Coffee' },
];

// A component is one thing that can sit in the tray or on a plate.
// `ready` means it is finished and can be plated; raw items must visit a station.
export const COMPONENTS = {
  flour: { name: 'Flour', emoji: '🌾', ready: false },
  egg: { name: 'Egg', emoji: '🥚', ready: false },
  butter: { name: 'Butter', emoji: '🧈', ready: true },
  berriesRaw: { name: 'Berries', emoji: '🫐', ready: false },
  seedsRaw: { name: 'Seeds', emoji: '🌰', ready: false },
  cinnamonRaw: { name: 'Cinnamon', emoji: '🫙', ready: false },
  beans: { name: 'Coffee Beans', emoji: '🫘', ready: false },
  dough: { name: 'Dough', emoji: '🍥', ready: false },
  batter: { name: 'Batter', emoji: '🥣', ready: false },
  bakedDough: { name: 'Baked Dough', emoji: '🥐', ready: true },
  bakedBatter: { name: 'Baked Sponge', emoji: '🍰', ready: true },
  berries: { name: 'Berries', emoji: '🫐', ready: true },
  seeds: { name: 'Toasted Seeds', emoji: '🌰', ready: true },
  cinnamon: { name: 'Cinnamon Sugar', emoji: '🫙', ready: true },
  coffee: { name: 'Coffee', emoji: '☕', ready: true },
};

// What each station does: input component -> output component, in seconds.
export const STATION_JOBS = {
  mixer: [
    { input: 'flour', output: 'dough', seconds: 2.5, verb: 'Mixing' },
    { input: 'egg', output: 'batter', seconds: 2.5, verb: 'Whisking' },
  ],
  oven: [
    { input: 'dough', output: 'bakedDough', seconds: 4, verb: 'Baking', burnAfter: 7 },
    { input: 'batter', output: 'bakedBatter', seconds: 4, verb: 'Baking', burnAfter: 7 },
  ],
  prep: [
    { input: 'berriesRaw', output: 'berries', seconds: 2, verb: 'Chopping' },
    { input: 'seedsRaw', output: 'seeds', seconds: 2, verb: 'Toasting' },
    { input: 'cinnamonRaw', output: 'cinnamon', seconds: 2, verb: 'Grinding' },
  ],
  coffee: [
    { input: 'beans', output: 'coffee', seconds: 2, verb: 'Brewing' },
  ],
};

// Which raw ingredient each counter button drops into the tray.
export const COUNTER_PICKUP = {
  flour: 'flour',
  egg: 'egg',
  butter: 'butter',
  berries: 'berriesRaw',
  seeds: 'seedsRaw',
  cinnamon: 'cinnamonRaw',
  beans: 'beans',
};

export const DISHES = [
  {
    id: 'croissant', name: 'Butter Croissant', emoji: '🥐', price: 18,
    needs: ['bakedDough', 'butter'],
    blurb: 'Flaky, golden, still warm.',
  },
  {
    id: 'sourdough', name: 'Sourdough Loaf', emoji: '🍞', price: 20,
    needs: ['bakedDough', 'seeds'],
    blurb: 'Crackly crust, soft crumb.',
  },
  {
    id: 'berrycake', name: 'Berry Cake', emoji: '🍰', price: 24,
    needs: ['bakedBatter', 'berries'],
    blurb: 'Sponge, cream, fresh berries.',
  },
  {
    id: 'cinnamonroll', name: 'Cinnamon Roll', emoji: '🌀', price: 22,
    needs: ['bakedDough', 'cinnamon'],
    blurb: 'Warm swirl, sugary glaze.',
  },
  {
    id: 'coffee', name: 'Coffee', emoji: '☕', price: 10,
    needs: ['coffee'],
    blurb: 'Hot, dark, to the point.',
  },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 120;
export const STAR_THRESHOLDS = [120, 180, 240];
export const MAX_ORDERS = 4;
export const TRAY_SIZE = 4;
export const PLATE_SIZE = 3;
export const ORDER_PATIENCE_SECONDS = 50;
export const COMBO_WINDOW_SECONDS = 8;
export const COMBO_MAX = 3;
export const LOST_ORDER_PENALTY = 5;
