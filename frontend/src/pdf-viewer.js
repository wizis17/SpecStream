/**
 * pdf-viewer.js — PDF loading, rendering, and page navigation
 * 
 * Uses pdf.js (loaded from CDN in index.html) to render PDF pages
 * onto a canvas element and manage page navigation.
 */

import { get, set, on } from './state.js';

// DOM references (set during init)
let canvas, ctx, pdfViewportContainer, viewerControls, viewerEmptyState;
let pageIndicator, prevPageBtn, nextPageBtn;

// Callbacks
let onPageRendered = null;

/**
 * Initialize the PDF viewer module.
 * @param {Object} opts
 * @param {Function} opts.onPageRendered - Called after a page renders with (scale, pageIdx)
 */
export function initViewer(opts = {}) {
    // Set up pdf.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }

    canvas = document.getElementById('pdf-canvas');
    ctx = canvas.getContext('2d');
    pdfViewportContainer = document.getElementById('pdf-viewport-container');
    viewerControls = document.getElementById('viewer-controls');
    viewerEmptyState = document.getElementById('viewer-empty-state');
    pageIndicator = document.getElementById('page-indicator');
    prevPageBtn = document.getElementById('prev-page');
    nextPageBtn = document.getElementById('next-page');

    onPageRendered = opts.onPageRendered || null;

    // Page navigation buttons
    prevPageBtn.addEventListener('click', prevPage);
    nextPageBtn.addEventListener('click', nextPage);

    // Window resize — debounced re-render
    let resizeTimer;
    window.addEventListener('resize', () => {
        if (get('pdfDoc')) {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => renderCurrentPage(), 300);
        }
    });
}

/**
 * Load a PDF from an ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer 
 */
export async function loadPdf(arrayBuffer) {
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    set('pdfDoc', pdfDoc);
    set('currentPageNum', 1);

    // Show viewer, hide empty state
    viewerEmptyState.style.display = 'none';
    pdfViewportContainer.classList.add('visible');
    viewerControls.classList.add('visible');

    await renderCurrentPage();
}

/**
 * Render the current page.
 */
export async function renderCurrentPage() {
    const pdfDoc = get('pdfDoc');
    const pageNum = get('currentPageNum');
    if (!pdfDoc) return;

    const page = await pdfDoc.getPage(pageNum);

    // Calculate scale to fit container based on parent viewer-panel width
    const viewerPanel = document.getElementById('viewer-panel');
    const containerWidth = viewerPanel ? Math.min(800, viewerPanel.clientWidth - 80) : 600;
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = containerWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: ctx,
        viewport,
    }).promise;

    // Update page indicator
    pageIndicator.textContent = `Page ${pageNum} / ${pdfDoc.numPages}`;

    // Notify overlay module to draw bboxes
    if (onPageRendered) {
        onPageRendered(scale, pageNum - 1);
    }
}

/**
 * Navigate to a specific page.
 * @param {number} pageNum 
 */
export async function goToPage(pageNum) {
    const pdfDoc = get('pdfDoc');
    if (!pdfDoc) return;
    if (pageNum < 1 || pageNum > pdfDoc.numPages) return;

    set('currentPageNum', pageNum);
    await renderCurrentPage();
}

async function prevPage() {
    const current = get('currentPageNum');
    if (current > 1) {
        set('currentPageNum', current - 1);
        await renderCurrentPage();
    }
}

async function nextPage() {
    const pdfDoc = get('pdfDoc');
    const current = get('currentPageNum');
    if (pdfDoc && current < pdfDoc.numPages) {
        set('currentPageNum', current + 1);
        await renderCurrentPage();
    }
}
