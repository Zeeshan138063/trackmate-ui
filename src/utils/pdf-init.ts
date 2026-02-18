import * as pdfjsLib from 'pdfjs-dist';

// Use Vite's ?url import to get the correct path to the worker file from node_modules.
// This is the recommended way to handle workers in Vite when they are part of a package.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

/**
 * Initializes the PDF.js library with the correct worker source.
 * This should be called before any PDF processing functions are used.
 */
export const initPdfWorker = () => {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
};

// Also export the library for convenience
export { pdfjsLib };
