/**
 * overlay.js — Bounding box overlay rendering
 * 
 * Renders SVG/div bounding boxes over the PDF canvas and synchronizes
 * mouse hover/click states with the sidebar tree and inspector.
 */

import { get, set, on, flattenNodes } from './state.js';

let overlayContainer = null;

/**
 * Initialize the overlay module.
 */
export function initOverlay() {
    overlayContainer = document.getElementById('overlay-container');

    // Subscribe to selection changes to update class names on existing overlay elements
    on('selectedNodeId', (newId, oldId) => {
        if (oldId) {
            const oldEl = overlayContainer.querySelector(`[data-node-id="${oldId}"]`);
            if (oldEl) oldEl.classList.remove('bbox-selected');
        }
        if (newId) {
            const newEl = overlayContainer.querySelector(`[data-node-id="${newId}"]`);
            if (newEl) newEl.classList.add('bbox-selected');
        }
    });
}

/**
 * Render bounding boxes on the overlay layer.
 * @param {number} scale - Current PDF render scale
 * @param {number} pageIdx - 0-indexed page number
 */
export function renderOverlays(scale, pageIdx) {
    if (!overlayContainer) return;
    overlayContainer.innerHTML = '';

    const hierarchy = get('parsedHierarchy');
    if (!hierarchy) return;

    const flatNodes = flattenNodes(hierarchy);
    const selectedNodeId = get('selectedNodeId');

    flatNodes.forEach(node => {
        if (node.page === pageIdx) {
            const bbox = node.bbox;
            if (!bbox) return;

            const x = bbox.x * scale;
            const y = bbox.y * scale;
            const w = bbox.w * scale;
            const h = bbox.h * scale;

            const el = document.createElement('div');
            el.className = `bbox-overlay bbox-${node.type}`;
            if (node.id === selectedNodeId) {
                el.classList.add('bbox-selected');
            }
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.width = `${w}px`;
            el.style.height = `${h}px`;
            el.title = `[${node.type}] ${node.label}`;
            el.dataset.nodeId = node.id;

            // Bidirectional hover: bbox -> tree
            el.addEventListener('mouseenter', () => {
                el.classList.add('bbox-hover');
                const treeItem = document.querySelector(`[data-node-id="${node.id}"]`);
                if (treeItem) treeItem.classList.add('tree-hover');
            });

            el.addEventListener('mouseleave', () => {
                el.classList.remove('bbox-hover');
                const treeItem = document.querySelector(`[data-node-id="${node.id}"]`);
                if (treeItem) treeItem.classList.remove('tree-hover');
            });

            // Click: select node
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                set('selectedNodeId', node.id);
            });

            overlayContainer.appendChild(el);
        }
    });
}
