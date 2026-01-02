// filepath: src/main.js
import './style.scss';
import { MEATS } from './gameState.js';
import { initializePrices, updateUI } from './ui.js';
import { changeSell } from './gameLogic.js';

// Initialize prices
initializePrices();

// Event listeners
const meatColumn = document.querySelector('.meat-column');
meatColumn.addEventListener("click", (event) => {
    const clickedElement = event.target.closest('.plus-sign') || event.target.closest('.minus-sign');
    if (!clickedElement) return;

    const clickedPlus = clickedElement.classList.contains('plus-sign');
    const clickedMinus = clickedElement.classList.contains('minus-sign');

    const meatPanel = clickedElement.closest(".meat-panel");
    if (!meatPanel) return;

    const meat = meatPanel.dataset.meat;
    if (!meat) return;

    const delta = clickedPlus ? 1 : -1;
    changeSell(meat, delta);
});

// Initial UI update
updateUI();