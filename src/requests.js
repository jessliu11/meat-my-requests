// formal request schema and a difficulty tier system 

// operator : keep small
export const OPS = {
    GTE: "GTE", // >=
    LTE: "LTE", // <=
    RANGE: "RANGE", // between min/max (inclusive)
    EQ: "EQ", // exact (use tolerance)
};

// what number are we checking? 
export const METRICS = {
    SOLD_WEIGHT: "SOLD_WEIGHT", // lbs sold
    SOLD_VALUE: "SOLD_VALUE", // $ sold
    REMAINING_WEIGHT: "REMAINING_WEIGHT", // lbs remaining
    REMAINING_VALUE: "REMAINING_VALUE", // $ remaining
};

// where do we measure it? 
export const SCOPES = {
    TOTAL: "TOTAL",
    MEAT: "MEAT",
    GROUP: "GROUP", // e.g., "red meats", "poultry", etc.
};

// personas
export const PERSONAS = {
    MANAGER: "manager",
    CUSTOMER: "customer",
    CHEF: "chef",
};

/**
 * @typedef {Object} Request
 * @property {"manager"|"customer"|"chef"} persona
 * @property {"TOTAL"|"MEAT"|"GROUP"} scope
 * @property {"SOLD_WEIGHT"|"SOLD_VALUE"|"REMAINING_WEIGHT"|"REMAINING_VALUE"} metric
 * @property {"GTE"|"LTE"|"RANGE"|"EQ"} op
 * @property {string=} meat            // required if scope === "MEAT"
 * @property {string[]=} meats         // required if scope === "GROUP" (array of meat keys)
 * @property {number=} target          // for GTE/LTE/EQ
 * @property {number=} min             // for RANGE
 * @property {number=} max             // for RANGE
 * @property {number=} tolerance       // for EQ (e.g., dollars ±2 or lbs ±0.5)
 * @property {Object=} meta            // optional: anything else (difficulty, text override, etc.)
 */

// difficulty tiers with request pols 
// ----- Pool templates -----
// Each template defines the "shape" of a request. generateRequest fills in meat/target numbers.
export const POOLS = {
  easy: {
    manager: [
      { scope: "TOTAL", metric: "SOLD_VALUE", op: "GTE" },
      { scope: "TOTAL", metric: "SOLD_WEIGHT", op: "GTE" },
    ],
    customer: [
      { scope: "MEAT", metric: "SOLD_WEIGHT", op: "GTE" },
      { scope: "TOTAL", metric: "SOLD_WEIGHT", op: "GTE" },
    ],
    chef: [
      { scope: "MEAT", metric: "REMAINING_WEIGHT", op: "GTE" },
      // optional easy-ish cap:
      // { scope: "MEAT", metric: "SOLD_WEIGHT", op: "LTE" },
    ],
  },

  medium: {
    manager: [
      { scope: "TOTAL", metric: "SOLD_VALUE", op: "GTE" },
      { scope: "TOTAL", metric: "SOLD_VALUE", op: "RANGE" },
      { scope: "TOTAL", metric: "SOLD_WEIGHT", op: "LTE" },
      { scope: "MEAT", metric: "SOLD_VALUE", op: "GTE" },
    ],
    customer: [
      { scope: "MEAT", metric: "SOLD_WEIGHT", op: "GTE" },
      { scope: "MEAT", metric: "SOLD_WEIGHT", op: "LTE" },
      { scope: "TOTAL", metric: "SOLD_WEIGHT", op: "RANGE" },
      { scope: "TOTAL", metric: "SOLD_VALUE", op: "RANGE" },
    ],
    chef: [
      { scope: "MEAT", metric: "REMAINING_WEIGHT", op: "GTE" },
      { scope: "MEAT", metric: "REMAINING_VALUE", op: "GTE" },
      { scope: "TOTAL", metric: "SOLD_WEIGHT", op: "LTE" },
    ],
  },

  hard: {
    manager: [
      { scope: "TOTAL", metric: "SOLD_VALUE", op: "RANGE" },
      { scope: "TOTAL", metric: "SOLD_VALUE", op: "EQ" },     // exact-ish $ with tolerance
      { scope: "MEAT", metric: "SOLD_VALUE", op: "GTE" },
      { scope: "TOTAL", metric: "SOLD_WEIGHT", op: "LTE" },
    ],
    customer: [
      { scope: "MEAT", metric: "SOLD_WEIGHT", op: "EQ" },     // exact-ish lbs with tolerance
      { scope: "MEAT", metric: "SOLD_WEIGHT", op: "RANGE" },
      { scope: "TOTAL", metric: "SOLD_VALUE", op: "RANGE" },
    ],
    chef: [
      { scope: "MEAT", metric: "REMAINING_WEIGHT", op: "GTE" },
      { scope: "MEAT", metric: "REMAINING_VALUE", op: "GTE" },
      { scope: "MEAT", metric: "SOLD_WEIGHT", op: "LTE" },    // cap a meat
      { scope: "TOTAL", metric: "SOLD_WEIGHT", op: "LTE" },
    ],
  },
};

// ----- helpers -----
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function pickOne(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Total possible revenue if you sold everything (used to scale manager targets)
function totalPossibleRevenue(state, meats) {
  let sum = 0;
  for (const m of meats) sum += state.round.inventory[m] * state.round.prices[m];
  return sum;
}

// Optional: total possible weight if sold everything
function totalPossibleWeight(state, meats) {
  let sum = 0;
  for (const m of meats) sum += state.round.inventory[m];
  return sum;
}

// ----- main generator -----
//
// opts:
/// - tier: "easy" | "medium" | "hard"
/// - preferredMeat: string | null   (for syncing across personas)
/// - syncChance: number            (if preferredMeat exists and scope is MEAT)
/// - step: number                  (lb increment, e.g. 1 or 0.5; used to pick targets)
export function generateRequest(persona, state, opts = {}) {
  const tier = opts.tier ?? "easy";
  const step = opts.step ?? 1;

  const poolForPersona = POOLS[tier]?.[persona];
  if (!poolForPersona || poolForPersona.length === 0) {
    throw new Error(`No request pool for persona="${persona}" tier="${tier}"`);
  }

  // choose a request "shape"
  const template = pickOne(poolForPersona);

  /** @type {any} */
  const request = {
    persona,
    scope: template.scope,
    metric: template.metric,
    op: template.op,
  };

  // choose meat if needed (MEAT scope)
  if (request.scope === "MEAT") {
    const preferredMeat = opts.preferredMeat ?? null;
    const syncChance = opts.syncChance ?? 0;

    if (preferredMeat && Math.random() < syncChance) {
      request.meat = preferredMeat;
    } else {
      request.meat = pickOne(Object.keys(state.round.inventory));
    }
  }

  // choose meats array if GROUP scope (not used yet, but reserved)
  if (request.scope === "GROUP") {
    request.meats = template.meats?.slice() ?? []; // you can extend later
  }

  // Fill in numbers based on scope/metric/op
  // We generate targets based on inventory/prices so requests feel fair and scale.
  const meats = Object.keys(state.round.inventory);

  // Helper: quantize to step (e.g., 0.5 or 1 lb)
  const quantize = (x) => Math.round(x / step) * step;

  // Target generation by category
  if (request.scope === "TOTAL" && request.metric === "SOLD_VALUE") {
    const possible = totalPossibleRevenue(state, meats);

    // tier-dependent ranges
    let minPct = 0.15, maxPct = 0.30;
    if (tier === "medium") { minPct = 0.20; maxPct = 0.40; }
    if (tier === "hard")   { minPct = 0.25; maxPct = 0.50; }

    if (request.op === "GTE") {
      request.target = Math.round(possible * randFloat(minPct, maxPct, 2));
    } else if (request.op === "RANGE") {
      const center = possible * randFloat(minPct, maxPct, 2);
      const width = center * (tier === "hard" ? 0.12 : 0.20); // tighter on hard
      request.min = Math.max(0, Math.round(center - width / 2));
      request.max = Math.max(request.min + 1, Math.round(center + width / 2));
    } else if (request.op === "EQ") {
      const center = possible * randFloat(minPct, maxPct, 2);
      request.target = Math.round(center);

      // tolerance: hard still needs some forgiveness
      request.tolerance = tier === "hard" ? 3 : 5; // dollars
    } else if (request.op === "LTE") {
      // Less common for manager but supported
      request.target = Math.round(possible * randFloat(0.20, 0.60, 2));
    }
  }

  if (request.scope === "TOTAL" && request.metric === "SOLD_WEIGHT") {
    const possible = totalPossibleWeight(state, meats);

    if (request.op === "GTE") {
      request.target = quantize(possible * randFloat(0.20, 0.50, 2));
    } else if (request.op === "LTE") {
      request.target = quantize(possible * randFloat(0.25, 0.60, 2));
    } else if (request.op === "RANGE") {
      const center = possible * randFloat(0.25, 0.55, 2);
      const width = possible * (tier === "hard" ? 0.18 : 0.28);
      request.min = quantize(center - width / 2);
      request.max = quantize(center + width / 2);
      if (request.max < request.min + step) request.max = request.min + step;
    } else if (request.op === "EQ") {
      request.target = quantize(possible * randFloat(0.25, 0.55, 2));
      request.tolerance = step; // e.g. ±1 lb if step=1
    }
  }

  if (request.scope === "MEAT") {
    const m = request.meat;
    const inv = state.round.inventory[m];
    const price = state.round.prices[m];

    // derived "possible" numbers for that meat
    const possibleSoldWeight = inv;
    const possibleSoldValue = inv * price;

    // Pick defaults for weight-based requests on MEAT
    if (request.metric === "SOLD_WEIGHT") {
      if (request.op === "GTE") {
        request.target = quantize(randFloat(0.20, 0.60, 2) * possibleSoldWeight);
        request.target = clamp(request.target, step, inv);
      } else if (request.op === "LTE") {
        request.target = quantize(randFloat(0.10, 0.50, 2) * possibleSoldWeight);
        request.target = clamp(request.target, 0, inv);
      } else if (request.op === "RANGE") {
        const center = randFloat(0.25, 0.65, 2) * possibleSoldWeight;
        const width = (tier === "hard" ? 0.25 : 0.35) * possibleSoldWeight;
        request.min = quantize(center - width / 2);
        request.max = quantize(center + width / 2);
        request.min = clamp(request.min, 0, inv);
        request.max = clamp(request.max, request.min + step, inv);
      } else if (request.op === "EQ") {
        request.target = quantize(randFloat(0.25, 0.70, 2) * possibleSoldWeight);
        request.target = clamp(request.target, step, inv);
        request.tolerance = tier === "hard" ? step : step * 2;
      }
    }

    // Value-based sold (manager-style meat-specific)
    if (request.metric === "SOLD_VALUE") {
      if (request.op === "GTE") {
        request.target = Math.round(randFloat(0.20, 0.60, 2) * possibleSoldValue);
        request.target = clamp(request.target, 1, Math.round(possibleSoldValue));
      } else if (request.op === "RANGE") {
        const center = randFloat(0.25, 0.70, 2) * possibleSoldValue;
        const width = (tier === "hard" ? 0.20 : 0.30) * possibleSoldValue;
        request.min = Math.max(0, Math.round(center - width / 2));
        request.max = Math.max(request.min + 1, Math.round(center + width / 2));
        request.max = Math.min(request.max, Math.round(possibleSoldValue));
      } else if (request.op === "EQ") {
        request.target = Math.round(randFloat(0.25, 0.70, 2) * possibleSoldValue);
        request.tolerance = tier === "hard" ? 2 : 4;
      }
    }

    // Chef: remaining constraints
    if (request.metric === "REMAINING_WEIGHT") {
      if (request.op === "GTE") {
        request.target = quantize(randFloat(0.20, 0.60, 2) * inv);
        request.target = clamp(request.target, 0, inv);
      } else if (request.op === "LTE") {
        request.target = quantize(randFloat(0.10, 0.50, 2) * inv);
        request.target = clamp(request.target, 0, inv);
      } else if (request.op === "RANGE") {
        const center = randFloat(0.25, 0.75, 2) * inv;
        const width = (tier === "hard" ? 0.25 : 0.35) * inv;
        request.min = quantize(center - width / 2);
        request.max = quantize(center + width / 2);
        request.min = clamp(request.min, 0, inv);
        request.max = clamp(request.max, request.min + step, inv);
      } else if (request.op === "EQ") {
        request.target = quantize(randFloat(0.20, 0.60, 2) * inv);
        request.tolerance = tier === "hard" ? step : step * 2;
      }
    }

    if (request.metric === "REMAINING_VALUE") {
      const possibleRemainValue = inv * price;

      if (request.op === "GTE") {
        request.target = Math.round(randFloat(0.20, 0.60, 2) * possibleRemainValue);
        request.target = clamp(request.target, 1, Math.round(possibleRemainValue));
      } else if (request.op === "RANGE") {
        const center = randFloat(0.25, 0.75, 2) * possibleRemainValue;
        const width = (tier === "hard" ? 0.20 : 0.30) * possibleRemainValue;
        request.min = Math.max(0, Math.round(center - width / 2));
        request.max = Math.max(request.min + 1, Math.round(center + width / 2));
        request.max = Math.min(request.max, Math.round(possibleRemainValue));
      } else if (request.op === "EQ") {
        request.target = Math.round(randFloat(0.20, 0.60, 2) * possibleRemainValue);
        request.tolerance = tier === "hard" ? 2 : 4;
      }
    }
  }

  // Final small safety guards:
  // Ensure numbers exist for the chosen op
  if (request.op === "GTE" || request.op === "LTE" || request.op === "EQ") {
    if (typeof request.target !== "number" || Number.isNaN(request.target)) {
      throw new Error(`Generated request missing target: ${JSON.stringify(request)}`);
    }
  }
  if (request.op === "RANGE") {
    if (typeof request.min !== "number" || typeof request.max !== "number") {
      throw new Error(`Generated RANGE request missing min/max: ${JSON.stringify(request)}`);
    }
    if (request.max < request.min) {
      const tmp = request.min;
      request.min = request.max;
      request.max = tmp;
    }
  }

  return request;
}

// requestGenerator.js (add near the bottom)

// Compute [min, max] allowed for "sold pounds" on a specific meat from a request.
// We interpret the request depending on metric:
// - if metric is SOLD_WEIGHT => it constrains sold pounds directly
// - if metric is REMAINING_WEIGHT => it constrains remaining pounds, which implies constraints on sold:
//     remaining = inv - sold
//     so remaining >= K  => sold <= inv - K
//     remaining <= K  => sold >= inv - K
function soldBoundsFromRequest(request, state, meat, step = 1) {
  const inv = state.round.inventory[meat];
  const tol = request.tolerance ?? 0;

  // default: no constraint
  let minSold = 0;
  let maxSold = inv;

  const quantize = (x) => Math.round(x / step) * step;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(x, hi));

  if (request.metric === "SOLD_WEIGHT") {
    if (request.op === "GTE") {
      minSold = request.target;
    } else if (request.op === "LTE") {
      maxSold = request.target;
    } else if (request.op === "RANGE") {
      minSold = request.min;
      maxSold = request.max;
    } else if (request.op === "EQ") {
      minSold = request.target - tol;
      maxSold = request.target + tol;
    }
  }

  if (request.metric === "REMAINING_WEIGHT") {
    // remaining = inv - sold
    // convert remaining constraints into sold constraints
    if (request.op === "GTE") {
      // remaining >= target => sold <= inv - target
      maxSold = inv - request.target;
    } else if (request.op === "LTE") {
      // remaining <= target => sold >= inv - target
      minSold = inv - request.target;
    } else if (request.op === "RANGE") {
      // remaining in [min,max] => sold in [inv-max, inv-min]
      minSold = inv - request.max;
      maxSold = inv - request.min;
    } else if (request.op === "EQ") {
      // remaining in [target-tol, target+tol] => sold in [inv-(target+tol), inv-(target-tol)]
      minSold = inv - (request.target + tol);
      maxSold = inv - (request.target - tol);
    }
  }

  // Normalize/quantize/clamp
  minSold = quantize(minSold);
  maxSold = quantize(maxSold);

  minSold = clamp(minSold, 0, inv);
  maxSold = clamp(maxSold, 0, inv);

  if (maxSold < minSold) {
    // impossible bounds (e.g. min > max)
    return { minSold: 1, maxSold: 0, inv }; // represent impossible
  }

  return { minSold, maxSold, inv };
}

/**
 * Sync Feasibility Clamp:
 * If customer & chef target the SAME meat, ensure there's at least ONE sold amount that satisfies BOTH.
 * Strategy:
 * - compute customer-implied sold bounds
 * - compute chef-implied sold bounds
 * - intersect them
 * - if empty, loosen the CUSTOMER request (first) by clamping toward feasible
 * - if still empty, loosen the CHEF request
 *
 * This mutates the requests in place and also returns them for convenience.
 */
export function applySyncFeasibilityClamp(state, customerReq, chefReq, opts = {}) {
  const step = opts.step ?? 1;

  // only clamp when both are MEAT scope and same meat
  if (customerReq?.scope !== "MEAT" || chefReq?.scope !== "MEAT") return { customerReq, chefReq };
  if (!customerReq.meat || !chefReq.meat) return { customerReq, chefReq };
  if (customerReq.meat !== chefReq.meat) return { customerReq, chefReq };

  const meat = customerReq.meat;
  const inv = state.round.inventory[meat];

  // only clamp when constraints are weight-based (for now)
  const weightish = (r) => r.metric === "SOLD_WEIGHT" || r.metric === "REMAINING_WEIGHT";
  if (!weightish(customerReq) || !weightish(chefReq)) return { customerReq, chefReq };

  // bounds implied by each request
  const c = soldBoundsFromRequest(customerReq, state, meat, step);
  const k = soldBoundsFromRequest(chefReq, state, meat, step);

  // If either is already impossible, bail (let reroll logic handle it)
  if (c.maxSold < c.minSold || k.maxSold < k.minSold) return { customerReq, chefReq };

  const intersectMin = Math.max(c.minSold, k.minSold);
  const intersectMax = Math.min(c.maxSold, k.maxSold);

  // If intersection is non-empty, we're good.
  if (intersectMin <= intersectMax) return { customerReq, chefReq };

  // --- Otherwise, adjust requests to create overlap ---

  // Preferred fix: adjust customer request toward chef feasible region.
  // We try to force customer bounds to fit within [k.minSold, k.maxSold]
  loosenSoldWeightRequestToBounds(customerReq, inv, k.minSold, k.maxSold, step);

  // Recompute customer bounds and check again
  const c2 = soldBoundsFromRequest(customerReq, state, meat, step);
  const iMin2 = Math.max(c2.minSold, k.minSold);
  const iMax2 = Math.min(c2.maxSold, k.maxSold);
  if (iMin2 <= iMax2) return { customerReq, chefReq };

  // If still impossible, loosen chef toward customer region.
  loosenRemainingOrSoldRequestToBounds(chefReq, state, meat, c2.minSold, c2.maxSold, step);

  return { customerReq, chefReq };
}

// --- Helpers to "loosen" requests ---

function loosenSoldWeightRequestToBounds(req, inv, targetMinSold, targetMaxSold, step) {
  const quantize = (x) => Math.round(x / step) * step;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(x, hi));

  if (req.metric !== "SOLD_WEIGHT") return;

  // Make it solvable by clamping req's sold-range into [targetMinSold, targetMaxSold]
  if (req.op === "GTE") {
    // reduce target if it's too high
    req.target = clamp(quantize(req.target), 0, targetMaxSold);
  } else if (req.op === "LTE") {
    // increase cap if it's too low
    req.target = clamp(quantize(req.target), targetMinSold, inv);
  } else if (req.op === "RANGE") {
    let min = clamp(quantize(req.min), 0, inv);
    let max = clamp(quantize(req.max), 0, inv);

    // Clamp to feasible intersection region
    min = clamp(min, 0, targetMaxSold);
    max = clamp(max, targetMinSold, inv);

    if (max < min) {
      // collapse to a single-point-ish range around feasible
      min = targetMinSold;
      max = targetMaxSold;
    }
    req.min = min;
    req.max = max;
  } else if (req.op === "EQ") {
    const tol = req.tolerance ?? step;
    const desired = clamp(quantize(req.target), targetMinSold, targetMaxSold);
    req.target = desired;
    req.tolerance = Math.max(tol, step);
  }
}

function loosenRemainingOrSoldRequestToBounds(req, state, meat, targetMinSold, targetMaxSold, step) {
  const inv = state.round.inventory[meat];
  const quantize = (x) => Math.round(x / step) * step;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(x, hi));

  // If chef request is SOLD_WEIGHT, we can clamp directly like customer.
  if (req.metric === "SOLD_WEIGHT") {
    return loosenSoldWeightRequestToBounds(req, inv, targetMinSold, targetMaxSold, step);
  }

  // If chef request is REMAINING_WEIGHT, convert desired sold bounds into remaining bounds:
  // remaining = inv - sold
  // sold in [targetMinSold, targetMaxSold] => remaining in [inv-targetMaxSold, inv-targetMinSold]
  if (req.metric !== "REMAINING_WEIGHT") return;

  const desiredMinRemain = inv - targetMaxSold;
  const desiredMaxRemain = inv - targetMinSold;

  if (req.op === "GTE") {
    // remaining >= target => make target <= desiredMaxRemain
    req.target = clamp(quantize(req.target), 0, desiredMaxRemain);
  } else if (req.op === "LTE") {
    // remaining <= target => make target >= desiredMinRemain
    req.target = clamp(quantize(req.target), desiredMinRemain, inv);
  } else if (req.op === "RANGE") {
    let min = clamp(quantize(req.min), 0, inv);
    let max = clamp(quantize(req.max), 0, inv);

    // clamp into [desiredMinRemain, desiredMaxRemain]
    min = clamp(min, 0, desiredMaxRemain);
    max = clamp(max, desiredMinRemain, inv);

    if (max < min) {
      min = desiredMinRemain;
      max = desiredMaxRemain;
    }
    req.min = min;
    req.max = max;
  } else if (req.op === "EQ") {
    const tol = req.tolerance ?? step;
    const desired = clamp(quantize(req.target), desiredMinRemain, desiredMaxRemain);
    req.target = desired;
    req.tolerance = Math.max(tol, step);
  }
}
