
# Meat My Requests – Product & Technical Documentation

## 1. Game Overview

**Meat My Requests** is an endless, meat-centric, logic puzzle web game.

Each round, the player acts as a butcher deciding how much of each meat to sell.
The goal is to satisfy **three personas simultaneously**, each with one constraint-based request, using limited inventory and randomized prices.

The game is designed to be:

* Endless and replayable
* Deterministic per round (seedable later)
* Learnable in seconds, challenging over time
* Fully playable without a backend (front-end only)

---

## 2. Core Game Loop

1. A round is generated with:

   * Random prices per meat (price per pound)
   * Random available inventory per meat
   * Exactly **one request per persona**

2. The player adjusts how many pounds of each meat to sell using +/- controls.

3. The game evaluates whether all persona requests are satisfied **in real time**.

4. If all requests are satisfied:

   * The round is successful
   * Player proceeds to the next round
   * Difficulty may increase gradually

5. The game continues indefinitely until the player fails or quits.

---

## 3. Meat Types

The game currently supports **five meat types**:

* patty
* sausage
* wing
* thigh
* steak

All game logic uses these keys consistently.

---

## 4. Personas & Requests

Each round has **exactly one request per persona**.

### Personas

* **Manager**

  * Focus: total sales / revenue goals
* **Customer**

  * Focus: specific meat quantities they want to buy
* **Chef**

  * Focus: reserving inventory for kitchen use (meat that must remain unsold)

### Request Philosophy

Requests are:

* Constraint-based (not scripted outcomes)
* Evaluated against player choices
* Data-driven (not hard-coded logic branches)

---

## 5. Request Types (Initial Set)

Requests are represented as objects with a `type` and parameters.

Initial request types implemented or planned:

* `SELL_TOTAL_VALUE_AT_LEAST`

  * Example: “Sell at least $30 total”
* `SELL_MEAT_WEIGHT_AT_LEAST`

  * Example: “Sell at least 5 lb of wings”
* `KEEP_MEAT_WEIGHT_AT_LEAST`

  * Example: “Keep at least 2 lb of steak unsold”

Additional request types can be added later without changing core UI.

---

## 6. Game State Model

The game uses a single source of truth called `state`.

### `state.round`

Represents the current round’s configuration.

```js
state.round = {
  prices: { meat -> price per lb },
  inventory: { meat -> available lb },
  requests: [ managerRequest, customerRequest, chefRequest ],
  roundNumber: number
}
```

### `state.plan`

Represents the player’s current decisions.

```js
state.plan = {
  sell: { meat -> lb to sell }
}
```

The player never inputs dollars directly — all money values are derived.

---

## 7. Derived Values (Computed, Not Stored)

Derived values are calculated from `state.round` + `state.plan`, such as:

* Total pounds sold
* Total revenue sold
* Remaining pounds per meat
* Revenue sold per meat

These values are recalculated whenever the player changes a sell amount.

---

## 8. UI Architecture Philosophy

* UI is a **pure reflection of state**
* No business logic lives in DOM event handlers
* All clicks update state → state is evaluated → UI re-renders

Event delegation is used for +/- controls to reduce duplication.

---

## 9. Technical Architecture (Current)

* Front-end only (no backend)
* Vanilla JavaScript
* SCSS for styling
* Deterministic game loop (seedable later)
* Local state only (localStorage planned later for streaks)

---

## 10. Current Project Stage (Important Context)

### ✔ Completed

* Phase 1: Core data model (`state.round`, `state.plan`)
* Phase 3: Player input handling (plus/minus buttons)
* Inventory, remaining, and prices update correctly in the UI

### 🚧 In Progress (Current Focus)

* Phase 4: Computing derived values (total lbs, total revenue)
* Phase 5: Evaluating persona requests and marking them as met/unmet
* Live persona feedback (✔ / ❌)

### 🔜 Upcoming

* Phase 6: Central `updateGame()` loop
* Phase 7: Round completion + endless progression
* Difficulty scaling
* Guaranteed solvable round generation

---

## 11. Development Principles

* Prefer **clarity over cleverness**
* Keep constraints data-driven
* Avoid large if/else trees
* Always explain failure clearly to the player
* UI complexity should not increase as difficulty increases

---

## 12. Non-Goals (For Now)

* Multiplayer
* Accounts or authentication
* Backend-driven validation
* Perfect anti-cheat
* Real currency or real pricing accuracy

---

## 13. Next Concrete Engineering Task

Implement:

1. `computeDerived(state)`
2. `evaluateRequests(state, derived)`
3. Persona panel updates with met/unmet state

This will complete the first full playable puzzle loop.

---


