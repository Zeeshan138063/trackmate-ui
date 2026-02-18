import * as pdfjsLib from 'pdfjs-dist';

// Vite-aware resolution of the local worker
// The ?url suffix tells Vite to bundle the file and return the URL
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

/**
 * Initializes the PDF.js library with the correct worker source.
 * This should be called before any PDF processing functions are used.
 */
export const initPdfWorker = () => {
    if (pdfjsLib.GlobalWorkerOptions.workerSrc) return;

    // Use official PDF.js CDN URL based on the current version as a fallback.
    // This solves the issue where local .mjs files fail to fetch in Incognito mode
    // or when the server's MIME-type configuration is incorrect.
    const cdnUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    // We prefer the local worker, but if pdfWorkerUrl resolution is somehow compromised,
    // or in environments where local workers are blocked, the CDN is our safety net.
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || cdnUrl;
};


// Also export the library for convenience
export { pdfjsLib };
