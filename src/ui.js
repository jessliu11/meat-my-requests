// filepath: src/ui.js
import { MEATS, state, remainingMeat, derivedState, evaluateRequests } from './gameState.js';

export function updateUI() {
    const derived = derivedState(state);
    const requestResults = evaluateRequests(state, derived)

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
}

function updatePersonaPanels(requestResults) {
    const personas = ['manager', 'customer', 'chef'];
    for (const persona of personas) {
        const panel = document.getElementById(`${persona}-panel`);
        if (panel) {
            const statusElement = panel.querySelector('.status') || createStatusElement(panel);
            statusElement.textContent = requestResults[persona] ? '✅' : '❌';
            statusElement.className = `status ${requestResults[persona] ? 'met' : 'not met'}`;
        }
    }
}

function createStatusElement(panel) {
    const status = document.createElement('span');
    status.className = 'status';
    panel.appendChild(status);
    return status;
}

export function initializePrices() {
    for (const meat of MEATS) {
        const priceSpan = document.getElementById(`${meat}-price`);
        if (priceSpan) {
            priceSpan.textContent = `$${state.round.prices[meat].toFixed(2)} / lb`;
        }
    }
}