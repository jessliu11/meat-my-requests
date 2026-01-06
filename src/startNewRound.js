// random helpers
import { MEATS, state, generateRandomSellPlan, derivedState, evaluateRequests } from './gameState.js';
import { updateUI, initializePrices } from './ui.js';
import { generateRequest, applySyncFeasibilityClamp } from './requests.js';


function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function pickOne(arr){
    return arr[randInt(0, arr.length - 1)];
}

function randomizePrices(prices) {
    prices.patty = randFloat(2.0, 5.0);
    prices.sausage = randFloat(2.5, 6.0);
    prices.wing = randFloat(1.5, 4.5);
    prices.thigh = randFloat(2.0, 5.0);
    prices.steak = randFloat(7.0, 15.0);
}

function randomizeInventory(inventory) {
    inventory.patty = randInt(4, 20);
    inventory.sausage = randInt(4, 20);
    inventory.wing = randInt(4, 20);
    inventory.thigh = randInt(4, 20);
    inventory.steak = randInt(2, 10);
}

// reset plan 
function resetPlan(plan, inventory) {
    const randomSell = generateRandomSellPlan(inventory);
    for (const meat of MEATS) {
        plan.sell[meat] = randomSell[meat];        
    }
}

function generateRoundRequests(state, tier = "easy") {
    // pick customer's meat request first
    const customer = generateRequest("customer", state, {
        tier,
        step: 1
    });

     // Sync chef meat with customer's meat sometimes (adds difficulty)
    const syncChance = tier === "easy" ? 0.2 : tier === "medium" ? 0.5 : 0.75;
    const chef = generateRequest("chef", state, {
        tier,
        step: 1,
        preferredMeat: customer.meat, // only used if chef scope MEAT
        syncChance
    });
    // Clamp if synced meat creates impossible overlap
    applySyncFeasibilityClamp(state, customer, chef, { step: 1 });

    const manager = generateRequest("manager", state, { tier, step: 1 });

    return [manager, customer, chef];
}

// // genereate requests 
// function generateRequests(round){
//     // customer wants a specific meat 
//     const customerMeat = pickOne(MEATS);

//     // chef often sync with customer meat to create tension (optional but good)
//     const chefMeat = Math.random() < 0.6 ? customerMeat : pickOne(MEATS);

//     // customer target: 20%-60% of that meat's inventory
//     const customerMax = round.inventory[customerMeat];
//     const customerTarget = Math.max(1, randInt(
//         Math.ceil(customerMax * 0.2),
//         Math.ceil(customerMax * 0.6)
//     ));

//     // chef target: keep 20%-60% of that meat's inventory
//     const chefMax = round.inventory[chefMeat];
//     const chefTarget = Math.max(1, randInt(
//         Math.ceil(chefMax * 0.2),
//         Math.ceil(chefMax * 0.6)
//     ));

//     // manager target: based on rough 'possible revenue'
//     // 15%-35% of total possible revenue is everuthing sold
//     const totalPossibleRevenue = MEATS.reduce((sum, meat) => {
//         return sum + round.prices[meat] * round.inventory[meat];
//     }, 0);
//     const managerTarget = randInt(
//         Math.floor(totalPossibleRevenue * 0.15),
//         Math.floor(totalPossibleRevenue * 0.35)
//     );

//     return [
//         {
//             persona: "manager",
//             type: "SELL_TOTAL_VALUE_AT_LEAST",
//             target: managerTarget // dollars
//         },
//         {
//             persona: "customer",
//             type: "SELL_MEAT_WEIGHT_AT_LEAST",
//             meat: customerMeat,
//             target: customerTarget // pounds
//         },
//         {
//             persona: "chef",
//             type: "KEEP_MEAT_WEIGHT_AT_LEAST",
//             meat: chefMeat,
//             target: chefTarget // pounds
//         }
//     ];
// }

export function startNewRound(tier = "easy") {
    let validRound = false;
    let attempts = 0;
    const maxAttempts = 100; // prevent infinite loop
    
    do {
        randomizePrices(state.round.prices);
        randomizeInventory(state.round.inventory);
        resetPlan(state.plan, state.round.inventory);
        state.round.requests = generateRoundRequests(state, tier);
        
        // Check if at least 2 requests are unmet
        const derived = derivedState(state);
        const results = evaluateRequests(state, derived);
        const unmetCount = Object.values(results).filter(met => met === false).length;
        validRound = unmetCount >= 2;
        
        attempts++;
    } while (!validRound && attempts < maxAttempts);
    
    state.roundNumber += 1;
    initializePrices();
    updateUI();
}

