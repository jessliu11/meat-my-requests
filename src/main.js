// filepath: src/main.js
import './style.scss';
import { MEATS } from './gameState.js';
import { initializePrices, updateUI } from './ui.js';
import { changeSell } from './gameLogic.js';

// Initialize prices
initializePrices();

// Event listeners
const inventoryColumn = document.querySelector('.inventory-column');
inventoryColumn.addEventListener("click", (event) => {
    const clickedElement = event.target.closest('.plus-sign') || event.target.closest('.minus-sign');
    if (!clickedElement) return;

    const clickedPlus = clickedElement.classList.contains('plus-sign');
    const clickedMinus = clickedElement.classList.contains('minus-sign');

    const orderMeatPanel = clickedElement.closest(".order-meat");
    if (!orderMeatPanel) return;

    const meat = orderMeatPanel.dataset.meat;
    if (!meat) return;

    const delta = clickedPlus ? 1 : -1;
    changeSell(meat, delta);
});

// Initial UI update
updateUI();