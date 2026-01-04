// filepath: src/ui.js
import { MEATS, state, remainingMeat, derivedState, evaluateRequests } from './gameState.js';

export function updateUI() {
    const derived = derivedState(state);
    const requestResults = evaluateRequests(state, derived)

    updatePersonaRequests(state.round.requests);

    for (const meat of MEATS) {
        const orderedSpan = document.querySelector(`.${meat}-ordered`);
        if (orderedSpan) {
            orderedSpan.textContent = state.plan.sell[meat];
        }

        const availableSpan = document.getElementById(`${meat}-available`);
        if (availableSpan) {
            availableSpan.textContent = `${state.round.inventory[meat]} lbs`;
        }

        const remainingSpan = document.getElementById(`${meat}-remaining`);
        if (remainingSpan) {
            remainingSpan.textContent = `${remainingMeat(meat)} lbs`;
        }
    }

    // update persona panels
    updatePersonaPanels(requestResults);
    //update order summary
    updateOrderSummary(derived);
}

function updatePersonaRequests(requests) {
    for (const request of requests) {
        const panel = document.getElementById(`${request.persona}-panel`);
        if (!panel) continue;

        let textEl = panel.querySelector('p');
        if (!textEl) {
            textEl = document.createElement('p');
            panel.appendChild(textEl);
        }
        textEl.textContent = formatRequestText(request);
    }
}

function formatRequestText(request) {
    switch (request.type){
        case "SELL_TOTAL_VALUE_AT_LEAST":
            return `Sell at least $${request.target} total.`;
        case "SELL_MEAT_WEIGHT_AT_LEAST":
            return `Sell at least ${request.target} lbs of ${request.meat}.`;
        case "KEEP_MEAT_WEIGHT_AT_LEAST":
            return `Keep at least ${request.target} lbs of ${request.meat}.`;
        default:
            return "New request available.";
    }
}
function updatePersonaPanels(requestResults) {
    const personas = ['manager', 'customer', 'chef'];
    for (const persona of personas) {
        const panel = document.getElementById(`${persona}-panel`);
        if (panel) {
            panel.className = `persona-panel ${requestResults[persona] ? 'met' : 'unmet'}`;
        }
    }

    // Show success panel if all requests are met
    const allMet = personas.every(persona => requestResults[persona]);
    const successPanel = document.querySelector('.success-panel');
    if (successPanel) {
        successPanel.style.display = allMet ? 'block' : 'none';
    }
}

function updateOrderSummary(derived) {
  for (const meat of MEATS) {
    const summaryEl = document.getElementById(`summary-${meat}-ordered`);
    if (!summaryEl) continue;

    const meatData = derived.byMeat[meat];

    summaryEl.textContent =
      `$${meatData.revenueSold.toFixed(2)} , ${meatData.soldPounds} lbs`;
  }

    const totalAmountEl = document.getElementById("total-amount");
    if (totalAmountEl) totalAmountEl.textContent = `$${derived.totalRevenueSold.toFixed(2)}`;

    const totalLbsEl = document.getElementById("total-value");
    if (totalLbsEl) totalLbsEl.textContent = `${derived.totalPoundsSold} lbs`;

    const totalRemainingEl = document.getElementById("total-remaining");
    if (totalRemainingEl) totalRemainingEl.textContent = `$${derived.totalRemainingValue.toFixed(2)}`;
}

export function initializePrices() {
    for (const meat of MEATS) {
        const priceSpan = document.getElementById(`${meat}-price`);
        if (priceSpan) {
            priceSpan.textContent = `$${state.round.prices[meat].toFixed(2)} / lb`;
        }
    }
}