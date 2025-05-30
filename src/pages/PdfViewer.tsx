import { useState } from 'react';

type SimplePDFViewerProps = {
  pdfUrl: string;
  title: string;
  description?: string;
};

const SimplePDFViewer = ({ pdfUrl, title, description }: SimplePDFViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div className="pdf-viewer w-full max-w-6xl mx-auto">
      <div className="bg-gray-100 p-4 mb-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        {description && <p className="text-gray-700 mb-4">{description}</p>}
        
        <div className="bg-white p-4 rounded-lg shadow" style={{ minHeight: '700px' }}>
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-center py-20">
              <div className="text-red-500 mb-4">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold">Error Loading PDF</p>
                <p className="text-sm mt-2">Unable to display PDF in browser</p>
              </div>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Open PDF in New Tab
              </a>
            </div>
          )}
          
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            width="100%"
            height="650"
            style={{ 
              border: 'none',
              display: isLoading || error ? 'none' : 'block'
            }}
            onLoad={handleLoad}
            onError={handleError}
            title={title}
          />
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            PDF Document: {title}
          </div>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Open in New Tab
          </a>
        </div>
      </div>
    </div>
  );
};

export default SimplePDFViewer;