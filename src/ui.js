// filepath: src/ui.js
import { MEATS, state, remainingMeat } from './gameState.js';

export function updateUI() {
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
}

export function initializePrices() {
    for (const meat of MEATS) {
        const priceSpan = document.getElementById(`${meat}-price`);
        if (priceSpan) {
            priceSpan.textContent = `$${state.round.prices[meat].toFixed(2)} / lb`;
        }
    }
}