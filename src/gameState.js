// filepath: src/gameState.js
export const MEATS = ["patty", "sausage", "wing", "thigh", "steak"];

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
                type: "SELL_TOTAL_VALUE_AT_LEAST",
                target: 30 // dollars
            },
            {
                persona: "customer",
                type: "SELL_MEAT_WEIGHT_AT_LEAST",
                meat: "wing",
                target: 5 // pounds
            },
            {
                persona: "chef",
                type: "KEEP_MEAT_WEIGHT_AT_LEAST",
                meat: "steak",
                target: 2 // pounds
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

export let state = { ...initialState };

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


export function evaluateRequests(state, derived) {
    const results = {};

    for (const request of state.round.requests){ 
        let met = false;
        switch(request.type){
            case "SELL_TOTAL_VALUE_AT_LEAST":
                met = derived.totalRevenueSold >= request.target;
                break;
            case "SELL_MEAT_WEIGHT_AT_LEAST":
                met = state.plan.sell[request.meat] >= request.target;
                break;
            case "KEEP_MEAT_WEIGHT_AT_LEAST":
                met = derived.byMeat[request.meat].remainingPounds >= request.target;
                break;
            default:
                met = false;
        }
        results[request.persona] = met; 
    }
    return results;
}