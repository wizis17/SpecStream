/**
 * main.js — SpecStream Frontend Entry Point
 * Matches the UX of specstream-demo.html exactly:
 * - Blueprint style, IBM Plex fonts
 * - XY-cut vs Naive toggle
 * - Legend filter chips
 * - Tabbed right panel (Hierarchy / Reading order / JSON)
 * - Click-to-inspect detail strip
 * - Bidirectional hover sync (canvas bbox ↔ tree)
 */

import './style.css';
import { processPdf, fetchTestPdf } from './api.js';

// ─── Type definitions matching demo ───
const TYPES = {
  title:          { label: 'Title',        color: '#1d3557' },
  subtitle:       { label: 'Subtitle',     color: '#97a1ab' },
  heading1:       { label: 'Heading L1',   color: '#1f7a83' },
  heading2:       { label: 'Heading L2',   color: '#4a9ba6' },
  spec:           { label: 'Spec line',    color: '#8a93a0' },
  'table-header': { label: 'Table header', color: '#b5832c' },
  'table-row':    { label: 'Table row',    color: '#caa15a' },
  warning:        { label: 'Warning',      color: '#c1442d' },
  footnote:       { label: 'Footnote',     color: '#7d6ba8' },
  heading:        { label: 'Heading',      color: '#1f7a83' }, // backend alias
  table:          { label: 'Table',        color: '#b5832c' }, // backend alias
};

// ─── State ───
let pdfDoc = null;
let currentPage = 1;
let currentPdfData = null;
let parsedHierarchy = null;
let flatNodes = [];
let selectedId = null;
let renderScale = 1;
let useXY = true;
let activeFilters = new Set(Object.keys(TYPES));

// ─── DOM refs ───
const pdfUpload       = document.getElementById('pdf-upload');
const uploadLabel     = document.getElementById('upload-label');
const useTestPdfBtn   = document.getElementById('use-test-pdf');
const processBtn      = document.getElementById('process-btn');
const btnNaive        = document.getElementById('btn-naive');
const btnXYCut        = document.getElementById('btn-xycut');
const fileChip        = document.getElementById('file-chip');
const modeLabel       = document.getElementById('mode-label');
const pageIndicator   = document.getElementById('page-indicator');
const pageNav         = document.getElementById('page-nav');
const pageNavLabel    = document.getElementById('page-nav-label');
const prevPageBtn     = document.getElementById('prev-page');
const nextPageBtn     = document.getElementById('next-page');
const blockCount      = document.getElementById('block-count');
const stageEl         = document.getElementById('stage');
const stageEmpty      = document.getElementById('stage-empty');
const canvasWrapper   = document.getElementById('canvas-wrapper');
const pdfCanvas       = document.getElementById('pdf-canvas');
const overlayContainer= document.getElementById('overlay-container');
const detailBox       = document.getElementById('detail-box');
const legendEl        = document.getElementById('legend');
const treeOut         = document.getElementById('tree-out');
const rawOut          = document.getElementById('raw-out');
const jsonOut         = document.getElementById('json-out');
const btnCopyJson     = document.getElementById('btn-copy-json');
const stBlocks        = document.getElementById('st-blocks');
const stPages         = document.getElementById('st-pages');
const stTime          = document.getElementById('st-time');
const stSel           = document.getElementById('st-sel');
const stStatus        = document.getElementById('st-status');

// Docs modal refs
const openDocsBtn     = document.getElementById('open-docs');
const closeDocsBtn    = document.getElementById('close-docs');
const docsModal       = document.getElementById('docs-modal');

// ─── Setup PDF.js worker ───
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

// ─── Status helper ───
function setStatus(msg) {
  if (stStatus) stStatus.textContent = msg;
}

// ─── PDF loading ───
async function loadPdfData(data, name) {
  setStatus(`Loading ${name}…`);
  try {
    const arrayBuffer = data instanceof Blob ? await data.arrayBuffer() : data;
    pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    currentPage = 1;
    stageEmpty.style.display = 'none';
    canvasWrapper.style.display = 'block';
    if (pdfDoc.numPages > 1) pageNav.style.display = 'flex';
    await renderPdfPage(currentPage);
    setStatus(`${name} loaded — ${pdfDoc.numPages} page(s). Click Process Layout.`);
    if (fileChip) fileChip.textContent = `${name} — ${pdfDoc.numPages} page(s)`;
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
}

// ─── Render a PDF page to canvas ───
async function renderPdfPage(num) {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(num);
  const stageWidth = stageEl.clientWidth - 36; // padding
  const unscaled = page.getViewport({ scale: 1 });
  renderScale = Math.min(1.4, stageWidth / unscaled.width);
  const viewport = page.getViewport({ scale: renderScale });

  pdfCanvas.width = viewport.width;
  pdfCanvas.height = viewport.height;

  const ctx = pdfCanvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  pageIndicator.textContent = `${num} / ${pdfDoc.numPages}`;
  pageNavLabel.textContent = `${num} / ${pdfDoc.numPages}`;

  // Re-render overlays after page change
  renderOverlays();
}

// ─── Render bounding box overlays ───
function renderOverlays() {
  overlayContainer.innerHTML = '';
  if (!flatNodes.length) return;

  // Sync overlay container size with canvas
  overlayContainer.style.width = pdfCanvas.width + 'px';
  overlayContainer.style.height = pdfCanvas.height + 'px';

  const pageIdx = currentPage - 1;
  flatNodes.forEach(node => {
    if (!node.bbox || node.bbox.page !== pageIdx) return;
    const typeInfo = TYPES[node.type] || { color: '#888' };
    if (!activeFilters.has(node.type)) return;

    const x = node.bbox.x * renderScale;
    const y = node.bbox.y * renderScale;
    const w = node.bbox.w * renderScale;
    const h = node.bbox.h * renderScale;

    const el = document.createElement('div');
    el.className = 'bbox-overlay';
    el.style.left   = x + 'px';
    el.style.top    = y + 'px';
    el.style.width  = w + 'px';
    el.style.height = h + 'px';
    el.style.borderColor = typeInfo.color;
    el.style.backgroundColor = typeInfo.color + '1a'; // ~10% fill
    el.dataset.nodeId = node._id;
    el.style.pointerEvents = 'auto';

    if (node._id === selectedId) {
      el.classList.add('bbox-selected');
      el.style.backgroundColor = typeInfo.color + '33';
    }

    el.addEventListener('mouseenter', () => {
      el.classList.add('bbox-hover');
      highlightTreeNode(node._id);
    });
    el.addEventListener('mouseleave', () => {
      el.classList.remove('bbox-hover');
      unhighlightTreeNode(node._id);
    });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectNode(node._id);
    });

    overlayContainer.appendChild(el);
  });
}

// ─── Escape HTML ───
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}

// ─── Select a node ───
function selectNode(id) {
  selectedId = id;
  stSel.textContent = id !== null ? ('#' + id) : '—';

  // Update overlay highlights
  document.querySelectorAll('.bbox-overlay').forEach(el => {
    el.classList.remove('bbox-selected');
    const nid = el.dataset.nodeId;
    const node = flatNodes.find(n => n._id == nid);
    if (node) {
      const typeInfo = TYPES[node.type] || { color: '#888' };
      el.style.backgroundColor = typeInfo.color + '1a';
    }
  });

  if (id !== null) {
    const bboxEl = overlayContainer.querySelector(`[data-node-id="${id}"]`);
    if (bboxEl) {
      bboxEl.classList.add('bbox-selected');
      const node = flatNodes.find(n => n._id == id);
      if (node) {
        const typeInfo = TYPES[node.type] || { color: '#888' };
        bboxEl.style.backgroundColor = typeInfo.color + '33';
      }
    }

    // Jump page if needed
    const node = flatNodes.find(n => n._id == id);
    if (node && node.bbox && node.bbox.page + 1 !== currentPage) {
      currentPage = node.bbox.page + 1;
      renderPdfPage(currentPage);
    }
  }

  // Update tree selection
  renderTreeSelection();
  renderRawSelection();

  // Update detail strip
  updateDetail(id);
}

// ─── Update detail / inspector strip ───
function updateDetail(id) {
  if (id === null) {
    detailBox.innerHTML = '<span class="empty">Click a region on the page, or a node in the hierarchy tree, to inspect it.</span>';
    return;
  }
  const node = flatNodes.find(n => n._id == id);
  if (!node) return;

  const typeInfo = TYPES[node.type] || { label: node.type, color: '#888' };

  // Breadcrumb: walk hierarchy to build trail
  const trail = findPath(parsedHierarchy, id) || [];
  const crumbs = trail.slice(1, -1).map(n => n.label).join('  ›  ') || 'Document root';

  const posStr = node.bbox
    ? `page ${node.bbox.page + 1} · x:${Math.round(node.bbox.x)} y:${Math.round(node.bbox.y)} w:${Math.round(node.bbox.w)} h:${Math.round(node.bbox.h)}`
    : '—';

  detailBox.innerHTML =
    `<span class="type-tag" style="background:${typeInfo.color}">${typeInfo.label}</span>` +
    `<span class="crumb">${escapeHtml(crumbs)}</span>` +
    `<div class="text">${escapeHtml(node.label || '')}</div>` +
    `<div class="coords">${posStr}</div>`;
}

function findPath(node, id, trail = []) {
  const here = [...trail, node];
  if (node._id == id) return here;
  for (const c of (node.children || [])) {
    const res = findPath(c, id, here);
    if (res) return res;
  }
  return null;
}

// ─── Tree Highlight helpers ───
function highlightTreeNode(id) {
  const row = treeOut.querySelector(`.node-row[data-id="${id}"]`);
  if (row) row.classList.add('selected');
}

function unhighlightTreeNode(id) {
  if (selectedId == id) return; // keep if actually selected
  const row = treeOut.querySelector(`.node-row[data-id="${id}"]`);
  if (row) row.classList.remove('selected');
}

// ─── Render tree selection ───
function renderTreeSelection() {
  treeOut.querySelectorAll('.node-row').forEach(r => r.classList.remove('selected'));
  if (selectedId === null) return;
  const row = treeOut.querySelector(`.node-row[data-id="${selectedId}"]`);
  if (row) {
    row.classList.add('selected');
    row.scrollIntoView({ block: 'nearest' });
  }
}

function renderRawSelection() {
  rawOut.querySelectorAll('.rawrow').forEach(r => {
    r.classList.toggle('selected', r.dataset.id == selectedId);
  });
}

// ─── Build hierarchy tree DOM ───
function renderTree(hierarchy) {
  treeOut.innerHTML = '';
  if (!hierarchy) return;
  treeOut.appendChild(renderNode(hierarchy));
}

function renderNode(node) {
  const wrap = document.createElement('div');
  wrap.className = 'node';
  wrap.dataset.id = node._id;

  const row = document.createElement('div');
  row.className = 'node-row';
  row.dataset.id = node._id;

  const hasKids = node.children && node.children.length > 0;

  const twist = document.createElement('span');
  twist.className = 'twist';
  twist.textContent = hasKids ? '▾' : '·';
  row.appendChild(twist);

  if (node.type !== 'document') {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = (TYPES[node.type] || {}).color || '#888';
    row.appendChild(dot);
  }

  const labelEl = document.createElement('span');
  labelEl.className = 'label';
  const main = document.createElement('div');
  main.textContent = node.label || node.type;
  labelEl.appendChild(main);
  if (node.type && node.type !== 'document') {
    const small = document.createElement('small');
    small.textContent = (TYPES[node.type] || { label: node.type }).label;
    labelEl.appendChild(small);
  }
  row.appendChild(labelEl);

  // Click: select
  row.addEventListener('click', (e) => {
    e.stopPropagation();
    if (node._id !== undefined && node._id !== 'root') selectNode(node._id);
  });

  // Hover: highlight bbox
  row.addEventListener('mouseenter', () => {
    const bboxEl = overlayContainer.querySelector(`[data-node-id="${node._id}"]`);
    if (bboxEl) bboxEl.classList.add('bbox-hover');
  });
  row.addEventListener('mouseleave', () => {
    const bboxEl = overlayContainer.querySelector(`[data-node-id="${node._id}"]`);
    if (bboxEl && node._id !== selectedId) bboxEl.classList.remove('bbox-hover');
  });

  // Twist toggle
  twist.addEventListener('click', (e) => {
    e.stopPropagation();
    if (hasKids) wrap.classList.toggle('collapsed');
  });

  wrap.appendChild(row);

  if (hasKids) {
    const kids = document.createElement('div');
    kids.className = 'children';
    node.children.forEach(c => kids.appendChild(renderNode(c)));
    wrap.appendChild(kids);
  }

  return wrap;
}

// ─── Render raw reading order ───
function renderRaw(nodes) {
  rawOut.innerHTML = '';
  if (!nodes.length) return;

  nodes.forEach((node, i) => {
    const row = document.createElement('div');
    row.className = 'rawrow';
    row.dataset.id = node._id;

    const typeInfo = TYPES[node.type] || { label: node.type, color: '#888' };

    row.innerHTML =
      `<span class="idx">${i + 1}</span>` +
      `<span class="ty" style="color:${typeInfo.color}">${typeInfo.label}</span>` +
      `<span class="tx">${escapeHtml(node.label || '')}</span>`;

    row.addEventListener('click', () => selectNode(node._id));
    rawOut.appendChild(row);
  });
}

// ─── Legend chips ───
function renderLegend() {
  legendEl.innerHTML = '';
  Object.entries(TYPES).forEach(([key, val]) => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (activeFilters.has(key) ? ' on' : '');
    chip.innerHTML = `<span class="dot" style="background:${val.color}"></span>${val.label}`;
    chip.addEventListener('click', () => {
      if (activeFilters.has(key)) activeFilters.delete(key);
      else activeFilters.add(key);
      renderLegend();
      renderOverlays();
    });
    legendEl.appendChild(chip);
  });
}

// ─── Flatten hierarchy to array ───
function flatten(nodes, arr = []) {
  if (!nodes) return arr;
  nodes.forEach(n => {
    arr.push(n);
    if (n.children) flatten(n.children, arr);
  });
  return arr;
}

// ─── Assign unique IDs to nodes ───
let _idCounter = 0;
function assignIds(nodes) {
  if (!nodes) return;
  nodes.forEach(n => {
    n._id = _idCounter++;
    if (n.children) assignIds(n.children);
  });
}

// ─── Process layout from backend ───
async function processLayout() {
  if (!currentPdfData) {
    setStatus('Please upload or load a PDF first.');
    return;
  }

  setStatus('Sending to SpecStream layout parser…');
  const t0 = performance.now();

  try {
    const mode = useXY ? 'xycut' : 'naive';
    const data = await processPdf(currentPdfData, mode);
    const elapsed = ((performance.now() - t0) / 1000).toFixed(2);

    _idCounter = 0;
    parsedHierarchy = { _id: 'root', type: 'document', label: 'Document', children: data.hierarchy };
    assignIds(parsedHierarchy.children);

    // Also give root an _id so tree renders cleanly
    parsedHierarchy._id = 'root';

    flatNodes = flatten(data.hierarchy);

    blockCount.textContent = flatNodes.length + ' blocks';
    stBlocks.textContent = flatNodes.length;
    stPages.textContent = data.metadata?.pages_processed ?? '—';
    stTime.textContent = elapsed + 's';

    renderLegend();
    renderTree(parsedHierarchy);
    renderRaw(flatNodes);
    jsonOut.textContent = JSON.stringify(data.hierarchy, null, 2);
    renderOverlays();

    setStatus('Layout parsed — ' + flatNodes.length + ' blocks in ' + elapsed + 's');
    modeLabel.textContent = useXY ? 'XY-CUT ORDER' : 'NAIVE SCAN ORDER';
  } catch (err) {
    setStatus('Error: ' + err.message);
    console.error(err);
  }
}

// ─── Event Listeners ───

// File upload
uploadLabel.addEventListener('click', () => {
  pdfUpload.click();
});

pdfUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  currentPdfData = file;
  const buf = await file.arrayBuffer();
  await loadPdfData(new Blob([buf]), file.name);
  modeLabel.textContent = 'UPLOADED PDF';
});

// Sample PDF
useTestPdfBtn.addEventListener('click', async () => {
  setStatus('Fetching sample PDF…');
  try {
    const blob = await fetchTestPdf();
    currentPdfData = blob;
    await loadPdfData(blob, 'sample.pdf');
    modeLabel.textContent = 'SAMPLE DATASHEET';
  } catch (err) {
    setStatus('Error: ' + err.message);
  }
});

// Process
processBtn.addEventListener('click', processLayout);

// XY-cut vs Naive toggle
btnXYCut.addEventListener('click', () => {
  useXY = true;
  btnXYCut.classList.add('active');
  btnNaive.classList.remove('active');
  if (parsedHierarchy) processLayout();
});

btnNaive.addEventListener('click', () => {
  useXY = false;
  btnNaive.classList.add('active');
  btnXYCut.classList.remove('active');
  if (parsedHierarchy) processLayout();
});

// Page navigation
prevPageBtn.addEventListener('click', async () => {
  if (pdfDoc && currentPage > 1) {
    currentPage--;
    await renderPdfPage(currentPage);
  }
});

nextPageBtn.addEventListener('click', async () => {
  if (pdfDoc && currentPage < pdfDoc.numPages) {
    currentPage++;
    await renderPdfPage(currentPage);
  }
});

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tabpane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const pane = document.querySelector(`.tabpane[data-tab="${tab.dataset.tab}"]`);
    if (pane) pane.classList.add('active');
  });
});

// Download JSON
btnCopyJson.addEventListener('click', () => {
  if (!parsedHierarchy) return;
  const blob = new Blob([jsonOut.textContent], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'specstream-hierarchy.json';
  a.click();
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key === 'ArrowRight') nextPageBtn.click();
  if (e.key === 'ArrowLeft') prevPageBtn.click();
  if (e.key === 'Escape') {
    if (docsModal && docsModal.classList.contains('open')) {
      docsModal.classList.remove('open');
    } else {
      selectNode(null);
    }
  }
});

// Docs modal events
if (openDocsBtn && closeDocsBtn && docsModal) {
  openDocsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    docsModal.classList.add('open');
  });

  closeDocsBtn.addEventListener('click', () => {
    docsModal.classList.remove('open');
  });

  docsModal.addEventListener('click', (e) => {
    if (e.target === docsModal) {
      docsModal.classList.remove('open');
    }
  });
}

// ─── Init ───
renderLegend();
setStatus('Ready — upload or load a PDF to begin.');
