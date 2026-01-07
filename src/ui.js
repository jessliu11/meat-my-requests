// filepath: src/ui.js
import { MEATS, state, remainingMeat, derivedState, evaluateRequests } from './gameState.js';
import {OPS, METRICS, SCOPES } from "./requests.js"; // if same file, remove import


function meatLabel(meat) {
  // Simple label mapping; improve later
  const labels = { patty: "patty", sausage: "sausage", wing: "wings", thigh: "thighs", steak: "steak" };
  return labels[meat] ?? meat;
}

function fmtMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

function fmtLbs(n) {
  return `${Number(n)} lb`;
}

export function requestToText(req) {
  const isMoney = req.metric === METRICS.SOLD_VALUE || req.metric === METRICS.REMAINING_VALUE;
  const unit = isMoney ? fmtMoney : fmtLbs;

  const metricPhrase = (() => {
    if (req.metric === METRICS.SOLD_VALUE) return "sell";
    if (req.metric === METRICS.SOLD_WEIGHT) return "sell";
    if (req.metric === METRICS.REMAINING_VALUE) return "keep";
    if (req.metric === METRICS.REMAINING_WEIGHT) return "keep";
    return "do";
  })();

  const scopePhrase = (() => {
    if (req.scope === SCOPES.TOTAL) return "total";
    if (req.scope === SCOPES.MEAT) return meatLabel(req.meat);
    if (req.scope === SCOPES.GROUP) return "selected meats";
    return "";
  })();

  const constraintPhrase = (() => {
    switch (req.op) {
      case OPS.GTE:
        return `at least ${unit(req.target)}`;
      case OPS.LTE:
        return `at most ${unit(req.target)}`;
      case OPS.RANGE:
        return `between ${unit(req.min)} and ${unit(req.max)}`;
      case OPS.EQ: {
        const tol = req.tolerance ?? 0;
        return tol > 0
          ? `about ${unit(req.target)} (± ${unit(tol)})`
          : `exactly ${unit(req.target)}`;
      }
      default:
        return "";
    }
  })();

  if (req.metric === METRICS.SOLD_WEIGHT || req.metric === METRICS.SOLD_VALUE) {
    // Selling
    return req.scope === SCOPES.MEAT
      ? `Sell ${constraintPhrase} of ${scopePhrase}.`
      : `Sell ${constraintPhrase} ${scopePhrase}.`;
  } else {
    // Keeping (remaining)
    return req.scope === SCOPES.MEAT
      ? `Keep ${constraintPhrase} of ${scopePhrase}.`
      : `Keep ${constraintPhrase} ${scopePhrase}.`;
  }
}


export function updateUI() {
    const derived = derivedState(state);

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

    // Don't update persona panel colors during gameplay
    // Only update text
    updatePersonaPanelText();
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


function updatePersonaPanelText() {
    const personas = ['manager', 'customer', 'chef'];
    for (const persona of personas) {
        const panel = document.getElementById(`${persona}-panel`);
        if (!panel) continue;
        
        // Reset to default unmet state (static color)
        panel.className = 'persona-panel unmet';
        
        // Update the <p> text from the request object
        const req = state.round.requests.find(r => r.persona === persona);
        const p = panel.querySelector("p");
        if (req && p) p.textContent = requestToText(req);
    }
}

export function updatePersonaPanels(requestResults) {
    const personas = ['manager', 'customer', 'chef'];
    for (const persona of personas) {
        const panel = document.getElementById(`${persona}-panel`);
        if (panel) {
            panel.className = `persona-panel ${requestResults[persona] ? 'met' : 'unmet'}`;
        }
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