
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
        return extractTextFromPdf(file);
    } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
    ) {
        return extractTextFromDocx(file);
    } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
    }
}

async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        let pageText = '';
        let lastY = -1;

        for (const item of items) {
            const currentY = item.transform[5];

            if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
                pageText += '\n';
            } else if (lastY !== -1) {
                pageText += ' ';
            }

            pageText += item.str;
            lastY = currentY;
        }

        // Also extract links from annotations (very common for LinkedIn/GitHub)
        const annotations = await page.getAnnotations();
        const links = annotations
            .filter((annot: any) => annot.subtype === 'Link' && annot.url)
            .map((annot: any) => annot.url);

        if (links.length > 0) {
            pageText += '\n[Links found: ' + links.join(', ') + ']';
        }

        fullText += pageText + '\n\n';
    }

    return fullText;
}

async function extractTextFromDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}
