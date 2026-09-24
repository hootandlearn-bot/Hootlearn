import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PdfViewer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const LoadingProgress = ({ progress }) => {
  const [textIndex, setTextIndex] = useState(0);
  const loadingTexts = [
    "Opening book...",
    "Fetching pages...",
    "Preparing the reader...",
    "Almost there..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div style={{ width: '250px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#3b82f6', transition: 'width 0.2s ease-out' }} />
      </div>
      <div style={{ marginTop: '20px', fontSize: '1rem', color: '#64748b', fontWeight: '500' }}>
        {loadingTexts[textIndex]}
      </div>
    </div>
  );
};

const PdfViewer = ({ documentData }) => {
  const [numPages, setNumPages] = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [pageWidth, setPageWidth] = useState(
    window.innerWidth > 800 ? 800 : window.innerWidth - 20
  );

  useEffect(() => {
    const handleResize = () => {
      setPageWidth(window.innerWidth > 800 ? 800 : window.innerWidth - 20);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScrollToPage = (pageNumber) => {
    const el = document.getElementById(`pdf-page-${pageNumber}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="pdf-reader-container">
      <Document 
        file={documentData.fileUrl} 
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadProgress={({ loaded, total }) => {
            if (total) setLoadProgress(Math.round((loaded / total) * 100));
          }}
          loading={<LoadingProgress progress={loadProgress} />}
          className="pdf-document-wrapper"
        >
          <div className="pdf-reader-layout">
            {/* Left Sidebar (Thumbnails) */}
            <div className="pdf-sidebar">
              {Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`thumb-${index}`} 
                  className="pdf-thumb-wrapper" 
                  onClick={() => handleScrollToPage(index + 1)}
                >
                  <Page 
                    pageNumber={index + 1} 
                    width={100} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false} 
                    className="pdf-thumb-page"
                  />
                  <span className="pdf-thumb-number">{index + 1}</span>
                </div>
              ))}
            </div>
            
            {/* Main Reading Area (Continuous Scroll) */}
            <div className="pdf-main-view">
              {Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`page-${index}`} 
                  id={`pdf-page-${index + 1}`} 
                  className="pdf-full-page"
                >
                  <Page 
                    pageNumber={index + 1} 
                    width={pageWidth} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false} 
                    className="pdf-main-page"
                  />
                  <div className="pdf-page-divider" />
                </div>
              ))}
            </div>
          </div>
        </Document>
    </div>
  );
};

export default PdfViewer;
