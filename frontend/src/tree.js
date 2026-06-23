/**
 * tree.js — Sidebar tree outline rendering
 * 
 * Handles rendering the layout tree structure, expand/collapse toggles,
 * and synchronizing tree selection with the state and overlays.
 */

import { get, set, on, flattenNodes } from './state.js';

let treeContainer = null;
let collapseAllBtn = null;

/**
 * Initialize the tree module.
 */
export function initTree() {
    treeContainer = document.getElementById('tree-container');
    collapseAllBtn = document.getElementById('collapse-all-btn');

    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', collapseAll);
    }

    // React to selectedNodeId changes to update UI classes and expansion
    on('selectedNodeId', (newId) => {
        if (!newId) {
            document.querySelectorAll('.tree-item').forEach(el => {
                el.classList.remove('tree-selected');
            });
            return;
        }

        // Highlight selected item
        document.querySelectorAll('.tree-item').forEach(el => {
            el.classList.remove('tree-selected');
        });

        const selectedLi = treeContainer.querySelector(`[data-node-id="${newId}"]`);
        if (selectedLi) {
            selectedLi.classList.add('tree-selected');
            
            // Scroll into view
            selectedLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Ensure all parent directories/folders are expanded
            let parent = selectedLi.parentElement;
            while (parent && parent !== treeContainer) {
                if (parent.tagName === 'UL' && parent.classList.contains('tree-children')) {
                    parent.style.display = 'block';
                    const toggle = parent.previousElementSibling.querySelector('.tree-toggle');
                    if (toggle) {
                        toggle.textContent = '▼';
                        toggle.classList.add('expanded');
                    }
                }
                parent = parent.parentElement;
            }
        }
    });
}

/**
 * Render the hierarchy tree into the container.
 * @param {Array} nodes - Parsed hierarchy array from state
 */
export function renderHierarchyTree(nodes) {
    if (!treeContainer) return;
    treeContainer.innerHTML = '';

    if (!nodes || nodes.length === 0) {
        treeContainer.innerHTML = `
            <div class="empty-state" style="padding: 1rem 0;">
                <p>Outline empty</p>
            </div>`;
        if (collapseAllBtn) collapseAllBtn.style.display = 'none';
        return;
    }

    if (collapseAllBtn) collapseAllBtn.style.display = 'inline-block';

    const ul = document.createElement('ul');
    ul.className = 'tree-root';

    function buildLi(node) {
        const li = document.createElement('li');
        li.dataset.nodeId = node.id;
        li.className = `tree-item tree-type-${node.type}`;

        const selectedNodeId = get('selectedNodeId');
        if (node.id === selectedNodeId) {
            li.classList.add('tree-selected');
        }

        const header = document.createElement('div');
        header.className = 'tree-item-header';

        // Toggle or Bullet
        if (node.children && node.children.length > 0) {
            const toggle = document.createElement('span');
            toggle.className = 'tree-toggle expanded';
            toggle.textContent = '▼';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent selection click
                const childUl = li.querySelector('.tree-children');
                if (childUl) {
                    if (childUl.style.display === 'none') {
                        childUl.style.display = 'block';
                        toggle.textContent = '▼';
                        toggle.classList.add('expanded');
                    } else {
                        childUl.style.display = 'none';
                        toggle.textContent = '▶';
                        toggle.classList.remove('expanded');
                    }
                }
            });
            header.appendChild(toggle);
        } else {
            const bullet = document.createElement('span');
            bullet.className = 'tree-bullet';
            bullet.innerHTML = '&bull;';
            header.appendChild(bullet);
        }

        // Badge
        const badge = document.createElement('span');
        badge.className = `tree-badge badge-${node.type}`;
        badge.textContent = node.type.toUpperCase();
        header.appendChild(badge);

        // Text
        const textSpan = document.createElement('span');
        textSpan.className = 'tree-text';
        textSpan.textContent = node.label;
        header.appendChild(textSpan);

        li.appendChild(header);

        // Events
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            set('selectedNodeId', node.id);
        });

        // Bidirectional hover: tree -> bbox overlay
        header.addEventListener('mouseenter', () => {
            const overlay = document.querySelector(`.bbox-overlay[data-node-id="${node.id}"]`);
            if (overlay) overlay.classList.add('bbox-hover');
        });

        header.addEventListener('mouseleave', () => {
            const overlay = document.querySelector(`.bbox-overlay[data-node-id="${node.id}"]`);
            if (overlay) overlay.classList.remove('bbox-hover');
        });

        // Children recursion
        if (node.children && node.children.length > 0) {
            const childUl = document.createElement('ul');
            childUl.className = 'tree-children';
            node.children.forEach(child => {
                childUl.appendChild(buildLi(child));
            });
            li.appendChild(childUl);
        }

        return li;
    }

    nodes.forEach(node => {
        ul.appendChild(buildLi(node));
    });
    treeContainer.appendChild(ul);
}

/**
 * Collapse all nodes in the tree structure.
 */
export function collapseAll() {
    if (!treeContainer) return;
    const childUls = treeContainer.querySelectorAll('.tree-children');
    const toggles = treeContainer.querySelectorAll('.tree-toggle');

    childUls.forEach(ul => {
        ul.style.display = 'none';
    });

    toggles.forEach(toggle => {
        toggle.textContent = '▶';
        toggle.classList.remove('expanded');
    });
}
