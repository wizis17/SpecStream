/**
 * inspector.js — Inspector panel population
 * 
 * Populates the inspector details pane when a document node is selected.
 */

import { get, on, flattenNodes } from './state.js';

let inspectorContent = null;

/**
 * Initialize the inspector module.
 */
export function initInspector() {
    inspectorContent = document.getElementById('inspector-content');

    // Subscribe to state change
    on('selectedNodeId', (nodeId) => {
        updateInspector(nodeId);
    });
}

/**
 * Update the inspector UI based on the selected node.
 * @param {string|null} nodeId - ID of the selected node
 */
function updateInspector(nodeId) {
    if (!inspectorContent) return;

    if (!nodeId) {
        inspectorContent.innerHTML = 'Click a bounding box or outline node to inspect details.';
        inspectorContent.className = 'inspector-placeholder';
        return;
    }

    const hierarchy = get('parsedHierarchy');
    if (!hierarchy) return;

    const flatNodes = flattenNodes(hierarchy);
    const node = flatNodes.find(n => n.id === nodeId);

    if (!node) {
        inspectorContent.innerHTML = 'Click a bounding box or outline node to inspect details.';
        inspectorContent.className = 'inspector-placeholder';
        return;
    }

    inspectorContent.className = ''; // remove placeholder styling

    const formatCoord = (val) => (typeof val === 'number' ? val.toFixed(1) : 'N/A');

    inspectorContent.innerHTML = `
        <div class="inspector-grid">
            <span class="inspector-label">Type:</span>
            <span class="inspector-value">
                <span class="tree-badge badge-${node.type}">${node.type}</span>
            </span>
            
            <span class="inspector-label">Page:</span>
            <span class="inspector-value">${node.page + 1}</span>
            
            <span class="inspector-label">Position:</span>
            <span class="inspector-value mono">x: ${formatCoord(node.bbox?.x)}, y: ${formatCoord(node.bbox?.y)}</span>
            
            <span class="inspector-label">Size:</span>
            <span class="inspector-value mono">w: ${formatCoord(node.bbox?.w)}, h: ${formatCoord(node.bbox?.h)}</span>
            
            ${node.heading_depth ? `
            <span class="inspector-label">Depth:</span>
            <span class="inspector-value">${node.heading_depth}</span>
            ` : ''}
            
            <span class="inspector-text-label">Text content:</span>
            <div class="inspector-text-block">${escapeHtml(node.label || '')}</div>
        </div>
    `;
}

/**
 * Helper to escape HTML tags in text.
 * @param {string} text 
 * @returns {string}
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
