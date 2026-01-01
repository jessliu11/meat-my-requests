import './style.scss'

// MEATS list 
const MEATS = [
    "patty", "sausage", "chickenWing", "chickenThigh","steak"
];

// map to convert from DOM element IDs to meat types
const DOM_TO_MEAT = {
    "patty": "patty",
    "sausage": "sausage",
    "chicken-wing": "chickenWing",
    "chicken-thigh": "chickenThigh",
    "steak": "steak"
};

const state = {
    round: {
        prices: {
            // price per pound (randomized each round)
            patty: 2.50,
            sausage: 3.10,
            chickenWing: 1.90,
            chickenThigh: 2.20,
            steak: 9.75
        },
        // available meats this round
        inventory: {
            patty: 4,
            sausage: 12,
            chickenWing: 18,
            chickenThigh: 15,
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
            meat: "chickenWing",
            target: 5 // pounds
        },
        {
            persona: "chef",
            type: "KEEP_MEAT_WEIGHT_AT_LEAST",
            meat: "steak",
            target: 2 // pounds
        }
    ],
    roundNumber: 1
},
    // persona's requested meats this round
    plan: {
        sell: {
            patty: 0,
            sausage: 0,
            chickenWing: 0, 
            chickenThigh: 0,
            steak: 0
        }
    }
};

function setSell(meat, newValue) {
    const available = state.round.inventory[meat];

    const clampedValue = Math.max(0, Math.min(newValue, available));
    state.plan.sell[meat] = clampedValue;

}

function changeSell(meat, delta) {
    // how much we are currently planning to sell
    const current = state.plan.sell[meat];

    setSell(meat, current + delta);
}

function remainingMeat(meat) {
    return state.round.inventory[meat] - state.plan.sell[meat];
}

function renderPatty(){
    document.querySelectorAll('.patty-ordered').forEach(el => el.textContent = state.plan.sell.patty);
    document.getElementById('patty-remaining').textContent = `${remainingMeat("patty")} lbs`;
}


// click action

