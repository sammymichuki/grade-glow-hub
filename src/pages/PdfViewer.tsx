import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// Import PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type PDFViewerProps = {
  pdfUrl: string;
  title: string;
  description?: string;
};

const PDFViewer = ({ pdfUrl, title, description }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => Math.min(Math.max(prevPageNumber + offset, 1), numPages || 1));
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale(prevScale => Math.min(prevScale + 0.2, 2.5));
  }

  function zoomOut() {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  }

  return (
    <div className="pdf-viewer">
      <div className="bg-gray-100 p-4 mb-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        {description && <p className="text-gray-700 mb-4">{description}</p>}
        
        <div className="bg-white p-4 rounded-lg shadow">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="flex justify-center py-10">Loading PDF...</div>}
            error={<div className="text-red-500">Failed to load PDF document</div>}
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="mx-auto"
              scale={scale}
            />
          </Document>
        </div>
        
        <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
          <div>
            <p>
              Page {pageNumber} of {numPages || '?'}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={zoomOut}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              aria-label="Zoom out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={zoomIn}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              aria-label="Zoom in"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              disabled={pageNumber <= 1}
              onClick={previousPage}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={pageNumber >= (numPages || 1)}
              onClick={nextPage}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <a
            href={pdfUrl}
            download
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Download PDF
          </a>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;