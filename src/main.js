import { round } from 'three/tsl';
import './style.scss'

// MEATS list 
const MEATS = [
    "patty", "sausage", "chickenWing", "chickenThigh","steak"
];

const state = {
    round: {
        // price per pound (randomized each round)
        patty: 2.50,
        sausage: 3.10,
        chickenWing: 1.90,
        chickenThigh: 2.20,
        steak: 9.75
    },
    // available meats this round
    inventory: {
        patty: 4,
        sausage: 12,
        chickenWing: 18,
        chickenThigh: 15,
        steak: 3
    },

    // persona's requested meats this round
    requests: [
        {
            person: "manager",
            type: "SELL_TOTAL_VALUE_AT_LEAST",
            target: 30 // dollars
        },
        {
            persona: "customer",
            type: "SELL_MEAT_WEIGHT_AT_LEAST",
            meat: "chickenWing",
            target: 5 // pounds
        },
        {
            persona: "chef",
            type: "KEEP_MEAT_WEIGHT_AT_LEAST",
            meat: "steak",
            target: 2 // pounds
        }
    ],
    plan: {
        sell: {
            patty: 0,
            sausage: 0,
            chickenWing: 0, 
            chickenThigh: 0,
            steak: 0
        }
    }
};

// round information 
