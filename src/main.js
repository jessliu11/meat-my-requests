// filepath: src/main.js
import './style.scss';
import { MEATS, state, derivedState, evaluateRequests } from './gameState.js';
import { initializePrices, updateUI, updatePersonaPanels } from './ui.js';
import { changeSell } from './gameLogic.js';
import { startNewRound } from './startNewRound.js';

let currentDifficulty = "easy";
let hasSubmitted = false;

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

// submit button listener
function handleSubmit() {
    const derived = derivedState(state);
    const requestResults = evaluateRequests(state, derived);
    updatePersonaPanels(requestResults);
    
    hasSubmitted = true;
    
    // Replace submit button with difficulty dropdown and restart button
    const actionArea = document.getElementById('action-area');
    if (actionArea) {
        actionArea.innerHTML = `
            <div style="display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap;">
                <select id="difficulty-select" style="padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.2); background: white; font-size: 14px;">
                    <option value="easy" ${currentDifficulty === 'easy' ? 'selected' : ''}>Easy</option>
                    <option value="medium" ${currentDifficulty === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="hard" ${currentDifficulty === 'hard' ? 'selected' : ''}>Hard</option>
                </select>
                <button id="restart-button" style="padding: 8px 16px; border-radius: 8px; border: none; background: #3facac; color: white; font-size: 14px; font-weight: 600; cursor: pointer;">Next Round</button>
            </div>
        `;
        
        // Add event listeners for new elements
        const difficultySelect = document.getElementById('difficulty-select');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                currentDifficulty = e.target.value;
            });
        }
        
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                startNewRound(currentDifficulty);
                hasSubmitted = false;
                
                // Restore submit button
                actionArea.innerHTML = '<button id="submit-order-button">Submit Order</button>';
                const submitBtn = document.getElementById('submit-order-button');
                if (submitBtn) {
                    submitBtn.addEventListener('click', handleSubmit);
                }
            });
        }
    }
}

const submitButton = document.getElementById('submit-order-button');
if (submitButton) {
    submitButton.addEventListener('click', handleSubmit);
}

window.addEventListener("DOMContentLoaded", () => {
    startNewRound(currentDifficulty);
});

// Initial UI update
updateUI();