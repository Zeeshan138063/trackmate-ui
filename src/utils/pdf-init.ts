import * as pdfjsLib from 'pdfjs-dist';

// Vite-aware resolution of the local worker
// The ?url suffix tells Vite to bundle the file and return the URL
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// 1. Initial configuration check
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // Preference 1: Local worker (resolved by Vite)
    // Preference 2: CDN fallback (guaranteed fallback if local fails)
    const cdnUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || cdnUrl;

    console.log('[PDF.js] Worker initialized at module level:', pdfjsLib.GlobalWorkerOptions.workerSrc);
}

/**
 * Initializes the PDF.js library with the correct worker source.
 * Keeps as a no-op for backward compatibility since init now happens at module load.
 */
export const initPdfWorker = () => {
    // Worker is now initialized immediately when this module is imported.
};



// Also export the library for convenience
export { pdfjsLib };
