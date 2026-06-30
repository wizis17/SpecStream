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

// Spreadsheet state
let sheetWorkbook = null;
let sheetData = [];   // [{name, json, headers}]
let activeSheetIdx = 0;

// ─── DOM refs ───
const spreadsheetWrapper  = document.getElementById('spreadsheet-wrapper');
const sheetTabsEl         = document.getElementById('sheet-tabs');
const sheetTableContainer = document.getElementById('sheet-table-container');
const pdfUpload           = document.getElementById('pdf-upload');
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
const mdOut           = document.getElementById('md-out');
const btnCopyMd       = document.getElementById('btn-copy-md');
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
    renderMarkdown(parsedHierarchy);
    renderOverlays();

    setStatus('Layout parsed — ' + flatNodes.length + ' blocks in ' + elapsed + 's');
    modeLabel.textContent = useXY ? 'XY-CUT ORDER' : 'NAIVE SCAN ORDER';
  } catch (err) {
    setStatus('Error: ' + err.message);
    console.error(err);
  }
}

// ─── Spreadsheet support ──────────────────────────────────────────────────────

async function handleExcelFile(file) {
  if (!window.XLSX) {
    setStatus('Error: SheetJS library not loaded. Check your internet connection.');
    return;
  }
  setStatus(`Parsing ${file.name}…`);
  try {
    const buf = await file.arrayBuffer();
    sheetWorkbook = XLSX.read(buf, { type: 'array' });
    sheetData = sheetWorkbook.SheetNames.map(name => {
      const sheet = sheetWorkbook.Sheets[name];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const headers = json.length ? Object.keys(json[0]) : [];
      return { name, json, headers };
    });
    activeSheetIdx = 0;

    // Switch view
    stageEmpty.style.display = 'none';
    canvasWrapper.style.display = 'none';
    spreadsheetWrapper.style.display = 'flex';
    pageNav.style.display = 'none';

    renderSheetTabs();
    renderSheetTable(0);
    renderSheetTree();
    renderSheetRaw();
    renderSheetJson();

    const totalRows = sheetData.reduce((a, s) => a + s.json.length, 0);
    blockCount.textContent = totalRows + ' rows';
    stBlocks.textContent = totalRows;
    stPages.textContent = sheetWorkbook.SheetNames.length + ' sheet(s)';
    stTime.textContent = '—';
    stSel.textContent = '—';
    if (fileChip) fileChip.textContent = `${file.name} — ${sheetWorkbook.SheetNames.length} sheet(s)`;
    modeLabel.textContent = 'SPREADSHEET';
    setStatus(`Parsed ${sheetWorkbook.SheetNames.length} sheet(s) · ${totalRows} total rows`);
  } catch (err) {
    setStatus(`Error parsing spreadsheet: ${err.message}`);
  }
}

function renderSheetTabs() {
  sheetTabsEl.innerHTML = '';
  if (sheetData.length <= 1) { sheetTabsEl.style.display = 'none'; return; }
  sheetTabsEl.style.display = 'flex';
  sheetData.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn' + (i === activeSheetIdx ? ' active' : '');
    btn.textContent = s.name;
    btn.addEventListener('click', () => {
      activeSheetIdx = i;
      renderSheetTabs();
      renderSheetTable(i);
    });
    sheetTabsEl.appendChild(btn);
  });
}

function renderSheetTable(idx) {
  const { json, headers } = sheetData[idx];
  sheetTableContainer.innerHTML = '';
  if (!json.length) {
    sheetTableContainer.innerHTML = '<div class="sheet-empty">Sheet is empty</div>';
    return;
  }
  const table = document.createElement('table');
  table.className = 'sheet-table';

  const thead = document.createElement('thead');
  const hrow = document.createElement('tr');
  headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; hrow.appendChild(th); });
  thead.appendChild(hrow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  json.forEach((row, ri) => {
    const tr = document.createElement('tr');
    tr.dataset.rowIndex = ri;
    headers.forEach(h => {
      const td = document.createElement('td');
      const val = String(row[h] ?? '');
      td.textContent = val;
      td.title = val;
      tr.appendChild(td);
    });
    tr.addEventListener('click', () => selectSheetRow(idx, ri, row, headers));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  sheetTableContainer.appendChild(table);
}

function selectSheetRow(sheetIdx, rowIdx, row, headers) {
  sheetTableContainer.querySelectorAll('tr.row-selected').forEach(r => r.classList.remove('row-selected'));
  const tr = sheetTableContainer.querySelector(`tr[data-row-index="${rowIdx}"]`);
  if (tr) { tr.classList.add('row-selected'); tr.scrollIntoView({ block: 'nearest' }); }

  treeOut.querySelectorAll('.node-row').forEach(r => r.classList.remove('selected'));
  const treeRow = treeOut.querySelector(`.node-row[data-sheet="${sheetIdx}"][data-row="${rowIdx}"]`);
  if (treeRow) { treeRow.classList.add('selected'); treeRow.scrollIntoView({ block: 'nearest' }); }

  rawOut.querySelectorAll('.rawrow').forEach(r => r.classList.toggle('selected', r.dataset.sheet == sheetIdx && r.dataset.row == rowIdx));

  detailBox.innerHTML =
    `<span class="type-tag" style="background:var(--c-table)">table-row</span>` +
    `<span class="crumb">${escapeHtml(sheetData[sheetIdx].name)}</span>` +
    `<div class="text">${headers.map(h => `<b>${escapeHtml(h)}:</b> ${escapeHtml(String(row[h] ?? ''))}`).join('  ·  ')}</div>`;

  stSel.textContent = `row ${rowIdx + 1}`;
}

function renderSheetTree() {
  treeOut.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'node';
  root.innerHTML = `<div class="node-row"><span class="twist">▾</span><span class="label"><div>Document</div></span></div>`;
  const rootKids = document.createElement('div');
  rootKids.className = 'children';

  sheetData.forEach((sheet, si) => {
    const sheetWrap = document.createElement('div');
    sheetWrap.className = 'node';
    const sheetRow = document.createElement('div');
    sheetRow.className = 'node-row';
    sheetRow.innerHTML =
      `<span class="twist">${sheet.json.length ? '▾' : '·'}</span>` +
      `<span class="dot" style="background:var(--c-table)"></span>` +
      `<span class="label"><div>${escapeHtml(sheet.name)}</div>` +
      `<small>table · ${sheet.json.length} rows × ${sheet.headers.length} cols</small></span>`;
    sheetRow.addEventListener('click', e => {
      e.stopPropagation();
      activeSheetIdx = si;
      renderSheetTabs();
      renderSheetTable(si);
    });
    sheetWrap.appendChild(sheetRow);

    if (sheet.json.length) {
      const kids = document.createElement('div');
      kids.className = 'children';
      kids.style.display = 'none'; // collapsed by default — too many rows to show all
      sheetRow.querySelector('.twist').textContent = '▶';
      sheetRow.querySelector('.twist').addEventListener('click', e => {
        e.stopPropagation();
        const collapsed = kids.style.display === 'none';
        kids.style.display = collapsed ? '' : 'none';
        sheetRow.querySelector('.twist').textContent = collapsed ? '▾' : '▶';
      });

      sheet.json.forEach((row, ri) => {
        const rowWrap = document.createElement('div');
        rowWrap.className = 'node';
        const rowRow = document.createElement('div');
        rowRow.className = 'node-row';
        rowRow.dataset.sheet = si;
        rowRow.dataset.row = ri;
        const preview = sheet.headers.slice(0, 3).map(h => String(row[h] ?? '')).filter(Boolean).join(' · ');
        rowRow.innerHTML = `<span class="twist">·</span><span class="label"><div>${escapeHtml(preview.substring(0, 70))}</div></span>`;
        rowRow.addEventListener('click', e => {
          e.stopPropagation();
          activeSheetIdx = si;
          renderSheetTabs();
          renderSheetTable(si);
          requestAnimationFrame(() => selectSheetRow(si, ri, row, sheet.headers));
        });
        rowWrap.appendChild(rowRow);
        kids.appendChild(rowWrap);
      });
      sheetWrap.appendChild(kids);
    }
    rootKids.appendChild(sheetWrap);
  });

  root.appendChild(rootKids);
  treeOut.appendChild(root);
}

function renderSheetRaw() {
  rawOut.innerHTML = '';
  sheetData.forEach((sheet, si) => {
    sheet.json.forEach((row, ri) => {
      const div = document.createElement('div');
      div.className = 'rawrow';
      div.dataset.sheet = si;
      div.dataset.row = ri;
      const preview = sheet.headers.slice(0, 3).map(h => String(row[h] ?? '')).filter(Boolean).join(' | ');
      div.innerHTML =
        `<span class="idx">${ri + 1}</span>` +
        `<span class="ty" style="color:var(--c-table)">${escapeHtml(sheet.name)}</span>` +
        `<span class="tx">${escapeHtml(preview)}</span>`;
      div.addEventListener('click', () => {
        activeSheetIdx = si;
        renderSheetTabs();
        renderSheetTable(si);
        requestAnimationFrame(() => selectSheetRow(si, ri, row, sheet.headers));
      });
      rawOut.appendChild(div);
    });
  });
}

function renderSheetJson() {
  const data = sheetData.map((s, i) => ({
    type: 'table',
    id: 1000 + i,
    source: 'spreadsheet',
    sheet_name: s.name,
    sheet_index: i,
    row_count: s.json.length,
    col_count: s.headers.length,
    headers: s.headers,
    content: s.json,
  }));
  jsonOut.textContent = JSON.stringify(data, null, 2);
}

function resetSpreadsheetState() {
  sheetWorkbook = null;
  sheetData = [];
  activeSheetIdx = 0;
  spreadsheetWrapper.style.display = 'none';
}

// ─── Markdown support ────────────────────────────────────────────────────────

function hierarchyToMarkdown(nodes, depth = 0) {
  if (!nodes || !nodes.length) return '';
  const parts = [];
  let specBuf = [];

  function flushSpec() {
    if (!specBuf.length) return;
    parts.push(specBuf.join(' '));
    specBuf = [];
  }

  for (const node of nodes) {
    const text = (node.label || node.text || '').trim();
    const type = node.type || 'spec';

    if (type === 'heading') {
      flushSpec();
      const level = Math.min(depth + 1, 6);
      parts.push('#'.repeat(level) + ' ' + text);
    } else if (type === 'warning') {
      flushSpec();
      parts.push('> **WARNING:** ' + text);
    } else if (type === 'footnote') {
      flushSpec();
      parts.push('*' + text + '*');
    } else if (type === 'table' || type === 'table-header' || type === 'table-row') {
      flushSpec();
      parts.push('`' + text + '`');
    } else {
      if (text) specBuf.push(text);
    }

    if (node.children && node.children.length) {
      flushSpec();
      parts.push(hierarchyToMarkdown(node.children, depth + 1));
    }
  }
  flushSpec();
  return parts.join('\n\n');
}

function renderMarkdown(hierarchy) {
  if (!mdOut) return;
  if (!hierarchy || !hierarchy.children) {
    mdOut.textContent = '';
    return;
  }
  mdOut.textContent = hierarchyToMarkdown(hierarchy.children).trim();
}

function parseMdToHierarchy(text) {
  const lines = text.split('\n');
  const root = { type: 'document', label: 'Document', children: [] };
  const stack = [root];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const node = { type: 'heading', label: hMatch[2].trim(), children: [], _mdLevel: level };
      // pop stack until we find a parent of lower heading level
      while (stack.length > 1 && (stack[stack.length - 1]._mdLevel || 0) >= level) stack.pop();
      stack[stack.length - 1].children.push(node);
      stack.push(node);
      continue;
    }

    // Blockquote → warning
    const bqMatch = line.match(/^>\s*(.*)/);
    if (bqMatch) {
      const node = { type: 'warning', label: bqMatch[1].trim(), children: [] };
      stack[stack.length - 1].children.push(node);
      continue;
    }

    // Markdown table row
    if (line.startsWith('|')) {
      const isSep = /^\|[\s\-:|]+\|/.test(line);
      if (!isSep) {
        const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim());
        const node = { type: 'table-row', label: cells.join(' | '), children: [] };
        stack[stack.length - 1].children.push(node);
      }
      continue;
    }

    // Italic-only line → footnote
    if (/^\*[^*]+\*$/.test(line.trim())) {
      const node = { type: 'footnote', label: line.trim().replace(/^\*|\*$/g, ''), children: [] };
      stack[stack.length - 1].children.push(node);
      continue;
    }

    // Default → spec
    const node = { type: 'spec', label: line.trim(), children: [] };
    stack[stack.length - 1].children.push(node);
  }

  return root;
}

async function handleMarkdownFile(file) {
  setStatus(`Parsing ${file.name}…`);
  resetSpreadsheetState();
  try {
    const text = await file.text();
    const hierarchy = parseMdToHierarchy(text);
    _idCounter = 0;
    parsedHierarchy = hierarchy;
    assignIds(parsedHierarchy.children);
    parsedHierarchy._id = 'root';

    flatNodes = flatten(parsedHierarchy.children);
    blockCount.textContent = flatNodes.length + ' blocks';
    stBlocks.textContent = flatNodes.length;
    stPages.textContent = '—';
    stTime.textContent = '0s';

    renderLegend();
    renderTree(parsedHierarchy);
    renderRaw(flatNodes);
    jsonOut.textContent = JSON.stringify(parsedHierarchy.children, null, 2);
    renderMarkdown(parsedHierarchy);

    // Hide PDF viewer, show empty stage
    canvasWrapper.style.display = 'none';
    stageEmpty.style.display = 'flex';
    pageNav.style.display = 'none';
    overlayContainer.innerHTML = '';

    setStatus(`Markdown parsed — ${flatNodes.length} blocks from ${file.name}`);
    modeLabel.textContent = 'MARKDOWN FILE';
    if (fileChip) fileChip.textContent = file.name;
  } catch (err) {
    setStatus('Error: ' + err.message);
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
  e.target.value = ''; // allow re-selecting same file

  const ext = file.name.split('.').pop().toLowerCase();
  if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
    await handleExcelFile(file);
    return;
  }
  if (ext === 'md') {
    await handleMarkdownFile(file);
    return;
  }

  // PDF path — reset any spreadsheet state first
  resetSpreadsheetState();
  currentPdfData = file;
  const buf = await file.arrayBuffer();
  await loadPdfData(new Blob([buf]), file.name);
  modeLabel.textContent = 'UPLOADED PDF';
});

// Sample PDF
useTestPdfBtn.addEventListener('click', async () => {
  resetSpreadsheetState();
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

// Download Markdown
btnCopyMd.addEventListener('click', () => {
  if (!mdOut || !mdOut.textContent) return;
  const blob = new Blob([mdOut.textContent], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'specstream-output.md';
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
