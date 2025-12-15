import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker source. 
// In a Vite environment, we can point to the unpkg CDN for the worker to avoid complex build config.
// Make sure the version matches the installed package version.
// For simplicity in this setup, we'll try to use the one from node_modules if possible, 
// but often the CDN approach is most robust for instant usage without config changes.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw new Error("Failed to read PDF file. Please ensure it is a valid PDF.");
    }
};
