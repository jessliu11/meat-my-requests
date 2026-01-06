// filepath: src/gameState.js
import {OPS, METRICS, SCOPES } from "./requests.js"; // if same file, remove import

export const MEATS = ["patty", "sausage", "wing", "thigh", "steak"];

export function generateRandomSellPlan(inventory) {
    const sell = {};
    for (const meat of MEATS) {
        const maxAmount = inventory[meat];
        sell[meat] = Math.floor(Math.random() * (maxAmount + 1));
    }
    return sell;
}

export const initialState = {
    round: {
        prices: {
            patty: 2.50,
            sausage: 3.10,
            wing: 1.90,
            thigh: 2.20,
            steak: 9.75
        },
        inventory: {
            patty: 4,
            sausage: 12,
            wing: 18,
            thigh: 15,
            steak: 3
        },
        requests: [
            {
                persona: "manager",
                scope: "TOTAL",
                metric: "SOLD_VALUE",
                op: "GTE",
                target: 30
            },
            {
                persona: "customer",
                scope: "MEAT",
                metric: "SOLD_WEIGHT",
                op: "GTE",
                meat: "wing",
                target: 5
            },
            {
                persona: "chef",
                scope: "MEAT",
                metric: "REMAINING_WEIGHT",
                op: "GTE",
                meat: "steak",
                target: 2
            }
        ]
    },
    roundNumber: 1,
    plan: {
        sell: {
            patty: 0,
            sausage: 0,
            wing: 0,
            thigh: 0,
            steak: 0
        }
    }
};

export let state = JSON.parse(JSON.stringify(initialState));
state.plan.sell = generateRandomSellPlan(state.round.inventory);

export function setSell(meat, newValue) {
    const available = state.round.inventory[meat];
    const clampedValue = Math.max(0, Math.min(newValue, available));
    state.plan.sell[meat] = clampedValue;
}

export function remainingMeat(meat) {
    return state.round.inventory[meat] - state.plan.sell[meat];
}


export function derivedState(state) {
  const derived = {
    totalPoundsSold: 0,
    totalRevenueSold: 0,
    totalRemainingPounds: 0,
    totalRemainingValue: 0,
    byMeat: {}
  };

  for (const meat of MEATS) {
    const soldPounds = state.plan.sell[meat];
    const pricePerPound = state.round.prices[meat];
    const inventory = state.round.inventory[meat];

    const remainingPounds = inventory - soldPounds;
    const revenueSold = soldPounds * pricePerPound;
    const remainingValue = remainingPounds * pricePerPound;

    // totals
    derived.totalPoundsSold += soldPounds;
    derived.totalRevenueSold += revenueSold;
    derived.totalRemainingPounds += remainingPounds;
    derived.totalRemainingValue += remainingValue;

    // per-meat breakdown
    derived.byMeat[meat] = {
      soldPounds,
      pricePerPound,
      revenueSold,
      remainingPounds,
      remainingValue
    };
  }

  return derived;
}


// export function evaluateRequests(state, derived) {
//     const results = {};

//     for (const request of state.round.requests){ 
//         let met = false;
//         switch(request.type){
//             case "SELL_TOTAL_VALUE_AT_LEAST":
//                 met = derived.totalRevenueSold >= request.target;
//                 break;
//             case "SELL_MEAT_WEIGHT_AT_LEAST":
//                 met = state.plan.sell[request.meat] >= request.target;
//                 break;
//             case "KEEP_MEAT_WEIGHT_AT_LEAST":
//                 met = derived.byMeat[request.meat].remainingPounds >= request.target;
//                 break;
//             default:
//                 met = false;
//         }
//         results[request.persona] = met; 
//     }
//     return results;
// }

function getMetricValueForMeat(derived, meat, metric) {
  const m = derived.byMeat[meat];
  if (!m) return NaN;

  switch (metric) {
    case METRICS.SOLD_WEIGHT: return m.soldPounds;
    case METRICS.SOLD_VALUE: return m.revenueSold;
    case METRICS.REMAINING_WEIGHT: return m.remainingPounds;
    case METRICS.REMAINING_VALUE: return m.remainingValue;
    default: return NaN;
  }
}

function getMetricValueTotal(derived, metric) {
  switch (metric) {
    case METRICS.SOLD_WEIGHT: return derived.totalPoundsSold;
    case METRICS.SOLD_VALUE: return derived.totalRevenueSold;
    case METRICS.REMAINING_WEIGHT: return derived.totalRemainingPounds;
    case METRICS.REMAINING_VALUE: return derived.totalRemainingValue;
    default: return NaN;
  }
}

function isMetByOp(current, request) {
  if (Number.isNaN(current)) return false;

  switch (request.op) {
    case OPS.GTE:
      return current >= request.target;

    case OPS.LTE:
      return current <= request.target;

    case OPS.RANGE:
      return current >= request.min && current <= request.max;

    case OPS.EQ: {
      const tol = request.tolerance ?? 0;
      return Math.abs(current - request.target) <= tol;
    }

    default:
      return false;
  }
}

export function evaluateRequests(state, derived) {
  const results = {};

  for (const request of state.round.requests) {
    let current = NaN;

    if (request.scope === SCOPES.TOTAL) {
      current = getMetricValueTotal(derived, request.metric);
    } else if (request.scope === SCOPES.MEAT) {
      current = getMetricValueForMeat(derived, request.meat, request.metric);
    } else if (request.scope === SCOPES.GROUP) {
      // Optional future: sum across group meats
      const meats = request.meats ?? [];
      current = meats.reduce((sum, meat) => sum + getMetricValueForMeat(derived, meat, request.metric), 0);
    }

    results[request.persona] = isMetByOp(current, request);
  }

  return results;
}