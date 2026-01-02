// filepath: src/gameLogic.js
import { setSell, state } from './gameState.js';
import { updateUI } from './ui.js';

export function changeSell(meat, delta) {
    const current = state.plan.sell[meat];
    setSell(meat, current + delta);
    updateUI();
}