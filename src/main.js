import './style.scss'

// MEATS list 
const MEATS = [
    "patty", "sausage", "wing", "thigh","steak"
];


const state = {
    round: {
        prices: {
            // price per pound (randomized each round)
            patty: 2.50,
            sausage: 3.10,
            wing: 1.90,
            thigh: 2.20,
            steak: 9.75
        },
        // available meats this round
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
    ],
    roundNumber: 1
    },
    // persona's requested meats this round
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

function setSell(meat, newValue) {
    const available = state.round.inventory[meat];

    const clampedValue = Math.max(0, Math.min(newValue, available));
    state.plan.sell[meat] = clampedValue;

}

function changeSell(meat, delta) {
    // how much we are currently planning to sell
    const current = state.plan.sell[meat];

    setSell(meat, current + delta);
    updateUI(); // update the UI after changing
}

function remainingMeat(meat) {
    return state.round.inventory[meat] - state.plan.sell[meat];
}

function updateUI(){
    for (const meat of MEATS){
        // ordered amount 
        const orderedSpan = document.querySelector(`.${meat}-ordered`);
        if (orderedSpan) {
            orderedSpan.textContent = state.plan.sell[meat];
        }

        // available amount
        const availableSpan = document.getElementById(`${meat}-available`);
        if (availableSpan) {
            availableSpan.textContent = `${state.round.inventory[meat]} lbs`;
        }

        // remaining amount
        const remainingSpan = document.getElementById(`${meat}-remaining`);
        if (remainingSpan) {
            remainingSpan.textContent = `${remainingMeat(meat)} lbs`;
        }
    }
}


// click action
const meatColumn = document.querySelector('.meat-column'); // selecting the meat column 

meatColumn.addEventListener("click", (event) => {
  console.log('Click event on meatColumn, target:', event.target, 'classes:', event.target.classList);
  const clickedElement = event.target.closest('.plus-sign') || event.target.closest('.minus-sign');
  if (!clickedElement) return;

  const clickedPlus = clickedElement.classList.contains('plus-sign');
  const clickedMinus = clickedElement.classList.contains('minus-sign');

  console.log('clickedElement:', clickedElement, 'clickedPlus:', clickedPlus, 'clickedMinus:', clickedMinus);

  const meatPanel = clickedElement.closest(".meat-panel");
  console.log('meatPanel:', meatPanel);
  if (!meatPanel) return;

  const meat = meatPanel.dataset.meat;         // e.g. "patty"
  console.log('meat:', meat);
  if (!meat) return;

  const delta = clickedPlus ? 1 : -1;

  changeSell(meat, delta);
  updateUI();
});

// initial paint
updateUI();


