const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "plantcare-advisor-state-v1";

const els = {
  connectionStatus: $("connectionStatus"),
  metricPlants: $("metricPlants"),
  metricTasks: $("metricTasks"),
  metricClimate: $("metricClimate"),

  locationSearch: $("locationSearch"),
  btnSearchLocation: $("btnSearchLocation"),
  btnUseBrowserLocation: $("btnUseBrowserLocation"),
  locationResults: $("locationResults"),
  climateSummary: $("climateSummary"),
  locationBadge: $("locationBadge"),

  plantType: $("plantType"),
  plantName: $("plantName"),
  placement: $("placement"),
  rootEnv: $("rootEnv"),
  plantSize: $("plantSize"),
  plantAge: $("plantAge"),
  light: $("light"),
  soil: $("soil"),
  plantNotes: $("plantNotes"),
  btnAddPlant: $("btnAddPlant"),
  btnAddSamples: $("btnAddSamples"),
  btnClearPlants: $("btnClearPlants"),
  plantList: $("plantList"),

  scheduleHorizon: $("scheduleHorizon"),
  filterPlant: $("filterPlant"),
  filterTask: $("filterTask"),
  btnBuildSchedule: $("btnBuildSchedule"),
  btnExportCsv: $("btnExportCsv"),
  scheduleBadge: $("scheduleBadge"),
  scheduleStats: $("scheduleStats"),
  scheduleList: $("scheduleList"),

  photoInput: $("photoInput"),
  btnIdentifyPlant: $("btnIdentifyPlant"),
  btnUseCandidate: $("btnUseCandidate"),
  identifyOutput: $("identifyOutput"),

  chatLog: $("chatLog"),
  chatInput: $("chatInput"),
  btnSendChat: $("btnSendChat"),

  btnResetAll: $("btnResetAll")
};

const DEFAULT_STATE = {
  location: null,
  climate: null,
  plants: [],
  doneTasks: {},
  lastSchedule: [],
  lastIdentification: null
};

let state = loadState();

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return { ...structuredClone(DEFAULT_STATE), ...(stored || {}) };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setStatus(text, kind = "") {
  els.connectionStatus.textContent = text;
  els.connectionStatus.className = `status-pill ${kind}`.trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function daysUntil(dateIso) {
  const now = today();
  const d = new Date(dateIso + "T00:00:00");
  return Math.round((d - now) / 86400000);
}

function round(n, dp = 1) {
  const p = 10 ** dp;
  return Math.round(Number(n || 0) * p) / p;
}

const PLANT_TYPES = [
  {
    id: "lawn_cool",
    label: "Grass / lawn",
    category: "lawn",
    defaultPlacement: "outdoor",
    defaultRoot: "ground",
    waterBaseDays: 5,
    description: "General lawn or grass area."
  },
  {
    id: "houseplant_leafy",
    label: "Houseplant — leafy generic",
    category: "houseplant",
    defaultPlacement: "indoor",
    defaultRoot: "pot",
    waterBaseDays: 9,
    description: "Generic leafy houseplant."
  },
  {
    id: "monstera",
    label: "Monstera deliciosa",
    category: "houseplant",
    defaultPlacement: "indoor",
    defaultRoot: "pot",
    waterBaseDays: 8,
    description: "Tropical houseplant; usually bright indirect light and even moisture."
  },
  {
    id: "rubber_plant",
    label: "Ficus elastica / rubber plant",
    category: "houseplant",
    defaultPlacement: "indoor",
    defaultRoot: "pot",
    waterBaseDays: 11,
    description: "Indoor ficus; prefers drying slightly between watering."
  },
  {
    id: "succulent",
    label: "Succulent / cactus",
    category: "houseplant",
    defaultPlacement: "indoor",
    defaultRoot: "pot",
    waterBaseDays: 18,
    description: "Dry-tolerant plant; overwatering risk is high."
  },
  {
    id: "orchid_phalaenopsis",
    label: "Phalaenopsis orchid",
    category: "houseplant",
    defaultPlacement: "indoor",
    defaultRoot: "pot",
    waterBaseDays: 8,
    description: "Orchid usually grown in bark mix; check roots/substrate before watering."
  },
  {
    id: "hedge_generic",
    label: "Hedge — generic",
    category: "hedge",
    defaultPlacement: "outdoor",
    defaultRoot: "ground",
    waterBaseDays: 10,
    description: "General hedge care."
  },
  {
    id: "box_hedge",
    label: "Box hedge / Buxus",
    category: "hedge",
    defaultPlacement: "outdoor",
    defaultRoot: "ground",
    waterBaseDays: 10,
    description: "Evergreen hedge; watch for box blight and box caterpillar."
  },
  {
    id: "beech_hedge",
    label: "Beech hedge",
    category: "hedge",
    defaultPlacement: "outdoor",
    defaultRoot: "ground",
    waterBaseDays: 12,
    description: "Deciduous hedge; trimming is usually summer-led."
  },
  {
    id: "tree_generic",
    label: "Tree — generic",
    category: "tree",
    defaultPlacement: "outdoor",
    defaultRoot: "ground",
    waterBaseDays: 12,
    description: "General garden tree."
  },
  {
    id: "apple_tree",
    label: "Apple tree",
    category: "tree",
    defaultPlacement: "outdoor",
    defaultRoot: "ground",
    waterBaseDays: 10,
    description: "Fruit tree with species-specific pruning and pest monitoring."
  },
  {
    id: "rose",
    label: "Rose",
    category: "shrub",
    defaultPlacement: "outdoor",
    defaultRoot: "ground",
    waterBaseDays: 7,
    description: "Flowering shrub; feeding and deadheading can matter."
  },
  {
    id: "custom",
    label: "Unknown / custom plant",
    category: "custom",
    defaultPlacement: "outdoor",
    defaultRoot: "pot",
    waterBaseDays: 10,
    description: "Conservative generic care rules until better identified."
  }
];

const SOURCES = {
  rhs_watering: {
    id: "rhs_watering",
    name: "RHS: watering",
    url: "https://www.rhs.org.uk/garden-jobs/watering",
    claim: "Water according to plant need, weather and soil rather than on a fixed automatic schedule."
  },
  rhs_lawns: {
    id: "rhs_lawns",
    name: "RHS: lawns",
    url: "https://www.rhs.org.uk/lawns",
    claim: "Lawn tasks such as mowing and seasonal maintenance depend on active growth and conditions."
  },
  rhs_pruning: {
    id: "rhs_pruning",
    name: "RHS: pruning",
    url: "https://www.rhs.org.uk/plants/types/trees/pruning-guide",
    claim: "Pruning timing and intensity must be species-aware and season-aware."
  },
  rhs_hedges: {
    id: "rhs_hedges",
    name: "RHS: hedges",
    url: "https://www.rhs.org.uk/plants/types/hedges",
    claim: "Hedge trimming and maintenance depend on species, season and wildlife constraints."
  },
  extension_water: {
    id: "extension_water",
    name: "Extension: watering trees/shrubs",
    url: "https://extension.umn.edu/planting-and-growing-guides/watering-newly-planted-trees-and-shrubs",
    claim: "New and young woody plants need establishment watering in dry periods."
  },
  extension_houseplants: {
    id: "extension_houseplants",
    name: "Extension: houseplants",
    url: "https://extension.umn.edu/product-and-houseplant-pests/houseplant-insect-control",
    claim: "Regular inspection helps identify pest issues on indoor plants early."
  },
  mbg_houseplants: {
    id: "mbg_houseplants",
    name: "Missouri Botanical Garden: houseplants",
    url: "https://www.missouribotanicalgarden.org/",
    claim: "Houseplant care should consider light, substrate, water sensitivity and active growth."
  },
  trees_org: {
    id: "trees_org",
    name: "Arboricultural Association",
    url: "https://www.trees.org.uk/",
    claim: "Tree pruning and safety work should be conservative and appropriate to tree condition."
  }
};

const EVIDENCE_RULES = [
  {
    action: "watering",
    categories: ["all"],
    rule: "Watering is adjusted by rainfall, temperature, soil/substrate, container and growth stage.",
    sources: ["rhs_watering", "extension_water"]
  },
  {
    action: "watering",
    categories: ["houseplant"],
    rule: "Houseplants should be checked before watering; overwatering risk increases in low light or slow growth.",
    sources: ["rhs_watering", "mbg_houseplants"]
  },
  {
    action: "mowing",
    categories: ["lawn"],
    rule: "Mowing is scheduled in active growth and softened during drought or heat stress.",
    sources: ["rhs_lawns", "rhs_watering"]
  },
  {
    action: "feeding",
    categories: ["lawn", "houseplant", "shrub"],
    rule: "Feeding is concentrated during active growth and avoided during severe stress or dormancy.",
    sources: ["rhs_lawns", "mbg_houseplants"]
  },
  {
    action: "pruning",
    categories: ["tree"],
    rule: "Tree pruning is conservative, species-aware and generally safer outside severe heat/frost stress.",
    sources: ["rhs_pruning", "trees_org"]
  },
  {
    action: "pruning",
    categories: ["hedge"],
    rule: "Hedge trimming is seasonal and should account for species and wildlife constraints.",
    sources: ["rhs_hedges", "rhs_pruning"]
  },
  {
    action: "pruning",
    categories: ["shrub"],
    rule: "Shrub pruning/deadheading depends on season and plant response.",
    sources: ["rhs_pruning", "rhs_watering"]
  },
  {
    action: "mulching",
    categories: ["tree", "hedge", "shrub"],
    rule: "Mulching conserves moisture and suppresses weeds, but should be kept away from stems/trunks.",
    sources: ["rhs_watering", "extension_water"]
  },
  {
    action: "repotting",
    categories: ["houseplant"],
    rule: "Repot only when needed, preferably during active growth, and avoid excessive pot-size jumps.",
    sources: ["mbg_houseplants", "rhs_watering"]
  },
  {
    action: "pest_check",
    categories: ["all"],
    rule: "Regular inspection catches pests and disease earlier than waiting for severe symptoms.",
    sources: ["extension_houseplants", "rhs_watering"]
  },
  {
    action: "inspection",
    categories: ["all"],
    rule: "General inspection grounds the schedule in real plant condition rather than fixed dates alone.",
    sources: ["rhs_watering", "extension_water"]
  }
];

function getProfile(id) {
  return PLANT_TYPES.find((p) => p.id === id) || PLANT_TYPES.find((p) => p.id === "custom");
}

function getEvidence(category, action) {
  const matching = EVIDENCE_RULES.filter((rule) =>
    rule.action === action && (rule.categories.includes(category) || rule.categories.includes("all"))
  );
  const fallback = EVIDENCE_RULES.filter((rule) => rule.action === action && rule.categories.includes("all"));
  const rules = matching.length ? matching : fallback;
  const sourceIds = [...new Set(rules.flatMap((rule) => rule.sources))];
  const sources = sourceIds.map((id) => SOURCES[id]).filter(Boolean);
  return { ok: sources.length >= 2, rules, sources };
}

function seasonFor(lat, monthIndex) {
  const north = Number(lat) >= 0;
  const month = monthIndex + 1;
  if (north) {
    if ([12, 1, 2].includes(month)) return "winter";
    if ([3, 4, 5].includes(month)) return "spring";
    if ([6, 7, 8].includes(month)) return "summer";
    return "autumn";
  }
  if ([12, 1, 2].includes(month)) return "summer";
  if ([3, 4, 5].includes(month)) return "autumn";
  if ([6, 7, 8].includes(month)) return "winter";
  return "spring";
}

async function searchLocations(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Location search failed");
  return response.json();
}

async function loadClimate(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}` +
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max" +
    "&forecast_days=7&timezone=auto";

  const response = await fetch(url);
  if (!response.ok) throw new Error("Climate forecast failed");
  const data = await response.json();

  const daily = data.daily || {};
  const maxes = daily.temperature_2m_max || [];
  const mins = daily.temperature_2m_min || [];
  const rain = daily.precipitation_sum || [];
  const wind = daily.wind_speed_10m_max || [];

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length : 0);
  const sum = (arr) => arr.reduce((a, b) => a + Number(b || 0), 0);

  const avgMaxC = round(avg(maxes));
  const avgMinC = round(avg(mins));
  const rain7 = round(sum(rain));
  const avgRainPerDay = round(avg(rain));
  const maxWind = round(Math.max(0, ...wind.map(Number)));
  const season = seasonFor(lat, new Date().getMonth());

  return {
    timezone: data.timezone || "auto",
    avgMaxC,
    avgMinC,
    rain7,
    avgRainPerDay,
    maxWind,
    season,
    droughtRisk: rain7 < 8 && avgMaxC > 20,
    heatStress: avgMaxC >= 28,
    frostRisk: avgMinC <= 1,
    wetWeek: rain7 >= 25,
    windy: maxWind >= 35,
    fetchedAt: new Date().toISOString()
  };
}

async function setLocation(location) {
  state.location = location;
  saveState();
  renderLocation();

  setStatus("Loading climate…", "warning");
  try {
    state.climate = await loadClimate(location.lat, location.lon);
    saveState();
    renderLocation();
    setStatus("Climate loaded", "ok");
  } catch (error) {
    console.error(error);
    state.climate = null;
    saveState();
    renderLocation();
    setStatus("Climate failed", "danger");
  }
}

function buildSchedule() {
  if (!state.location || !state.climate || !state.plants.length) {
    state.lastSchedule = [];
    saveState();
    return [];
  }

  const start = today();
  const horizon = Number(els.scheduleHorizon.value || 30);
  const end = addDays(start, horizon);

  let tasks = [];
  for (const plant of state.plants) {
    tasks.push(...tasksForPlant(plant, start, end));
  }

  const plantFilter = els.filterPlant.value;
  const taskFilter = els.filterTask.value;

  tasks = tasks
    .filter((task) => plantFilter === "all" || task.plantId === plantFilter)
    .filter((task) => taskFilter === "all" || task.action === taskFilter)
    .sort((a, b) => a.date.localeCompare(b.date) || a.plantName.localeCompare(b.plantName));

  state.lastSchedule = tasks;
  saveState();
  return tasks;
}

function tasksForPlant(plant, start, end) {
  const profile = getProfile(plant.typeId);
  const category = profile.category;
  const climate = state.climate;
  const season = climate.season;
  const tasks = [];

  addWateringTasks(tasks, plant, profile, start, end);

  addRecurringTask(tasks, plant, {
    action: "pest_check",
    title: "Pest / disease check",
    intervalDays: category === "houseplant" ? 14 : 21,
    start,
    end,
    detail: "Check leaves, stems, soil/substrate surface and new growth. Act early if pests, spotting, mildew, cankers or dieback appear.",
    reason: "Preventive inspection is low-risk and catches issues before they become severe."
  });

  addRecurringTask(tasks, plant, {
    action: "inspection",
    title: "General health inspection",
    intervalDays: category === "tree" ? 30 : 21,
    start,
    end,
    detail: "Check colour, wilting, new growth, drainage, weeds, physical damage and whether the plant has changed since last check.",
    reason: "Good care depends on observation, not fixed dates alone."
  });

  if (category === "lawn") addLawnTasks(tasks, plant, start, end, climate, season);
  if (category === "houseplant") addHouseplantTasks(tasks, plant, start, end, climate, season);
  if (category === "tree") addTreeTasks(tasks, plant, start, end, climate, season);
  if (category === "hedge") addHedgeTasks(tasks, plant, start, end, climate, season);
  if (category === "shrub") addShrubTasks(tasks, plant, start, end, climate, season);

  return tasks.map((task) => attachEvidence(task, category));
}

function addWateringTasks(tasks, plant, profile, start, end) {
  const climate = state.climate;
  const category = profile.category;
  const season = climate.season;
  let interval = profile.waterBaseDays || 10;
  const reasons = [];

  if (plant.rootEnv === "pot") {
    interval *= 0.75;
    reasons.push("pots/containers dry faster than open ground");
  }
  if (plant.rootEnv === "raised_bed") {
    interval *= 0.88;
    reasons.push("raised beds often drain/dry faster");
  }
  if (plant.size === "small") {
    interval *= 0.88;
    reasons.push("small root volumes dry faster");
  }
  if (plant.size === "large") {
    interval *= 1.12;
    reasons.push("larger established root systems often tolerate longer intervals");
  }
  if (plant.age === "new") {
    interval *= 0.72;
    reasons.push("new/recently planted specimens need closer moisture monitoring");
  }
  if (plant.age === "young") {
    interval *= 0.88;
    reasons.push("young plants are still establishing");
  }
  if (plant.soil === "dry") {
    interval *= 0.84;
    reasons.push("fast-draining substrate dries faster");
  }
  if (plant.soil === "retentive") {
    interval *= 1.24;
    reasons.push("retentive soil holds moisture longer");
  }
  if (plant.light === "full_sun") {
    interval *= 0.85;
    reasons.push("full sun increases water demand");
  }

  if (plant.placement !== "indoor") {
    if (climate.wetWeek) {
      interval *= 1.75;
      reasons.push(`forecast rainfall is high (${climate.rain7}mm over 7 days)`);
    }
    if (climate.droughtRisk) {
      interval *= 0.70;
      reasons.push("warm/dry forecast increases drought risk");
    }
    if (climate.heatStress) {
      interval *= 0.82;
      reasons.push("heat stress risk is elevated");
    }
    if (climate.frostRisk) {
      interval *= 2.0;
      reasons.push("near-freezing nights reduce water demand and increase damage risk");
    }
    if (season === "winter" && category !== "houseplant") {
      interval *= 1.55;
      reasons.push("outdoor winter growth is slower");
    }
  } else if (plant.light === "low") {
    interval *= 1.25;
    reasons.push("low indoor light usually slows water use");
  }

  interval = Math.max(3, Math.min(30, Math.round(interval)));

  if (category === "lawn" && !climate.droughtRisk && climate.rain7 >= 8) {
    tasks.push(makeTask(plant, {
      action: "watering",
      title: "Check lawn moisture; watering likely not needed",
      date: isoDate(start),
      detail: "Do not water automatically. Water only if grass shows drought stress, footprints remain visible, or soil is dry below the surface.",
      reason: `Forecast rain (${climate.rain7}mm over 7 days) means routine lawn watering is probably unnecessary.`
    }));
    return;
  }

  addRecurringTask(tasks, plant, {
    action: "watering",
    title: "Check moisture / water if needed",
    intervalDays: interval,
    start,
    end,
    detail: plant.placement === "indoor"
      ? `Check the top layer/substrate before watering. If dry, water thoroughly and drain excess. Suggested check interval: about ${interval} days.`
      : `Check soil moisture before watering. If dry, water deeply rather than sprinkling lightly. Suggested check interval: about ${interval} days.`,
    reason: reasons.length ? reasons.join("; ") + "." : "Base interval from plant profile."
  });
}

function addLawnTasks(tasks, plant, start, end, climate, season) {
  if (season !== "winter" && !climate.frostRisk) {
    addRecurringTask(tasks, plant, {
      action: "mowing",
      title: "Mow lawn",
      intervalDays: climate.droughtRisk ? 10 : 7,
      start,
      end,
      detail: climate.droughtRisk
        ? "Mow less aggressively and raise the cut height because drought stress is possible."
        : "Mow during active growth. Avoid cutting too short.",
      reason: climate.droughtRisk ? "Warm/dry weather means lawn stress risk." : "Current season supports active grass growth."
    });
  }

  if (["spring", "autumn"].includes(season)) {
    tasks.push(makeTask(plant, {
      action: "feeding",
      title: "Seasonal lawn feed check",
      date: isoDate(start),
      detail: "Consider a season-appropriate lawn feed only if grass is actively growing and not drought-stressed.",
      reason: `${season} is a common lawn-feeding window, but feeding should be avoided during drought or frost stress.`
    }));

    tasks.push(makeTask(plant, {
      action: "inspection",
      title: "Aeration / compaction check",
      date: isoDate(addDays(start, 3)),
      detail: "Check compacted areas, puddling, moss and thin patches. Aerate only if conditions are suitable.",
      reason: `${season} is a useful period to assess lawn structure and recovery.`
    }));
  }
}

function addHouseplantTasks(tasks, plant, start, end, climate, season) {
  if (["spring", "summer"].includes(season)) {
    addRecurringTask(tasks, plant, {
      action: "feeding",
      title: "Feed lightly",
      intervalDays: 28,
      start,
      end,
      detail: "Use suitable houseplant feed at conservative strength during active growth. Skip if stressed or recently repotted.",
      reason: "Houseplants usually need more nutrients during active growth."
    });

    tasks.push(makeTask(plant, {
      action: "repotting",
      title: "Check if repotting is needed",
      date: isoDate(addDays(start, 5)),
      detail: "Repot only if rootbound, unstable or substrate has degraded. Increase pot size gradually.",
      reason: `${season} is generally better for repotting than winter dormancy.`
    }));
  } else {
    tasks.push(makeTask(plant, {
      action: "inspection",
      title: "Winter indoor care check",
      date: isoDate(addDays(start, 5)),
      detail: "Check for low light, cold draughts, dry air, overwatering and pests. Reduce feed and water demand in lower light.",
      reason: "Indoor winter decline is often caused by low light plus overwatering."
    }));
  }
}

function addTreeTasks(tasks, plant, start, end, climate, season) {
  if (["spring", "autumn"].includes(season)) {
    tasks.push(makeTask(plant, {
      action: "mulching",
      title: "Mulch tree base",
      date: isoDate(addDays(start, 4)),
      detail: "Apply a modest mulch ring if needed, keeping mulch away from the trunk flare.",
      reason: `${season} mulching can conserve moisture and reduce weed competition.`
    }));
  }

  if (season === "winter" && !climate.frostRisk) {
    tasks.push(makeTask(plant, {
      action: "pruning",
      title: "Assess dormant pruning",
      date: isoDate(addDays(start, 7)),
      detail: "Only prune if species-appropriate. Prioritise dead, damaged, crossing or unsafe branches. Avoid heavy pruning.",
      reason: "Many deciduous trees tolerate structural pruning better during dormancy, but species matters."
    }));
  }

  if (climate.droughtRisk || plant.age === "new" || plant.age === "young") {
    addRecurringTask(tasks, plant, {
      action: "watering",
      title: "Deep water tree if dry",
      intervalDays: climate.droughtRisk ? 7 : 14,
      start,
      end,
      detail: "For young/recently planted trees, water deeply around the root zone if soil is dry. Avoid watering against the trunk.",
      reason: plant.age === "mature" ? "Dry forecast creates supplemental watering risk." : "Young/recent trees need establishment watering in dry periods."
    });
  }
}

function addHedgeTasks(tasks, plant, start, end, climate, season) {
  if (["spring", "summer"].includes(season) && !climate.heatStress) {
    tasks.push(makeTask(plant, {
      action: "pruning",
      title: "Trim hedge / shape lightly",
      date: isoDate(addDays(start, 7)),
      detail: "Trim only if species-appropriate and check for nesting birds/wildlife. Avoid hard trimming during heat stress.",
      reason: `${season} is a common hedge maintenance window, but species and wildlife constraints matter.`
    }));
  }

  if (["spring", "autumn"].includes(season)) {
    tasks.push(makeTask(plant, {
      action: "mulching",
      title: "Mulch hedge base",
      date: isoDate(addDays(start, 4)),
      detail: "Mulch lightly along the base if soil is dry or weedy. Keep mulch away from stems.",
      reason: `${season} mulching can help moisture retention and establishment.`
    }));
  }
}

function addShrubTasks(tasks, plant, start, end, climate, season) {
  if (["spring", "summer"].includes(season)) {
    addRecurringTask(tasks, plant, {
      action: "pruning",
      title: "Deadhead / light prune",
      intervalDays: 21,
      start,
      end,
      detail: "Remove spent flowers or dead/damaged growth if appropriate. Avoid hard pruning unless species-specific timing is known.",
      reason: "Many flowering shrubs benefit from light maintenance during active growth."
    });

    tasks.push(makeTask(plant, {
      action: "feeding",
      title: "Feed if actively growing",
      date: isoDate(addDays(start, 3)),
      detail: "Use a suitable feed only if the plant is actively growing and not drought-stressed.",
      reason: "Feeding is most useful when growth is active."
    }));
  }
}

function addRecurringTask(tasks, plant, config) {
  for (let d = new Date(config.start); d <= config.end; d = addDays(d, config.intervalDays)) {
    tasks.push(makeTask(plant, { ...config, date: isoDate(d) }));
  }
}

function makeTask(plant, config) {
  return {
    id: `${plant.id}:${config.action}:${config.date}:${config.title}`,
    plantId: plant.id,
    plantName: plant.name,
    plantType: plant.typeId,
    action: config.action,
    title: config.title,
    date: config.date,
    detail: config.detail || "",
    reason: config.reason || "",
    createdAt: new Date().toISOString()
  };
}

function attachEvidence(task, category) {
  const evidence = getEvidence(category, task.action);
  return { ...task, evidence };
}

function renderLocation() {
  if (!state.location) {
    els.locationBadge.textContent = "Not set";
    els.locationBadge.className = "chip";
    els.climateSummary.textContent = "No climate data loaded yet.";
    els.metricClimate.textContent = "No";
    return;
  }

  els.locationBadge.textContent = state.location.name;
  els.locationBadge.className = state.climate ? "chip ok" : "chip warning";

  if (!state.climate) {
    els.climateSummary.textContent = `${state.location.name} selected, but no climate data loaded.`;
    els.metricClimate.textContent = "No";
    return;
  }

  const c = state.climate;
  els.metricClimate.textContent = "Yes";
  els.climateSummary.innerHTML = `
    <strong>${escapeHtml(state.location.name)}</strong><br>
    Season: ${escapeHtml(c.season)} · Avg max: ${c.avgMaxC}°C · Avg min: ${c.avgMinC}°C · Rain next 7d: ${c.rain7}mm · Max wind: ${c.maxWind} km/h<br>
    Climate flags: ${flagText(c)}
  `;
}

function flagText(c) {
  const flags = [];
  if (c.droughtRisk) flags.push("drought risk");
  if (c.heatStress) flags.push("heat stress");
  if (c.frostRisk) flags.push("frost risk");
  if (c.wetWeek) flags.push("wet week");
  if (c.windy) flags.push("windy");
  return flags.length ? flags.join(", ") : "normal";
}

function renderPlantTypeOptions() {
  els.plantType.innerHTML = "";
  for (const type of PLANT_TYPES) {
    const opt = document.createElement("option");
    opt.value = type.id;
    opt.textContent = type.label;
    els.plantType.appendChild(opt);
  }
}

function renderPlants() {
  els.metricPlants.textContent = String(state.plants.length);
  els.plantList.innerHTML = "";

  if (!state.plants.length) {
    els.plantList.innerHTML = `<div class="callout muted">No plants yet. Add one above or click “Add examples”.</div>`;
    renderPlantFilter();
    return;
  }

  for (const plant of state.plants) {
    const profile = getProfile(plant.typeId);
    const card = document.createElement("div");
    card.className = "plant-card";
    card.innerHTML = `
      <div>
        <strong>${escapeHtml(plant.name)}</strong>
        <div class="meta">
          ${escapeHtml(profile.label)} · ${escapeHtml(profile.category)} · ${escapeHtml(plant.placement)} · ${escapeHtml(plant.rootEnv)} · ${escapeHtml(plant.size)} · ${escapeHtml(plant.age)}
          ${plant.notes ? `<br>Notes: ${escapeHtml(plant.notes)}` : ""}
        </div>
      </div>
      <button class="btn ghost small-btn" type="button" data-remove="${plant.id}">Remove</button>
    `;
    card.querySelector("[data-remove]").addEventListener("click", () => {
      state.plants = state.plants.filter((p) => p.id !== plant.id);
      state.doneTasks = {};
      saveState();
      renderAll();
    });
    els.plantList.appendChild(card);
  }

  renderPlantFilter();
}

function renderPlantFilter() {
  const current = els.filterPlant.value || "all";
  els.filterPlant.innerHTML = `<option value="all">All plants</option>`;
  for (const plant of state.plants) {
    const opt = document.createElement("option");
    opt.value = plant.id;
    opt.textContent = plant.name;
    els.filterPlant.appendChild(opt);
  }
  if ([...els.filterPlant.options].some((o) => o.value === current)) els.filterPlant.value = current;
}

function renderSchedule(tasks = state.lastSchedule || []) {
  els.metricTasks.textContent = String(tasks.length);
  els.scheduleBadge.textContent = tasks.length ? `${tasks.length} tasks` : "Not generated";
  els.scheduleBadge.className = tasks.length ? "chip ok" : "chip";

  const todayTasks = tasks.filter((t) => daysUntil(t.date) === 0).length;
  const weekTasks = tasks.filter((t) => {
    const d = daysUntil(t.date);
    return d >= 0 && d <= 7;
  }).length;
  const sourceChecked = tasks.filter((t) => t.evidence?.ok).length;
  const watering = tasks.filter((t) => t.action === "watering").length;

  els.scheduleStats.innerHTML = `
    <div class="stat-tile"><strong>${tasks.length}</strong><span>Total tasks</span></div>
    <div class="stat-tile"><strong>${todayTasks}</strong><span>Due today</span></div>
    <div class="stat-tile"><strong>${weekTasks}</strong><span>Due in 7 days</span></div>
    <div class="stat-tile"><strong>${sourceChecked}</strong><span>Source-checked</span></div>
  `;

  els.scheduleList.innerHTML = "";

  if (!tasks.length) {
    els.scheduleList.innerHTML = `<div class="callout muted">No tasks to show. Set location, add plants, then build the schedule.</div>`;
    return;
  }

  for (const task of tasks) {
    const done = !!state.doneTasks[task.id];
    const due = daysUntil(task.date);
    const dueLabel = due === 0 ? "Today" : due > 0 ? `In ${due}d` : `${Math.abs(due)}d overdue`;
    const evidence = task.evidence || { ok: false, sources: [], rules: [] };
    const category = getProfile(state.plants.find((p) => p.id === task.plantId)?.typeId).category;

    const taskEl = document.createElement("div");
    taskEl.className = `task-card ${done ? "done" : ""}`;
    taskEl.innerHTML = `
      <input class="checkbox" type="checkbox" ${done ? "checked" : ""} aria-label="Mark ${escapeHtml(task.title)} as done">
      <div>
        <div class="task-date">${escapeHtml(task.date)} · ${escapeHtml(dueLabel)}</div>
        <div class="task-title">${escapeHtml(task.plantName)} — ${escapeHtml(task.title)}</div>
        <div class="task-detail">${escapeHtml(task.detail)}</div>
        <div class="task-reason"><strong>Why:</strong> ${escapeHtml(task.reason)}</div>
        <div class="badge-row">
          <span class="badge ${evidence.ok ? "ok" : "warning"}">${evidence.ok ? "Cross-check OK" : "Needs more evidence"}</span>
          <span class="badge">${escapeHtml(task.action)}</span>
          <span class="badge">${escapeHtml(category)}</span>
          ${(evidence.sources || []).map((s) => `<a class="badge ok" href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer">${escapeHtml(s.name)}</a>`).join("")}
        </div>
        ${evidence.rules?.length ? `<div class="task-detail"><strong>Evidence rule:</strong> ${escapeHtml(evidence.rules[0].rule)}</div>` : ""}
      </div>
      <button class="btn ghost small-btn" type="button" data-snooze="${escapeHtml(task.id)}">+7d</button>
    `;

    taskEl.querySelector(".checkbox").addEventListener("change", (event) => {
      state.doneTasks[task.id] = event.target.checked;
      saveState();
      taskEl.classList.toggle("done", event.target.checked);
    });

    taskEl.querySelector("[data-snooze]").addEventListener("click", () => {
      task.date = isoDate(addDays(new Date(task.date + "T00:00:00"), 7));
      state.lastSchedule = state.lastSchedule.map((t) => (t.id === task.id ? task : t));
      saveState();
      renderSchedule(state.lastSchedule);
    });

    els.scheduleList.appendChild(taskEl);
  }
}

function renderAll() {
  renderLocation();
  renderPlants();
  renderSchedule(state.lastSchedule || []);
}

function addChatMessage(role, text) {
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  div.textContent = text;
  els.chatLog.appendChild(div);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

async function callJsonApi(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
  return data;
}

async function resizeImageToDataUrl(file, maxSide = 1280, quality = 0.82) {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = objectUrl;
  });

  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(objectUrl);

  return canvas.toDataURL("image/jpeg", quality);
}

function applyProfileDefaults() {
  const profile = getProfile(els.plantType.value);
  els.placement.value = profile.defaultPlacement || "outdoor";
  els.rootEnv.value = profile.defaultRoot || "ground";
}

function addPlantFromForm(nameOverride = "") {
  const profile = getProfile(els.plantType.value);
  const name = (nameOverride || els.plantName.value || profile.label).trim();
  if (!name) return;

  const plant = {
    id: uid(),
    typeId: profile.id,
    name,
    placement: els.placement.value,
    rootEnv: els.rootEnv.value,
    size: els.plantSize.value,
    age: els.plantAge.value,
    light: els.light.value,
    soil: els.soil.value,
    notes: els.plantNotes.value.trim(),
    createdAt: new Date().toISOString()
  };

  state.plants.unshift(plant);
  state.doneTasks = {};
  state.lastSchedule = [];
  saveState();

  els.plantName.value = "";
  els.plantNotes.value = "";
  renderAll();
}

function addSamplePlants() {
  const samples = [
    { typeId: "lawn_cool", name: "Front lawn", placement: "outdoor", rootEnv: "ground", size: "large", age: "mature", light: "full_sun", soil: "normal", notes: "High traffic near path" },
    { typeId: "monstera", name: "Kitchen monstera", placement: "indoor", rootEnv: "pot", size: "medium", age: "young", light: "bright", soil: "normal", notes: "Near east-facing window" },
    { typeId: "beech_hedge", name: "Driveway beech hedge", placement: "outdoor", rootEnv: "ground", size: "large", age: "mature", light: "medium", soil: "retentive", notes: "Trimmed last summer" },
    { typeId: "apple_tree", name: "Back garden apple tree", placement: "outdoor", rootEnv: "ground", size: "large", age: "mature", light: "full_sun", soil: "normal", notes: "Some aphids last year" }
  ];
  state.plants = samples.map((s) => ({ ...s, id: uid(), createdAt: new Date().toISOString() }));
  state.doneTasks = {};
  state.lastSchedule = [];
  saveState();
  renderAll();
}

function exportCsv(tasks) {
  const rows = [["date", "plant", "task", "detail", "reason", "sources"].join(",")];
  for (const t of tasks) {
    rows.push([
      csv(t.date),
      csv(t.plantName),
      csv(t.title),
      csv(t.detail),
      csv(t.reason),
      csv((t.evidence?.sources || []).map((s) => s.name).join(" | "))
    ].join(","));
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantcare-schedule.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function csv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function wireEvents() {
  els.plantType.addEventListener("change", applyProfileDefaults);

  els.btnSearchLocation.addEventListener("click", async () => {
    const query = els.locationSearch.value.trim();
    if (!query) return;
    setStatus("Searching…", "warning");
    els.locationResults.innerHTML = "";
    try {
      const data = await searchLocations(query);
      const results = data.results || [];
      if (!results.length) {
        els.locationResults.innerHTML = `<div class="callout muted">No matching locations found.</div>`;
        setStatus("Ready");
        return;
      }
      for (const result of results) {
        const name = `${result.name}${result.admin1 ? ", " + result.admin1 : ""}${result.country ? ", " + result.country : ""}`;
        const card = document.createElement("div");
        card.className = "result-card";
        card.innerHTML = `
          <strong>${escapeHtml(name)}</strong>
          <div class="meta">${round(result.latitude, 4)}, ${round(result.longitude, 4)} · ${escapeHtml(result.timezone || "")}</div>
          <div class="button-row"><button class="btn primary small-btn" type="button">Use this location</button></div>
        `;
        card.querySelector("button").addEventListener("click", () => setLocation({
          name,
          lat: result.latitude,
          lon: result.longitude,
          timezone: result.timezone || "auto"
        }));
        els.locationResults.appendChild(card);
      }
      setStatus("Ready");
    } catch (error) {
      console.error(error);
      els.locationResults.innerHTML = `<div class="callout muted">Location search failed.</div>`;
      setStatus("Search failed", "danger");
    }
  });

  els.locationSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") els.btnSearchLocation.click();
  });

  els.btnUseBrowserLocation.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Browser geolocation is not available.");
      return;
    }
    setStatus("Locating…", "warning");
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({
        name: "Current browser location",
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        timezone: "auto"
      }),
      () => setStatus("Location denied", "danger"),
      { enableHighAccuracy: false, timeout: 12000 }
    );
  });

  els.btnAddPlant.addEventListener("click", () => addPlantFromForm());
  els.btnAddSamples.addEventListener("click", addSamplePlants);
  els.btnClearPlants.addEventListener("click", () => {
    if (!confirm("Clear all plants?")) return;
    state.plants = [];
    state.doneTasks = {};
    state.lastSchedule = [];
    saveState();
    renderAll();
  });

  els.btnBuildSchedule.addEventListener("click", () => {
    if (!state.location || !state.climate) {
      alert("Set a location first.");
      return;
    }
    if (!state.plants.length) {
      alert("Add at least one plant first.");
      return;
    }
    const tasks = buildSchedule();
    renderSchedule(tasks);
    setStatus("Schedule built", "ok");
  });

  els.scheduleHorizon.addEventListener("change", () => renderSchedule(buildSchedule()));
  els.filterPlant.addEventListener("change", () => renderSchedule(buildSchedule()));
  els.filterTask.addEventListener("change", () => renderSchedule(buildSchedule()));

  els.btnExportCsv.addEventListener("click", () => exportCsv(state.lastSchedule || []));

  els.btnIdentifyPlant.addEventListener("click", async () => {
    const file = els.photoInput.files?.[0];
    if (!file) {
      alert("Choose a plant image first.");
      return;
    }
    els.identifyOutput.innerHTML = `<div class="callout muted">Preparing image and asking AI…</div>`;
    els.btnUseCandidate.disabled = true;
    setStatus("Identifying…", "warning");
    try {
      const imageDataUrl = await resizeImageToDataUrl(file);
      const result = await callJsonApi("/api/identify-plant", {
        imageDataUrl,
        location: state.location,
        climate: state.climate
      });
      state.lastIdentification = result;
      saveState();
      renderIdentification(result);
      setStatus("Identified", "ok");
    } catch (error) {
      console.error(error);
      els.identifyOutput.innerHTML = `<div class="callout muted">${escapeHtml(error.message)}</div>`;
      setStatus("AI failed", "danger");
    }
  });

  els.btnUseCandidate.addEventListener("click", () => {
    const candidate = state.lastIdentification?.candidates?.[0];
    if (!candidate) return;
    els.plantName.value = candidate.common_name || candidate.scientific_name || "Unknown plant";
    els.plantType.value = "custom";
    applyProfileDefaults();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  els.btnSendChat.addEventListener("click", sendChat);
  els.chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendChat();
  });

  els.btnResetAll.addEventListener("click", () => {
    if (!confirm("Reset all local demo data?")) return;
    state = structuredClone(DEFAULT_STATE);
    saveState();
    renderAll();
    els.identifyOutput.innerHTML = "";
    els.chatLog.innerHTML = "";
    setStatus("Reset", "ok");
  });
}

async function sendChat() {
  const message = els.chatInput.value.trim();
  if (!message) return;
  els.chatInput.value = "";
  addChatMessage("user", message);
  setStatus("AI thinking…", "warning");

  try {
    const result = await callJsonApi("/api/chat", {
      message,
      context: {
        location: state.location,
        climate: state.climate,
        plants: state.plants,
        visibleSchedule: state.lastSchedule?.slice(0, 80) || [],
        sourcePolicy: "Use climate-aware reasoning. If making a maintenance recommendation, say what it depends on and whether it matches the current forecast/season."
      }
    });
    addChatMessage("assistant", result.text || "No response returned.");
    setStatus("Ready", "ok");
  } catch (error) {
    console.error(error);
    addChatMessage("assistant", `Error: ${error.message}`);
    setStatus("AI failed", "danger");
  }
}

function renderIdentification(result) {
  const candidates = result.candidates || [];
  els.btnUseCandidate.disabled = !candidates.length;
  els.identifyOutput.innerHTML = "";

  if (!candidates.length) {
    els.identifyOutput.innerHTML = `<div class="callout muted">No candidates returned.</div>`;
    return;
  }

  const summary = document.createElement("div");
  summary.className = "callout";
  summary.innerHTML = `
    <strong>Identification result</strong>
    <div class="meta">AI plant identification is probabilistic. Use these as candidates to confirm, not a definitive diagnosis.</div>
  `;
  els.identifyOutput.appendChild(summary);

  candidates.forEach((candidate, index) => {
    const card = document.createElement("div");
    card.className = "result-card";
    const confidence = Math.round(Number(candidate.confidence || 0) * 100);
    card.innerHTML = `
      <strong>${index + 1}. ${escapeHtml(candidate.common_name || "Unknown common name")} ${candidate.scientific_name ? `<em>(${escapeHtml(candidate.scientific_name)})</em>` : ""}</strong>
      <div class="meta">Confidence: ${confidence}%</div>
      <div class="meta"><strong>Visual clues:</strong> ${(candidate.key_visual_cues || []).map(escapeHtml).join(" · ") || "Not specified"}</div>
      ${candidate.lookalikes?.length ? `<div class="meta"><strong>Lookalikes:</strong> ${candidate.lookalikes.map(escapeHtml).join(" · ")}</div>` : ""}
    `;
    els.identifyOutput.appendChild(card);
  });

  if (result.questions_to_confirm?.length) {
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `<strong>Questions to confirm</strong><div class="meta">${result.questions_to_confirm.map(escapeHtml).join(" · ")}</div>`;
    els.identifyOutput.appendChild(card);
  }

  if (result.safe_initial_care?.length || result.safety_notes?.length) {
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <strong>Safe initial care</strong>
      <div class="meta">${(result.safe_initial_care || []).map(escapeHtml).join(" · ")}</div>
      ${result.safety_notes?.length ? `<div class="meta"><strong>Safety:</strong> ${result.safety_notes.map(escapeHtml).join(" · ")}</div>` : ""}
    `;
    els.identifyOutput.appendChild(card);
  }
}

function init() {
  renderPlantTypeOptions();
  applyProfileDefaults();
  wireEvents();
  renderAll();
  if (!state.lastSchedule) state.lastSchedule = [];
  setStatus("Ready", "ok");
}

init();
