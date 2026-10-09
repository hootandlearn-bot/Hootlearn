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

const PdfViewer = ({ documentData, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [viewMode, setViewMode] = useState('thumbnails');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageWidth, setPageWidth] = useState(400);
  const [thumbWidth, setThumbWidth] = useState(220);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      let newWidth = (w - 150) / 2;
      if (newWidth > 600) newWidth = 600;
      
      if (w < 768) {
        newWidth = w - 40; // less padding on mobile
        setThumbWidth(140);
      } else {
        setThumbWidth(220);
      }
      setPageWidth(newWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openPage = (pageNum) => {
    let leftPage;
    if (pageNum === 1) leftPage = 1;
    else if (pageNum % 2 === 0) leftPage = pageNum;
    else leftPage = pageNum - 1;
    
    setCurrentPage(leftPage);
    setViewMode('reading');
  };

  const goNext = () => {
    if (currentPage === 1 && numPages >= 2) setCurrentPage(2);
    else if (currentPage + 2 <= numPages) setCurrentPage(currentPage + 2);
  };

  const goPrev = () => {
    if (currentPage === 2) setCurrentPage(1);
    else if (currentPage - 2 > 1) setCurrentPage(currentPage - 2);
  };

  return (
    <div className="pdf-reader-container">
      {/* UNIFIED HEADER TOOLBAR */}
      <div className="pdf-reading-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {viewMode === 'reading' ? (
            <button onClick={() => setViewMode('thumbnails')} className="pdf-back-btn">
              &larr; Overview
            </button>
          ) : (
            <button onClick={onClose} className="pdf-back-btn">
              &larr; Back
            </button>
          )}
          <h3 className="pdf-header-title">{documentData.title}</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {viewMode === 'reading' && numPages && (
            <div className="pdf-page-indicator">
              {currentPage === 1 ? 'Page 1' : `Pages ${currentPage} - ${Math.min(currentPage + 1, numPages)}`} of {numPages}
            </div>
          )}
          {documentData.actionType === 'download' && (
            <a 
              href={documentData.fileUrl} 
              download={documentData.title}
              target="_blank"
              rel="noreferrer"
              className="pdf-download-btn-viewer"
            >
              &#11015; Download
            </a>
          )}
        </div>
      </div>

      <Document 
        file={documentData.fileUrl} 
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadProgress={({ loaded, total }) => {
          if (total) setLoadProgress(Math.round((loaded / total) * 100));
        }}
        loading={<LoadingProgress progress={loadProgress} />}
        className="pdf-document-wrapper"
      >
        {numPages && (
          viewMode === 'thumbnails' ? (
            <div className="pdf-thumbnail-view">
              <div className="pdf-thumbnail-grid">
                {Array.from(new Array(numPages), (el, index) => (
                  <div key={`thumb-${index}`} className="pdf-thumb-card" onClick={() => openPage(index + 1)}>
                    <Page 
                      pageNumber={index + 1} 
                      width={thumbWidth} 
                      renderTextLayer={false} 
                      renderAnnotationLayer={false} 
                      className="pdf-thumb-img"
                    />
                    <div className="pdf-thumb-label">Page {index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pdf-reading-view">
              
              <div className="pdf-spread-container">
                <button className="pdf-nav-btn prev-btn" onClick={goPrev} disabled={currentPage === 1}> &#10094; </button>
                
                <div className="pdf-spread-scroll-area">
                  <div className="pdf-spread">
                    {currentPage === 1 ? (
                      <div className="pdf-page-wrapper single-cover">
                        <Page pageNumber={1} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                      </div>
                    ) : (
                      <>
                        <div className="pdf-page-wrapper left-page">
                          <Page pageNumber={currentPage} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                        </div>
                        {currentPage + 1 <= numPages && (
                          <div className="pdf-page-wrapper right-page">
                            <Page pageNumber={currentPage + 1} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <button className="pdf-nav-btn next-btn" onClick={goNext} disabled={(currentPage === 1 && numPages < 2) || (currentPage > 1 && currentPage + 2 > numPages)}> &#10095; </button>
              </div>
            </div>
          )
        )}
      </Document>
    </div>
  );
};

export default PdfViewer;
