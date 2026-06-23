/**
 * state.js — Centralized app state with event emitter pattern
 * 
 * All modules read/write through this store and subscribe to changes
 * so they stay decoupled from each other.
 */

const listeners = new Map();

const state = {
    pdfDoc: null,
    currentPageNum: 1,
    currentPdfData: null,    // File or Blob for sending to API
    parsedHierarchy: null,   // Array of tree nodes from backend
    selectedNodeId: null,
    nodeIdCounter: 0,
    isProcessing: false,
};

/**
 * Subscribe to a state key change.
 * @param {string} key 
 * @param {Function} callback - receives (newValue, oldValue)
 * @returns {Function} unsubscribe function
 */
export function on(key, callback) {
    if (!listeners.has(key)) {
        listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);
    return () => listeners.get(key).delete(callback);
}

/**
 * Update a state value and notify listeners.
 * @param {string} key 
 * @param {*} value 
 */
export function set(key, value) {
    const old = state[key];
    state[key] = value;
    if (listeners.has(key)) {
        listeners.get(key).forEach(cb => cb(value, old));
    }
}

/**
 * Get current state value.
 * @param {string} key 
 * @returns {*}
 */
export function get(key) {
    return state[key];
}

/**
 * Assign unique IDs to every node in the hierarchy tree.
 */
export function assignIds(nodes) {
    if (!nodes) return;
    nodes.forEach(node => {
        node.id = `node-${state.nodeIdCounter++}`;
        if (node.children) {
            assignIds(node.children);
        }
    });
}

/**
 * Flatten the hierarchy tree into a single array of all nodes.
 * @param {Array} nodes 
 * @returns {Array}
 */
export function flattenNodes(nodes) {
    const result = [];
    function walk(arr) {
        if (!arr) return;
        arr.forEach(node => {
            result.push(node);
            if (node.children) walk(node.children);
        });
    }
    walk(nodes);
    return result;
}
