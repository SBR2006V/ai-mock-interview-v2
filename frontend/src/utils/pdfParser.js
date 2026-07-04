import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker globally
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const extractTextFromPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const typedarray = new Uint8Array(e.target.result);
        
        // Load the PDF document
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';

        // Iterate through each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }

        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};
