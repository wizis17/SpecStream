/**
 * api.js — Backend API communication layer
 * 
 * Wraps all fetch calls to the Python server.py backend.
 * In dev mode, Vite proxy routes these to localhost:8000.
 */

/**
 * Send a PDF to the backend for layout parsing.
 * @param {Blob|File} pdfData - Raw PDF bytes
 * @param {string} mode - 'xycut' or 'naive'
 * @returns {Promise<{hierarchy: Array, metadata: Object}>}
 */
export async function processPdf(pdfData, mode = 'xycut') {
    const response = await fetch(`/process?mode=${mode}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/pdf',
        },
        body: pdfData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(err.error || `Server returned ${response.status}`);
    }

    return response.json();
}

/**
 * Fetch the sample test.pdf from the backend.
 * @returns {Promise<Blob>}
 */
export async function fetchTestPdf() {
    const response = await fetch('/test.pdf');
    if (!response.ok) {
        throw new Error('Could not fetch test.pdf — is server.py running on port 8000?');
    }
    return response.blob();
}
